import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute, query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const classId = params?.id ?? "";

    const classDoc = await queryOne(
      `SELECT c.*, u.name as teacher_name, u.email as teacher_email
       FROM classes c LEFT JOIN users u ON c.class_teacher_id = u.id
       WHERE c.id = ? AND c.school_id = ?`,
      [classId, school.id]
    );
    if (!classDoc) return notFound("Class not found");

    const session = (classDoc as any).academic_session || school.academic_session;

    // Get enrolled students in this class for the current session
    const students = await query(
      `SELECT u.id, u.name, u.admission_no, u.avatar FROM users u
       INNER JOIN students_classes sc ON sc.student_id = u.id
       WHERE sc.class_id = ? AND u.school_id = ? AND u.role = 'student' AND sc.academic_session = ?
       ORDER BY u.name`,
      [classId, school.id, session]
    );

    // Get curriculum subjects for this class in the current session
    const subjects = await query(
      `SELECT cs.id, cs.subject_id as id, s.name, s.code, cs.is_compulsory
       FROM class_subjects cs
       LEFT JOIN subjects s ON cs.subject_id = s.id
       WHERE cs.class_id = ? AND s.school_id = ? AND cs.academic_session = ?
       ORDER BY s.name`,
      [classId, school.id, session]
    );

    return ok({ ...classDoc, students, subjects });
  } catch (err) {
    return serverError(err);
  }
});

export const PATCH = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!existing) return notFound("Class not found");

      const { name, arm, level, classTeacher } = await req.json();
      await execute(
        `UPDATE classes SET
           name = COALESCE(?, name),
           section = COALESCE(?, section),
           level = COALESCE(?, level),
           class_teacher_id = COALESCE(?, class_teacher_id),
           updated_at = datetime('now')
         WHERE id = ?`,
        [name || null, arm || null, level || null, classTeacher || null, id]
      );

      const updated = await queryOne(
        "SELECT c.*, u.name as teacher_name FROM classes c LEFT JOIN users u ON c.class_teacher_id = u.id WHERE c.id = ?",
        [id]
      );
      return ok(updated);
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "school_owner"]
);

export const DELETE = withAuth(
  async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!existing) return notFound("Class not found");
      await execute("DELETE FROM classes WHERE id = ?", [id]);
      return ok({ message: "Class deleted" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "school_owner"]
);
