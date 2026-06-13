import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
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

    const classId = (student[0]?.class_id ?? "") as string;
    if (!classId) return ok([]);

    const classDoc = await queryOne<{ academic_session: string | null }>(
      `SELECT academic_session FROM classes WHERE id = ? AND school_id = ?`,
      [classId, school.id]
    );

    const session = classDoc?.academic_session || school.academic_session || new Date().getFullYear().toString();

    // Get subjects from class curriculum and explicit student enrollments.
    // This ensures students see subjects assigned to their class even if student_subjects has not been created yet.
    const subjects = await query(
      `SELECT DISTINCT s.id, s.name, s.code, cs.is_compulsory,
              t.id as teacher_id, t.name as teacher_name, t.email as teacher_email
       FROM (
         SELECT ss.subject_id, ss.class_id, ss.academic_session
         FROM student_subjects ss
         WHERE ss.student_id = ? AND ss.class_id = ? AND ss.status = 'active' AND (ss.academic_session = ? OR ss.academic_session IS NULL)
         UNION
         SELECT cs.subject_id, cs.class_id, cs.academic_session
         FROM class_subjects cs
         WHERE cs.class_id = ? AND (cs.academic_session = ? OR cs.academic_session IS NULL)
       ) AS enrolled
       JOIN subjects s ON enrolled.subject_id = s.id
       LEFT JOIN class_subjects cs ON cs.subject_id = s.id AND cs.class_id = enrolled.class_id AND cs.academic_session = enrolled.academic_session
       LEFT JOIN subject_teachers st ON st.subject_id = s.id AND (st.class_id = enrolled.class_id OR st.class_id IS NULL) AND (st.academic_session = enrolled.academic_session OR st.academic_session IS NULL)
       LEFT JOIN users t ON st.teacher_id = t.id
       WHERE s.school_id = ?
       ORDER BY s.name`,
      [studentId, classId, session, classId, session, school.id]
    );

    return ok(subjects);
  } catch (err) {
    return serverError(err);
  }
});
