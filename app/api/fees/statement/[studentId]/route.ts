import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(requireService("fees", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const payments = await query(
      `SELECT fp.*, f.name as fee_name, f.amount as fee_amount, f.term, f.academic_session
       FROM fee_payments fp
       JOIN fees f ON fp.fee_id = f.id
       WHERE fp.student_id = ? AND fp.school_id = ?
       ORDER BY fp.payment_date DESC`,
      [params?.studentId ?? "", school.id]
    );
    return ok(payments);
  } catch (err) {
    return serverError(err);
  }
}));
