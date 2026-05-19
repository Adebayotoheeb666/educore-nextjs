import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// GET /api/timetable?classId=&term=
export const GET = withAuth(requireService("timetable", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const term = searchParams.get("term");

    const args: (string | number | boolean | null)[] = [school.id];
    let filters = "";
    if (classId) { filters += " AND t.class_id = ?"; args.push(classId); }
    if (term)    { filters += " AND t.term = ?"; args.push(term); }

    const slots = await query(
      `SELECT t.*, c.name as class_name, c.section, s.name as subject_name, u.name as teacher_name
       FROM timetable t
       LEFT JOIN classes c ON t.class_id = c.id
       LEFT JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN users u ON t.teacher_id = u.id
       WHERE t.school_id = ? ${filters}
       ORDER BY t.day, t.start_time`,
      args
    );

    return ok(slots.length ? slots : null);
  } catch (err) {
    return serverError(err);
  }
}));
