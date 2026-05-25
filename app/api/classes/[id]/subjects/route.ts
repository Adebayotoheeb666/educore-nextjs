import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError, created, conflict } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

// GET /api/classes/[id]/subjects — Get subjects taught in a class
export const GET = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const classId = params?.id ?? "";
    const classDoc = await queryOne("SELECT id, academic_session FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
    if (!classDoc) return notFound("Class not found");

    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session") || (classDoc as any).academic_session || school.academic_session;

    const subjects = await query(
      `SELECT cs.*, s.name, s.code, s.description,
              GROUP_CONCAT(DISTINCT u.id) as teacher_ids,
              GROUP_CONCAT(DISTINCT u.name) as teacher_names,
              COUNT(DISTINCT st.teacher_id) as teacher_count
       FROM class_subjects cs
       LEFT JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN subject_teachers st ON st.subject_id = s.id AND st.class_id = ? AND st.academic_session = ?
       LEFT JOIN users u ON st.teacher_id = u.id
       WHERE cs.class_id = ? AND s.school_id = ? AND cs.academic_session = ?
       GROUP BY cs.id
       ORDER BY cs.sequence, s.name`,
      [classId, session, classId, school.id, session]
    );
    return ok(subjects);
  } catch (err) {
    return serverError(err);
  }
});

// POST /api/classes/[id]/subjects — Add subject to class curriculum
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { subjectId, isCompulsory, sequence, academicSession } = await req.json();
      const classId = params?.id ?? "";

      if (!subjectId) return badRequest("subjectId is required");

      const classDoc = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!classDoc) return notFound("Class not found");

      const subject = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [subjectId, school.id]);
      if (!subject) return notFound("Subject not found");

      const session = academicSession || school.academic_session;

      const existing = await queryOne(
        "SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ? AND academic_session = ?",
        [classId, subjectId, session]
      );
      if (existing) return conflict("Subject already added to this class for this session");

      const id = generateId();
      await execute(
        `INSERT INTO class_subjects (id, class_id, subject_id, is_compulsory, sequence, academic_session, added_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
        [id, classId, subjectId, isCompulsory !== false ? 1 : 0, sequence || null, session]
      );

      return created({ id, classId, subjectId, session });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);

// DELETE /api/classes/[id]/subjects/[subjectId] — Remove subject from class
export const DELETE = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";
      const subjectId = params?.subjectId ?? "";
      const { searchParams } = new URL(req.url);
      const session = searchParams.get("session") || school.academic_session;

      const classDoc = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!classDoc) return notFound("Class not found");

      const curriculumEntry = await queryOne(
        "SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ? AND academic_session = ?",
        [classId, subjectId, session]
      );
      if (!curriculumEntry) return notFound("Subject not found in class curriculum");

      await execute(
        "DELETE FROM class_subjects WHERE id = ?",
        [(curriculumEntry as any).id]
      );

      return ok({ message: "Subject removed from class" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);
