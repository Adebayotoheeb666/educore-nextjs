import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// GET /api/admin/schools — all schools (super admin only)
export const GET = withAuth(
  async (req: NextRequest, _ctx: AuthContext): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");

      const args: (string | number | boolean | null)[] = [];
      let filters = "";
      if (status) { filters += " WHERE s.subscription_status = ?"; args.push(status); }

      const schools = await query(
        `SELECT s.id, s.name, s.email, s.phone, s.state, s.type, s.address,
                s.subscription_status, s.subscription_plan, s.academic_session, s.current_term,
                s.created_at,
                COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count,
                COUNT(DISTINCT CASE WHEN u.role NOT IN ('student','parent') THEN u.id END) as staff_count
         FROM schools s
         LEFT JOIN users u ON u.school_id = s.id AND u.is_active = 1
         ${filters}
         GROUP BY s.id
         ORDER BY s.created_at DESC`,
        args
      );

      const total = await queryOne<{ c: number }>("SELECT COUNT(*) c FROM schools", []);

      return ok({ schools, total: total?.c ?? 0 });
    } catch (err) {
      return serverError(err);
    }
  },
  ["super_admin"]
);
