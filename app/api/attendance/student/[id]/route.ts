import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// GET /api/attendance/student/[id]
export const GET = withAuth(requireService("attendance", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const records = await query(
      `SELECT a.id, a.date, a.status, a.notes, a.term,
              c.name as class_name, c.id as class_id
       FROM attendance a
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.student_id = ? AND a.school_id = ?
       ORDER BY a.date DESC`,
      [params?.id ?? "", school.id]
    );
    return ok(records);
  } catch (err) {
    return serverError(err);
  }
}));
