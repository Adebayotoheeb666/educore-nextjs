import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const classDoc = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [params?.id ?? "", school.id]);
    if (!classDoc) return notFound("Class not found");

    // Students are linked to a class via attendance records or direct assignment
    const students = await query(
      `SELECT DISTINCT u.id, u.name, u.first_name, u.last_name, u.admission_no, u.avatar, u.gender
       FROM users u
       WHERE u.school_id = ? AND u.role = 'student'
       ORDER BY u.name`,
      [school.id]
    );
    return ok(students);
  } catch (err) {
    return serverError(err);
  }
});
