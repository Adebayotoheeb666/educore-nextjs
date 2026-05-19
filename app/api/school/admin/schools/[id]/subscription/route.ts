import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { withAuth } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

// PATCH /api/school/admin/schools/[id]/subscription
export const PATCH = withAuth(
  async (req: NextRequest, _ctx, params): Promise<NextResponse> => {
    try {
      const { id } = params ?? {};
      const { status, plan, aiTokenBudget, usedAiTokens, expiresAt } = await req.json();

      const school = await queryOne("SELECT id FROM schools WHERE id = ?", [id]);
      if (!school) return notFound("School not found");

      await execute(
        `UPDATE schools SET
           subscription_status = COALESCE(?, subscription_status),
           subscription_plan = COALESCE(?, subscription_plan),
           ai_token_budget = COALESCE(?, ai_token_budget),
           used_ai_tokens = COALESCE(?, used_ai_tokens),
           subscription_expires_at = COALESCE(?, subscription_expires_at),
           updated_at = datetime('now')
         WHERE id = ?`,
        [status || null, plan || null, aiTokenBudget ?? null, usedAiTokens ?? null, expiresAt || null, id]
      );

      const updated = await queryOne("SELECT * FROM schools WHERE id = ?", [id]);
      return ok(updated);
    } catch (err) {
      return serverError(err);
    }
  },
  ["super_admin"]
);
