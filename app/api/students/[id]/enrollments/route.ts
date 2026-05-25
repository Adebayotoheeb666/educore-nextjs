import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError, created } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

// GET /api/students/[id]/enrollments — Get student's enrollment history
export const GET = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const studentId = params?.id ?? "";
    const student = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'student'", [studentId, school.id]);
    if (!student) return notFound("Student not found");

    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session");

    let sql = `SELECT sc.*, c.name as class_name, c.level as class_level, c.section as class_section
               FROM students_classes sc
               LEFT JOIN classes c ON sc.class_id = c.id
               WHERE sc.student_id = ?`;
    const params_arr: any[] = [studentId];

    if (session) {
      sql += ` AND sc.academic_session = ?`;
      params_arr.push(session);
    }

    sql += ` ORDER BY sc.academic_session DESC, sc.term DESC`;

    const enrollments = await query(sql, params_arr);
    return ok(enrollments);
  } catch (err) {
    return serverError(err);
  }
});

// POST /api/students/[id]/enrollments — Enroll student in a class for a session
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { classId, academicSession, term, status } = await req.json();
      const studentId = params?.id ?? "";

      if (!classId || !academicSession) {
        return badRequest("classId and academicSession are required");
      }

      const student = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'student'", [studentId, school.id]);
      if (!student) return notFound("Student not found");

      const classDoc = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!classDoc) return notFound("Class not found");

      const id = generateId();
      await execute(
        `INSERT INTO students_classes (id, student_id, class_id, academic_session, term, status, enrolled_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
        [id, studentId, classId, academicSession, term || null, status || "active"]
      );

      return created({ id, studentId, classId, academicSession, status: status || "active" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);

// PUT /api/students/[id]/enrollments — Update enrollment status
export const PUT = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { enrollmentId, status, leftDate } = await req.json();
      const studentId = params?.id ?? "";

      if (!enrollmentId || !status) {
        return badRequest("enrollmentId and status are required");
      }

      const enrollment = await queryOne(
        `SELECT sc.* FROM students_classes sc
         JOIN users u ON sc.student_id = u.id
         WHERE sc.id = ? AND sc.student_id = ? AND u.school_id = ?`,
        [enrollmentId, studentId, school.id]
      );

      if (!enrollment) return notFound("Enrollment not found");

      await execute(
        `UPDATE students_classes SET status = ?, left_date = ?, updated_at = datetime('now') WHERE id = ?`,
        [status, leftDate || null, enrollmentId]
      );

      return ok({ message: "Enrollment updated", enrollmentId, status });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);
