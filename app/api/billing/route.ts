import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// GET /api/billing — billing history for the school
export const GET = withAuth(async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const args: (string | number | boolean | null)[] = [school.id];
    let filters = "";
    if (status) { filters += " AND bh.status = ?"; args.push(status); }

    const history = await query(
      `SELECT bh.*, s.name as service_name, s.slug as service_slug
       FROM billing_history bh
       LEFT JOIN services s ON bh.service_id = s.id
       WHERE bh.school_id = ? ${filters}
       ORDER BY bh.created_at DESC`,
      args
    );
    return ok(history);
  } catch (err) {
    return serverError(err);
  }
});
