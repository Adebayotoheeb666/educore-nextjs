import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

export const GET = withAuth(requireService("calendar", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const term = searchParams.get("term");
    const args: (string | number | boolean | null)[] = [school.id];
    let filters = "";
    if (term) { filters += " AND term = ?"; args.push(term); }

    const events = await query(
      `SELECT * FROM academic_calendar WHERE school_id = ? ${filters} ORDER BY start_date ASC`,
      args
    );
    return ok(events);
  } catch (err) { return serverError(err); }
}));

export const POST = withAuth(requireService("calendar", async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { title, description, startDate, endDate, type, term, academicSession, isPublic } = await req.json();
    if (!title || !startDate) return badRequest("title and startDate are required");

    const id = generateId();
    await execute(
      `INSERT INTO academic_calendar (id, school_id, title, description, start_date, end_date, type, term, academic_session, is_public, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, school.id, title, description || null, startDate, endDate || null, type || "event",
       term || school.current_term, academicSession || school.academic_session,
       isPublic !== false ? 1 : 0, user.id]
    );
    return created({ id, title });
  } catch (err) { return serverError(err); }
}));
