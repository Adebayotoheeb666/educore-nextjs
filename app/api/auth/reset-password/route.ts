import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { hashPassword } from "@/lib/utils/password";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// POST /api/auth/reset-password
// Body: { token, password }
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return badRequest("Token and password are required");
    if (password.length < 8) return badRequest("Password must be at least 8 characters");

    const user = await queryOne<{ id: string; reset_token_expires: string | null }>(
      "SELECT id, reset_token_expires FROM users WHERE reset_token = ? AND is_active = 1",
      [token]
    );

    if (!user) return badRequest("Invalid or expired reset token");
    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return badRequest("Reset token has expired. Please request a new one.");
    }

    const hashed = await hashPassword(password);
    await execute(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = datetime('now') WHERE id = ?",
      [hashed, user.id]
    );

    return ok({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    return serverError(err);
  }
}
