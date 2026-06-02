import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export const GET = withAuth(requireService("announcements", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const a = await queryOne("SELECT * FROM announcements WHERE id = ? AND school_id = ?", [params?.id ?? "", school.id]);
    if (!a) return notFound("Announcement not found");
    return ok(a);
  } catch (err) { return serverError(err); }
}));

export const PATCH = withAuth(requireService("announcements", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const id = params?.id ?? "";
    const ex = await queryOne("SELECT id FROM announcements WHERE id = ? AND school_id = ?", [id, school.id]);
    if (!ex) return notFound("Announcement not found");
    const { title, content, isPinned, expiresAt } = await req.json();
    await execute(
      "UPDATE announcements SET title = COALESCE(?, title), content = COALESCE(?, content), is_pinned = COALESCE(?, is_pinned), expires_at = COALESCE(?, expires_at), updated_at = datetime('now') WHERE id = ?",
      [title || null, content || null, isPinned !== undefined ? (isPinned ? 1 : 0) : null, expiresAt || null, id]
    );
    return ok(await queryOne("SELECT * FROM announcements WHERE id = ?", [id]));
  } catch (err) { return serverError(err); }
}));

export const DELETE = withAuth(requireService("announcements", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    await execute("DELETE FROM announcements WHERE id = ? AND school_id = ?", [params?.id ?? "", school.id]);
    return ok({ message: "Announcement deleted" });
  } catch (err) { return serverError(err); }
}));
