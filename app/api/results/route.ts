import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(requireService("results", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const term = searchParams.get("term");

    const args: (string | number | boolean | null)[] = [school.id];
    let filters = "";
    if (classId) { filters += " AND r.class_id = ?"; args.push(classId); }
    if (term)    { filters += " AND r.term = ?"; args.push(term); }

    const results = await query(
      `SELECT r.*,
              u.name as student_name, u.first_name, u.last_name, u.admission_no,
              c.name as class_name, c.section as class_section,
              s.name as subject_name
       FROM results r
       JOIN users u ON r.student_id = u.id
       LEFT JOIN classes c ON r.class_id = c.id
       LEFT JOIN subjects s ON r.subject_id = s.id
       WHERE r.school_id = ? ${filters}
       ORDER BY r.created_at DESC`,
      args
    );
    return ok(results);
  } catch (err) {
    return serverError(err);
  }
}));
