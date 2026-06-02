import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const classId = params?.id ?? "";
    const classDoc = await queryOne("SELECT id, academic_session FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
    if (!classDoc) return notFound("Class not found");

    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session") || (classDoc as any).academic_session || school.academic_session;

    const students = await query(
      `SELECT u.id, u.name, u.first_name, u.last_name, u.admission_no, u.avatar, u.gender, u.email,
              sc.status, sc.enrolled_date, sc.academic_session
       FROM users u
       INNER JOIN students_classes sc ON sc.student_id = u.id
       WHERE sc.class_id = ? AND u.school_id = ? AND u.role = 'student' AND sc.academic_session = ?
       ORDER BY u.name`,
      [classId, school.id, session]
    );
    return ok(students);
  } catch (err) {
    return serverError(err);
  }
});
