import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { ok, badRequest, forbidden, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export const GET = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return forbidden("School context required");

      const { searchParams } = new URL(req.url);
      const lastSyncedAt = searchParams.get("lastSyncedAt");

      if (!lastSyncedAt) {
        return badRequest("lastSyncedAt query parameter is required (format: YYYY-MM-DD HH:MM:SS or ISO string)");
      }

      // Format ISO string or timestamp cleanly for SQLite datetimes
      let formattedTime = lastSyncedAt;
      try {
        formattedTime = new Date(lastSyncedAt).toISOString().replace("T", " ").substring(0, 19);
      } catch {
        return badRequest("Invalid date format for lastSyncedAt");
      }

      // Fetch delta modifications since last synced timestamp
      const announcements = await query(
        "SELECT * FROM announcements WHERE school_id = ? AND updated_at > ? ORDER BY updated_at DESC",
        [school.id, formattedTime]
      );

      const classes = await query(
        "SELECT * FROM classes WHERE school_id = ? AND updated_at > ? ORDER BY updated_at DESC",
        [school.id, formattedTime]
      );

      const attendance = await query(
        "SELECT * FROM attendance WHERE school_id = ? AND updated_at > ? ORDER BY updated_at DESC",
        [school.id, formattedTime]
      );

      return ok({
        syncTime: new Date().toISOString().replace("T", " ").substring(0, 19),
        delta: {
          announcements,
          classes,
          attendance
        }
      });
    } catch (err) {
      return serverError(err);
    }
  },
  ["school_owner", "principal", "super_admin", "parent", "student", "class_teacher", "subject_teacher"]
);
