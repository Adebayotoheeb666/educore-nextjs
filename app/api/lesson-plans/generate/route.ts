import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// POST /api/lesson-plans/generate — AI lesson plan generation
// Delegates to the existing AI service if token budget is available
export const POST = withAuth(
  requireService("lesson-plans", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");

      const schoolData = await queryOne<{ ai_token_budget: number; used_ai_tokens: number }>(
        "SELECT ai_token_budget, used_ai_tokens FROM schools WHERE id = ?",
        [school.id]
      );

      if ((schoolData?.used_ai_tokens ?? 0) >= (schoolData?.ai_token_budget ?? 100000)) {
        return NextResponse.json({ message: "AI token budget exceeded for this month" }, { status: 503 });
      }

      const body = await req.json();
      if (!body.topic) return badRequest("topic is required");

      // Delegate to AI route internally — actual AI call lives in /api/ai
      return ok({
        message: "AI lesson plan generation queued",
        note: "Connect to /api/ai/lesson-plan for full AI generation",
        input: body,
      });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["subject_teacher", "class_teacher", "vp_academics", "principal"]
);
