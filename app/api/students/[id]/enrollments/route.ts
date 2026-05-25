import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

// GET /api/students/[id]/enrollments — get enrollment history for student
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const studentId = params?.id ?? "";

    const enrollments = await query(
      `SELECT sc.id, sc.student_id, sc.class_id, c.name as class_name, sc.academic_session, sc.term, sc.status, 
              sc.enrolled_date, sc.left_date
       FROM students_classes sc
       JOIN classes c ON sc.class_id = c.id
       WHERE sc.student_id = ? AND c.school_id = ?
       ORDER BY sc.academic_session DESC, sc.enrolled_date DESC`,
      [studentId, school.id]
    );

    return ok(enrollments);
  } catch (err) {
    return serverError(err);
  }
});

// POST /api/students/[id]/enrollments — enroll student in a class
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const studentId = params?.id ?? "";
      const { classId, academicSession, term, status } = await req.json();

      if (!classId || !academicSession) {
        return badRequest("classId and academicSession are required");
      }

      const student = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'student'", [studentId, school.id]);
      if (!student) return notFound("Student not found");

      const cls = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!cls) return notFound("Class not found");

      const id = generateId();
      await execute(
        `INSERT INTO students_classes (id, student_id, class_id, academic_session, term, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [id, studentId, classId, academicSession, term || null, status || "active"]
      );

      // Update user's class_id to current class for quick access
      await execute(
        "UPDATE users SET class_id = ? WHERE id = ?",
        [classId, studentId]
      );

      return ok({ id, studentId, classId, academicSession, status: status || "active" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "school_owner"]
);
