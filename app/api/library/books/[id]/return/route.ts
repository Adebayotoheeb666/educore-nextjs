import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

export const POST = withAuth(requireService("library", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const { borrowId } = await req.json();
    if (!borrowId) return badRequest("borrowId is required");

    const borrow = await queryOne<{ id: string; status: string }>(
      "SELECT id, status FROM book_borrows WHERE id = ? AND book_id = ? AND school_id = ?",
      [borrowId, params?.id ?? "", school.id]
    );
    if (!borrow) return notFound("Borrow record not found");
    if (borrow.status === "returned") return badRequest("Book already returned");

    await execute(
      "UPDATE book_borrows SET status = 'returned', returned_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      [borrowId]
    );
    await execute(
      "UPDATE library_books SET available_quantity = available_quantity + 1, updated_at = datetime('now') WHERE id = ?",
      [params?.id ?? ""]
    );
    return ok({ message: "Book returned successfully" });
  } catch (err) { return serverError(err); }
}));
