import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

type Params = { params: { id: string } };

// GET /api/students/[id]/subjects — student's current subjects and their teachers
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const studentId = params?.id ?? "";

    // Get student's class first
    const student = await query(
      `SELECT u.class_id FROM users u
       WHERE u.id = ? AND u.school_id = ? AND u.role = 'student'`,
      [studentId, school.id]
    );

    if (!student || student.length === 0) return notFound("Student not found");

    const classId = student[0]?.class_id;
    if (!classId) return ok([]);

    // Get subjects offered by the student's class and their teachers
    const subjects = await query(
      `SELECT DISTINCT s.id, s.name, s.code, s.is_compulsory,
              t.id as teacher_id, t.name as teacher_name, t.email as teacher_email
       FROM class_subjects cs
       LEFT JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN subject_teachers st ON s.id = st.subject_id AND st.class_id = cs.class_id
       LEFT JOIN users t ON st.teacher_id = t.id
       WHERE cs.class_id = ? AND s.school_id = ?
       ORDER BY s.name`,
      [classId, school.id]
    );

    return ok(subjects);
  } catch (err) {
    return serverError(err);
  }
});
