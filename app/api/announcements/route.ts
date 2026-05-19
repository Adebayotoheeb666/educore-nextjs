import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const GET = withAuth(requireService("announcements", async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const announcements = await query(
      `SELECT a.*, u.name as author_name FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.school_id = ? ORDER BY a.is_pinned DESC, a.created_at DESC`,
      [school.id]
    );
    return ok(announcements);
  } catch (err) {
    return serverError(err);
  }
}));

export const POST = withAuth(requireService("announcements", async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { title, content, targetRoles, isPinned, expiresAt } = await req.json();
    if (!title || !content) return badRequest("title and content are required");

    const id = generateId();
    await execute(
      `INSERT INTO announcements (id, title, content, school_id, author_id, target_roles, is_pinned, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, title, content, school.id, user.id,
       Array.isArray(targetRoles) ? targetRoles.join(",") : null,
       isPinned ? 1 : 0, expiresAt || null]
    );
    return created({ id, title });
  } catch (err) {
    return serverError(err);
  }
}));
