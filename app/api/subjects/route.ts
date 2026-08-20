import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";
import { syncSubjectEnrollment } from "@/lib/services/subjectEnrollmentSync";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");

    if (teacherId) {
      const subjects = await query(
        `SELECT s.*, c.name as class_name,
                GROUP_CONCAT(DISTINCT COALESCE(u.name, u2.name)) as teacher_names,
                GROUP_CONCAT(DISTINCT COALESCE(u.id, u2.id)) as teacher_ids,
                COUNT(DISTINCT COALESCE(st.teacher_id, s.teacher_id)) as teacher_count
         FROM subjects s
         LEFT JOIN classes c ON s.class_id = c.id
         LEFT JOIN subject_teachers st ON st.subject_id = s.id
         LEFT JOIN users u ON st.teacher_id = u.id
         LEFT JOIN users u2 ON s.teacher_id = u2.id
         WHERE s.school_id = ? AND (st.teacher_id = ? OR s.teacher_id = ?)
         GROUP BY s.id ORDER BY s.name`,
        [school.id, teacherId, teacherId]
      );
      return ok(subjects);
    }

    const subjects = await query(
      `SELECT s.*, c.name as class_name, GROUP_CONCAT(u.name) as teacher_names, GROUP_CONCAT(u.id) as teacher_ids, COUNT(DISTINCT st.teacher_id) as teacher_count
       FROM subjects s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN subject_teachers st ON st.subject_id = s.id
       LEFT JOIN users u ON st.teacher_id = u.id
       WHERE s.school_id = ?
       GROUP BY s.id ORDER BY s.name`,
      [school.id]
    );
    return ok(subjects);
  } catch (err) {
    return serverError(err);
  }
});

export const POST = withAuth(async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { name, code, category, classId, isCompulsory } = await req.json();
    if (!name) return badRequest("Subject name is required");

    let classSession: string | null = null;
    if (classId) {
      const classDoc = await queryOne("SELECT academic_session FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!classDoc) return badRequest("Class not found");
      classSession = (classDoc as any).academic_session || school.academic_session || new Date().getFullYear().toString();
    }

    const id = generateId();
    await execute(
      `INSERT INTO subjects (id, name, code, school_id, class_id, is_compulsory, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, name, code || null, school.id, classId || null, isCompulsory !== false ? 1 : 0]
    );

    // If assigning to a class, also insert into class_subjects join table
    if (classId) {
      const session = classSession as string;
      const classSubjectId = generateId();
      const compulsory = isCompulsory !== false ? 1 : 0;
      await execute(
        `INSERT INTO class_subjects (id, class_id, subject_id, is_compulsory, academic_session, added_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
        [classSubjectId, classId, id, compulsory, session]
      );

      // Auto-assign a newly created compulsory subject to all active students in the class
      if (compulsory === 1) {
        await syncSubjectEnrollment(classId, id, session, true);
      }
    }

    return created({ id, name, code: code || null });
  } catch (err) {
    return serverError(err);
  }
});
