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

    // Get subjects from student_subjects (which are explicitly enrolled)
    // These include both compulsory and optional subjects the student is taking
    const subjects = await query(
      `SELECT DISTINCT s.id, s.name, s.code, cs.is_compulsory,
              t.id as teacher_id, t.name as teacher_name, t.email as teacher_email
       FROM student_subjects ss
       LEFT JOIN subjects s ON ss.subject_id = s.id
       LEFT JOIN class_subjects cs ON ss.subject_id = cs.subject_id AND ss.class_id = cs.class_id
       LEFT JOIN subject_teachers st ON s.id = st.subject_id AND st.class_id = ss.class_id
       LEFT JOIN users t ON st.teacher_id = t.id
       WHERE ss.student_id = ? AND ss.class_id = ? AND s.school_id = ?
       ORDER BY s.name`,
      [studentId, classId, school.id]
    );

    return ok(subjects);
  } catch (err) {
    return serverError(err);
  }
});
