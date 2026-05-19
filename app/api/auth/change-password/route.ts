import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";
import { comparePassword, hashPassword } from "@/lib/utils/password";
import { checkRateLimit } from "@/lib/middleware/rateLimit";

export const POST = withAuth(async (req: NextRequest, { user }: AuthContext): Promise<NextResponse> => {
  try {
    // 5 changes per 15 minutes per IP
    const limited = await checkRateLimit(req, { prefix: "change-password", limit: 5, windowSecs: 900 });
    if (limited) return limited;

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return badRequest("currentPassword and newPassword are required");
    }
    if (newPassword.length < 8) {
      return badRequest("New password must be at least 8 characters");
    }

    const row = await queryOne<{ password: string }>(
      "SELECT password FROM users WHERE id = ?",
      [user.id]
    );
    if (!row) return badRequest("User not found");

    const valid = await comparePassword(currentPassword, row.password);
    if (!valid) return badRequest("Current password is incorrect");

    const hashed = await hashPassword(newPassword);
    await execute(
      "UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?",
      [hashed, user.id]
    );

    return ok({ message: "Password updated successfully" });
  } catch (err) {
    return serverError(err);
  }
});
