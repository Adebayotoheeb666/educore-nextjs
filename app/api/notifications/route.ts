import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// GET /api/notifications — aggregated notifications for the current user
export const GET = withAuth(async (req: NextRequest, { user, school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

    // Recent announcements visible to this user's role
    const announcements = await query(
      `SELECT
         id,
         title,
         content AS body,
         'announcement' AS type,
         is_pinned,
         created_at,
         NULL AS read
       FROM announcements
       WHERE school_id = ?
         AND (expires_at IS NULL OR expires_at > datetime('now'))
         AND (
           target_roles IS NULL
           OR target_roles = ''
           OR target_roles LIKE ?
         )
       ORDER BY is_pinned DESC, created_at DESC
       LIMIT ?`,
      [school.id, `%${user.role}%`, limit]
    );

    // Recent activity for the current user (own actions + school-wide events)
    const activity = await query(
      `SELECT
         id,
         action AS title,
         details AS body,
         'activity' AS type,
         0 AS is_pinned,
         created_at,
         NULL AS read
       FROM activity_logs
       WHERE (user_id = ? OR (school_id = ? AND resource IN ('payment', 'fee', 'enrollment')))
       ORDER BY created_at DESC
       LIMIT ?`,
      [user.id, school.id, Math.floor(limit / 2)]
    );

    // Merge and sort by date
    const all = [...announcements, ...activity].sort(
      (a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
    );

    return ok(all.slice(0, limit));
  } catch (err) {
    return serverError(err);
  }
});
