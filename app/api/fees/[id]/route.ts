import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export const GET = withAuth(requireService("fees", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const fee = await queryOne(
      `SELECT f.*, c.name as class_name FROM fees f LEFT JOIN classes c ON f.class_id = c.id
       WHERE f.id = ? AND f.school_id = ?`,
      [params?.id ?? "", school.id]
    );
    if (!fee) return notFound("Fee schedule not found");
    return ok(fee);
  } catch (err) {
    return serverError(err);
  }
}));

export const PATCH = withAuth(
  requireService("fees", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM fees WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!existing) return notFound("Fee schedule not found");

      const { title, totalAmount, dueDate, description } = await req.json();
      await execute(
        `UPDATE fees SET name = COALESCE(?, name), amount = COALESCE(?, amount),
         due_date = COALESCE(?, due_date), description = COALESCE(?, description),
         updated_at = datetime('now') WHERE id = ?`,
        [title || null, totalAmount || null, dueDate || null, description || null, id]
      );
      return ok(await queryOne("SELECT * FROM fees WHERE id = ?", [id]));
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "bursar"]
);

export const DELETE = withAuth(
  requireService("fees", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM fees WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!existing) return notFound("Fee schedule not found");
      await execute("DELETE FROM fees WHERE id = ?", [id]);
      return ok({ message: "Fee schedule deleted" });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "bursar"]
);
