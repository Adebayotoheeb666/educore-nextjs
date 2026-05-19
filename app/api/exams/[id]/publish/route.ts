import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const PATCH = withAuth(
  requireService("exams", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const exam = await queryOne("SELECT id FROM exams WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!exam) return notFound("Exam not found");
      await execute("UPDATE exams SET updated_at = datetime('now') WHERE id = ?", [id]);
      return ok({ message: "Exam published", id });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "vp_academics"]
);
