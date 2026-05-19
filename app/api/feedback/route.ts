import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const items = await query(
      `SELECT f.*, u.name as user_name FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.school_id = ? ORDER BY f.created_at DESC`,
      [school.id]
    );
    return ok(items);
  } catch (err) { return serverError(err); }
});

export const POST = withAuth(async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
  try {
    const { type, subject, message, rating } = await req.json();
    if (!message) return badRequest("message is required");

    const id = generateId();
    await execute(
      `INSERT INTO feedback (id, school_id, user_id, type, subject, message, rating, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', datetime('now'), datetime('now'))`,
      [id, school?.id || null, user.id, type || null, subject || null, message, rating || null]
    );
    return created({ id, message: "Feedback submitted" });
  } catch (err) { return serverError(err); }
});
