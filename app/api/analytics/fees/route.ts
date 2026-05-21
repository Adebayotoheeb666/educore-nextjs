import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(requireService("analytics", async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const sid = school.id;

    const [collected, totalFees] = await Promise.all([
      queryOne<{ total: number }>("SELECT COALESCE(SUM(amount_paid),0) total FROM fee_payments WHERE school_id=? AND status='completed'", [sid]),
      queryOne<{ total: number }>("SELECT COALESCE(SUM(amount),0) total FROM fees WHERE school_id=?", [sid]),
    ]);

    const paid = collected?.total ?? 0;
    const totalAmount = totalFees?.total ?? 0;
    const outstanding = totalAmount - paid;
    const collectionRate = totalAmount > 0 ? Math.round((paid / totalAmount) * 100) : 0;

    return ok({ paid, pending: outstanding, overdue: 0, collectionRate });
  } catch (err) {
    return serverError(err);
  }
}));
