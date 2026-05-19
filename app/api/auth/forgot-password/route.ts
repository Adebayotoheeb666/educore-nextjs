import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { execute, queryOne } from "@/lib/db/turso";
import { badRequest, ok, serverError } from "@/lib/utils/response";
import { sendPasswordResetEmail } from "@/lib/services/email";
import { withRateLimit } from "@/lib/middleware/rateLimit";

const GENERIC_OK = { message: "If that email exists, a reset link has been sent." };

// 5 reset requests per 15 minutes per IP
export const POST = withRateLimit(
  { prefix: "forgot-password", limit: 5, windowSecs: 900 },
  async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email } = await req.json();
    if (!email) return badRequest("Email is required");

    const user = await queryOne<{ id: string; name: string; email: string }>(
      "SELECT id, name, email FROM users WHERE email = ? AND is_active = 1",
      [email.toLowerCase().trim()]
    );

    // Always return success to prevent email enumeration
    if (!user) return ok(GENERIC_OK);

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await execute(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [token, expires, user.id]
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return ok(GENERIC_OK);
  } catch (err) {
    return serverError(err);
  }
});
