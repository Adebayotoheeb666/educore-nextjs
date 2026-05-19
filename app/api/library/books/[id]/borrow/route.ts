import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const POST = withAuth(requireService("library", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const { userId, dueDate } = await req.json();
    if (!userId || !dueDate) return badRequest("userId and dueDate are required");

    const book = await queryOne<{ available_quantity: number }>(
      "SELECT available_quantity FROM library_books WHERE id = ? AND school_id = ?",
      [params?.id ?? "", school.id]
    );
    if (!book) return notFound("Book not found");
    if (book.available_quantity <= 0) return badRequest("No copies available for borrowing");

    const id = generateId();
    await execute(
      `INSERT INTO book_borrows (id, school_id, book_id, user_id, due_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'borrowed', datetime('now'), datetime('now'))`,
      [id, school.id, params?.id ?? "", userId, dueDate]
    );
    await execute(
      "UPDATE library_books SET available_quantity = available_quantity - 1, updated_at = datetime('now') WHERE id = ?",
      [params?.id ?? ""]
    );
    return ok({ id, message: "Book borrowed successfully" });
  } catch (err) { return serverError(err); }
}));
