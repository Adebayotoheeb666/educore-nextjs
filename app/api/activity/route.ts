import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// GET /api/activity?limit=50
export const GET = withAuth(async (req: NextRequest, { user, school }) => {
  try {
    if (!school) return badRequest("School context required");

    // Only allow admin-level roles to view full activity
    const allowedRoles = ["principal", "school_owner", "admin_staff", "super_admin", "vp_admin", "vp_academics", "bursar"];
    if (!allowedRoles.includes(user.role)) return NextResponse.json({ message: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "25"), 200);

    const rows = await query(
      `SELECT al.id, al.action, al.resource, al.details, al.user_id, al.created_at, u.name AS user_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.school_id = ?
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [school.id, limit]
    );

    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
});
