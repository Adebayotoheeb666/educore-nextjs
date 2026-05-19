import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { ok, serverError } from "@/lib/utils/response";

// GET /api/admin/payments — all subscription / billing payments (super admin only)
export const GET = withAuth(
  async (req: NextRequest, _ctx: AuthContext): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");

      const args: (string | number | boolean | null)[] = [];
      let filters = "";
      if (status) { filters += " AND bh.status = ?"; args.push(status); }

      const payments = await query(
        `SELECT bh.id, bh.amount, bh.status, bh.payment_method, bh.reference,
                bh.created_at, s.name as school_name, sv.name as service_name
         FROM billing_history bh
         LEFT JOIN schools s ON bh.school_id = s.id
         LEFT JOIN services sv ON bh.service_id = sv.id
         WHERE 1=1 ${filters}
         ORDER BY bh.created_at DESC
         LIMIT 500`,
        args
      );

      return ok(payments);
    } catch (err) {
      return serverError(err);
    }
  },
  ["super_admin"]
);
