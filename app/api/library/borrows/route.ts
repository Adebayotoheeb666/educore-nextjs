import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// GET /api/library/borrows?status=borrowed|returned&studentId=
export const GET = withAuth(requireService("library", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");

    const args: (string | number | boolean | null)[] = [school.id];
    let filters = "";
    if (status)    { filters += " AND bb.status = ?"; args.push(status); }
    if (studentId) { filters += " AND bb.user_id = ?"; args.push(studentId); }

    const borrows = await query(
      `SELECT bb.id, bb.book_id, bb.status, bb.due_date, bb.borrowed_at, bb.returned_at, bb.created_at,
              lb.title as book_title, lb.author as book_author,
              u.name as borrower_name, u.role as borrower_role
       FROM book_borrows bb
       JOIN library_books lb ON bb.book_id = lb.id
       JOIN users u ON bb.user_id = u.id
       WHERE bb.school_id = ? ${filters}
       ORDER BY bb.created_at DESC`,
      args
    );

    return ok(borrows);
  } catch (err) {
    return serverError(err);
  }
}));
