import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// GET /api/timetable/my — returns the timetable for the authenticated student's class
export const GET = withAuth(
  requireService("timetable", async (_req: NextRequest, { user, school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");

      const studentRow = await queryOne<{ class_id: string | null }>(
        "SELECT class_id FROM users WHERE id = ?",
        [user.id]
      );

      if (!studentRow?.class_id) {
        return ok([]); // No class assigned yet
      }

      const slots = await query(
        `SELECT t.id, t.day, t.start_time, t.end_time, t.room,
                s.name as subject_name, u.name as teacher_name
         FROM timetable t
         LEFT JOIN subjects s ON t.subject_id = s.id
         LEFT JOIN users u ON t.teacher_id = u.id
         WHERE t.school_id = ? AND t.class_id = ?
         ORDER BY t.day, t.start_time`,
        [school.id, studentRow.class_id]
      );

      return ok(slots);
    } catch (err) {
      return serverError(err);
    }
  }),
  ["student"]
);
