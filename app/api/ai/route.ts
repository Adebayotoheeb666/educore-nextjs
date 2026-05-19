import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// POST /api/ai — generic AI completion endpoint
export const POST = withAuth(requireService("ai", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");

    const schoolData = await queryOne<{ ai_token_budget: number; used_ai_tokens: number }>(
      "SELECT ai_token_budget, used_ai_tokens FROM schools WHERE id = ?",
      [school.id]
    );

    if ((schoolData?.used_ai_tokens ?? 0) >= (schoolData?.ai_token_budget ?? 100000)) {
      return NextResponse.json({ message: "AI token budget exceeded for this month" }, { status: 503 });
    }

    const { prompt, type } = await req.json();
    if (!prompt) return badRequest("prompt is required");

    // Import AI SDK lazily to avoid cold-start issues
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const tokensUsed = message.usage?.input_tokens + message.usage?.output_tokens;
    await execute(
      "UPDATE schools SET used_ai_tokens = used_ai_tokens + ?, updated_at = datetime('now') WHERE id = ?",
      [tokensUsed, school.id]
    );

    const content = message.content[0];
    return ok({
      result: content.type === "text" ? content.text : "",
      tokensUsed,
      type,
    });
  } catch (err) {
    return serverError(err);
  }
}), ["subject_teacher", "class_teacher", "vp_academics", "principal", "school_owner"]);
