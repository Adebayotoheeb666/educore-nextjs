import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const GET = withAuth(requireService("library", async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const books = await query(
      "SELECT * FROM library_books WHERE school_id = ? ORDER BY title",
      [school.id]
    );
    return ok(books);
  } catch (err) { return serverError(err); }
}));

export const POST = withAuth(requireService("library", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { title, author, isbn, category, quantity, shelfLocation, description } = await req.json();
    if (!title) return badRequest("title is required");

    const id = generateId();
    const qty = quantity ?? 1;
    await execute(
      `INSERT INTO library_books (id, school_id, title, author, isbn, category, quantity, available_quantity, shelf_location, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, school.id, title, author || null, isbn || null, category || null, qty, qty, shelfLocation || null, description || null]
    );
    return created({ id, title });
  } catch (err) { return serverError(err); }
}));
