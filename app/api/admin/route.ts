import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { withAuth } from "@/lib/middleware/auth";
import { ok, serverError } from "@/lib/utils/response";

// GET /api/admin — super admin overview
export const GET = withAuth(async (_req: NextRequest): Promise<NextResponse> => {
  try {
    const [schools, users, services] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM schools"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE is_active = 1"),
      query("SELECT slug, name, is_compulsory, base_price, is_active FROM services ORDER BY category, name"),
    ]);

    return ok({
      totalSchools: schools?.count ?? 0,
      totalActiveUsers: users?.count ?? 0,
      services,
    });
  } catch (err) {
    return serverError(err);
  }
}, ["super_admin"]);
