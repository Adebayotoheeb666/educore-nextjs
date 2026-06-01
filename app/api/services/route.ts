import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { ok, serverError } from "@/lib/utils/response";

// GET /api/services - List all available services, optionally with school subscription status
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) {
      // Super admin: return all services
      const services = await query("SELECT * FROM services WHERE is_active = 1 ORDER BY category, name");
      return ok(services);
    }

    // For school users: join with school_services to show subscription status
    // Exclude super_admin_only services (Admin Panel)
    const services = await query(
      `SELECT s.*, ss.status as subscription_status, ss.subscribed_at, ss.expires_at
       FROM services s
       LEFT JOIN school_services ss ON s.id = ss.service_id AND ss.school_id = ?
       WHERE s.is_active = 1 AND s.slug != 'admin'
       ORDER BY s.category, s.name`,
      [school.id]
    );

    return ok(services);
  } catch (err) {
    return serverError(err);
  }
});
