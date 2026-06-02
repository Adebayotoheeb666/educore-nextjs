import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// GET /api/fees/defaulters — students with outstanding fee payments
export const GET = withAuth(requireService("fees", async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const defaulters = await query(
      `SELECT u.id, u.name, u.admission_no, u.phone as parent_phone,
              f.name as fee_name, f.amount as amount_due, f.term, f.academic_session,
              COALESCE(SUM(fp.amount_paid), 0) as amount_paid,
              f.amount - COALESCE(SUM(fp.amount_paid), 0) as balance
       FROM fees f
       JOIN users u ON u.school_id = f.school_id AND u.role = 'student'
       LEFT JOIN fee_payments fp ON fp.fee_id = f.id AND fp.student_id = u.id AND fp.status = 'completed'
       WHERE f.school_id = ?
       GROUP BY u.id, f.id
       HAVING balance > 0
       ORDER BY balance DESC`,
      [school.id]
    );
    return ok(defaulters);
  } catch (err) {
    return serverError(err);
  }
}), ["bursar", "principal"]);
