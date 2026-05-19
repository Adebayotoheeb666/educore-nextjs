import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

// GET /api/students/[id]/history — academic history
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const studentId = params?.id ?? "";

    const history = await query(
      `SELECT r.*, c.name as class_name, c.section as class_section, s.name as subject_name
       FROM results r
       LEFT JOIN classes c ON r.class_id = c.id
       LEFT JOIN subjects s ON r.subject_id = s.id
       WHERE r.school_id = ? AND r.student_id = ?
       ORDER BY r.created_at DESC`,
      [school.id, studentId]
    );

    return ok(history);
  } catch (err) {
    return serverError(err);
  }
});
