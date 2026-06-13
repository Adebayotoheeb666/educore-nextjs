import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

export const PATCH = withAuth(requireService("library", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School context required");
    const id = params?.id ?? "";
    const existing = await queryOne("SELECT id FROM library_books WHERE id = ? AND school_id = ?", [id, school.id]);
    if (!existing) return notFound("Book not found");

    const {
      title,
      author,
      isbn,
      subject,
      category,
      quantity,
      available_quantity,
      shelfLocation,
      description,
    } = await req.json();

    if (
      title === undefined &&
      author === undefined &&
      isbn === undefined &&
      subject === undefined &&
      category === undefined &&
      quantity === undefined &&
      available_quantity === undefined &&
      shelfLocation === undefined &&
      description === undefined
    ) {
      return badRequest("No fields provided for update");
    }

    await execute(
      `UPDATE library_books SET
         title = COALESCE(?, title),
         author = COALESCE(?, author),
         isbn = COALESCE(?, isbn),
         category = COALESCE(?, category),
         quantity = COALESCE(?, quantity),
         available_quantity = COALESCE(?, available_quantity),
         shelf_location = COALESCE(?, shelf_location),
         description = COALESCE(?, description),
         updated_at = datetime('now')
       WHERE id = ?`,
      [
        title || null,
        author || null,
        isbn || null,
        (subject ?? category) || null,
        quantity ?? null,
        available_quantity ?? null,
        shelfLocation || null,
        description || null,
        id,
      ]
    );

    const updated = await queryOne("SELECT * FROM library_books WHERE id = ?", [id]);
    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
}));

export const DELETE = withAuth(requireService("library", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School context required");
    const id = params?.id ?? "";
    const existing = await queryOne("SELECT id FROM library_books WHERE id = ? AND school_id = ?", [id, school.id]);
    if (!existing) return notFound("Book not found");

    await execute("DELETE FROM library_books WHERE id = ?", [id]);
    return ok({ message: "Book deleted" });
  } catch (err) {
    return serverError(err);
  }
}));
