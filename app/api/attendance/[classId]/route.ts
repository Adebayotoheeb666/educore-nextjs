import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// GET /api/attendance/[classId]?date=YYYY-MM-DD
export const GET = withAuth(requireService("attendance", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    if (!date) return badRequest("date query parameter is required");

    const records = await query(
      `SELECT a.*, u.name as student_name, u.admission_no
       FROM attendance a
       JOIN users u ON a.student_id = u.id
       WHERE a.class_id = ? AND a.date = ? AND a.school_id = ?
       ORDER BY u.name`,
      [params?.classId ?? "", date, school.id]
    );

    return ok(records.length ? { classId: params?.classId, date, records } : null);
  } catch (err) {
    return serverError(err);
  }
}));
