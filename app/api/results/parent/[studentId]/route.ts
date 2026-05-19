import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(requireService("results", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const term = searchParams.get("term");
    const session = searchParams.get("session");

    const args: (string | number | boolean | null)[] = [school.id, params?.studentId ?? ""];
    let filters = "";
    if (term)    { filters += " AND r.term = ?"; args.push(term); }
    if (session) { filters += " AND r.academic_session = ?"; args.push(session); }

    const results = await query(
      `SELECT r.*, s.name as subject_name, c.name as class_name
       FROM results r
       LEFT JOIN subjects s ON r.subject_id = s.id
       LEFT JOIN classes c ON r.class_id = c.id
       WHERE r.school_id = ? AND r.student_id = ? ${filters}
       ORDER BY s.name`,
      args
    );
    return ok(results);
  } catch (err) {
    return serverError(err);
  }
}), ["parent", "student"]);
