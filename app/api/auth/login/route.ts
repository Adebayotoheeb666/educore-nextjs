import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { comparePassword, hashPassword } from "@/lib/utils/password";
import { generateToken } from "@/lib/utils/jwt";
import { setAuthCookie } from "@/lib/utils/cookies";
import { badRequest, serverError, unauthorized } from "@/lib/utils/response";
import { withRateLimit } from "@/lib/middleware/rateLimit";

export const dynamic = "force-dynamic";

interface UserRow {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  password: string;
  role: string;
  avatar: string | null;
  is_active: number;
}

export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}

// 10 attempts per minute per IP
export const POST = withRateLimit(
  { prefix: "login", limit: 10, windowSecs: 60 },
  async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("auth/login entered", { method: req.method, contentType: req.headers.get?.("content-type") });
    const body = await req.json().catch((e) => {
      console.error("Failed to parse JSON:", e);
      return null;
    });
    console.log("auth/login parsed body", body);
    const { email, password } = body ?? {};

    if (!email || !password) {
      return badRequest("Please add email and password");
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await queryOne<UserRow>(
      "SELECT id, name, first_name, last_name, email, password, role, avatar, is_active FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (!user) return badRequest("Invalid email or password");

    let isMatched = false;
    if (user.password && user.password.startsWith("$2")) {
      isMatched = await comparePassword(password, user.password);
    } else {
      // Legacy plain-text password — hash it on first match
      isMatched = user.password === password;
      if (isMatched) {
        const hashed = await hashPassword(password);
        await execute("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);
      }
    }

    if (!isMatched) return badRequest("Invalid email or password");
    if (!user.is_active) return unauthorized("Account deactivated");

    const token = generateToken(user.id);
    const userData = {
      id: user.id,
      name: user.name,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token,
    };

    // Return payload consistent with other auth endpoints (top-level fields)
    const response = NextResponse.json(userData, { status: 200 });
    return setAuthCookie(response, token);
  } catch (err) {
    console.error("auth/login error:", err);
    if (err instanceof Error) {
      console.error(err.stack);
    }
    return serverError(err);
  }
});
