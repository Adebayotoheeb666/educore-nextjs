import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const GET = withAuth(requireService("fees", async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const fees = await query(
      `SELECT f.*, c.name as class_name FROM fees f
       LEFT JOIN classes c ON f.class_id = c.id
       WHERE f.school_id = ? ORDER BY f.created_at DESC`,
      [school.id]
    );
    return ok(fees);
  } catch (err) {
    return serverError(err);
  }
}));

export const POST = withAuth(
  requireService("fees", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { title, session, term, classId, totalAmount, dueDate, description } = await req.json();
      if (!title || !totalAmount) return badRequest("title and totalAmount are required");

      const id = generateId();
      await execute(
        `INSERT INTO fees (id, school_id, name, amount, description, class_id, term, academic_session, due_date, is_compulsory, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [id, school.id, title, totalAmount, description || null, classId || null,
         term || school.current_term, session || school.academic_session, dueDate || null]
      );

      return created({ id, name: title, amount: totalAmount });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "bursar"]
);
