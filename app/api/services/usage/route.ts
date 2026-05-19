import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { forbidden, ok, serverError } from "@/lib/utils/response";

// GET /api/services/usage - Get service usage metrics for the school
export const GET = withAuth(async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return forbidden("School context required");

    const { searchParams } = new URL(req.url);
    const serviceSlug = searchParams.get("service");
    const period = searchParams.get("period") ?? "current_month";

    let dateFilter = "";
    if (period === "current_month") {
      dateFilter = "AND strftime('%Y-%m', su.recorded_at) = strftime('%Y-%m', 'now')";
    } else if (period === "last_month") {
      dateFilter = "AND strftime('%Y-%m', su.recorded_at) = strftime('%Y-%m', datetime('now', '-1 month'))";
    }

    const serviceFilter = serviceSlug ? "AND s.slug = ?" : "";
    const args: (string | number | boolean | null)[] = [school.id];
    if (serviceSlug) args.push(serviceSlug);

    const usage = await query(
      `SELECT s.name, s.slug, su.metric, SUM(su.quantity) as total_quantity
       FROM service_usage su
       JOIN services s ON su.service_id = s.id
       WHERE su.school_id = ? ${serviceFilter} ${dateFilter}
       GROUP BY s.slug, su.metric
       ORDER BY s.name, su.metric`,
      args
    );

    return ok(usage);
  } catch (err) {
    return serverError(err);
  }
});
