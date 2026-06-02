import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

const TEACHER_ROLES = ["subject_teacher", "class_teacher", "vp_academics", "principal"];

export const GET = withAuth(requireService("lesson-plans", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const plan = await queryOne(
      `SELECT lp.*, u.name as teacher_name, s.name as subject_name, c.name as class_name
       FROM lesson_plans lp
       LEFT JOIN users u ON lp.teacher_id = u.id
       LEFT JOIN subjects s ON lp.subject_id = s.id
       LEFT JOIN classes c ON lp.class_id = c.id
       WHERE lp.id = ? AND lp.school_id = ?`,
      [params?.id ?? "", school.id]
    );
    if (!plan) return notFound("Lesson plan not found");
    return ok(plan);
  } catch (err) {
    return serverError(err);
  }
}));

export const PATCH = withAuth(
  requireService("lesson-plans", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM lesson_plans WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!existing) return notFound("Lesson plan not found");

      const body = await req.json();
      const allowed = ["title", "topic", "objectives", "content", "materials", "activities", "assessment", "status", "week"];
      const setClauses: string[] = [];
      const args: (string | number | boolean | null)[] = [];

      for (const key of allowed) {
        if (body[key] !== undefined) {
          const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          setClauses.push(`${col} = ?`);
          args.push(body[key]);
        }
      }
      if (!setClauses.length) return ok(existing);

      setClauses.push("updated_at = datetime('now')");
      args.push(id);

      await execute(`UPDATE lesson_plans SET ${setClauses.join(", ")} WHERE id = ?`, args);
      const updated = await queryOne("SELECT * FROM lesson_plans WHERE id = ?", [id]);
      return ok(updated);
    } catch (err) {
      return serverError(err);
    }
  }),
  TEACHER_ROLES
);

export const DELETE = withAuth(
  requireService("lesson-plans", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM lesson_plans WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!existing) return notFound("Lesson plan not found");
      await execute("DELETE FROM lesson_plans WHERE id = ?", [id]);
      return ok({ message: "Lesson plan deleted" });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "vp_academics"]
);
