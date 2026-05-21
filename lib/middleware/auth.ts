import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/jwt";
import { queryOne, execute } from "@/lib/db/turso";
import { unauthorized } from "@/lib/utils/response";
import { isRateLimited } from "./rateLimit";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: string;
  school_id: string | null;
  is_active: number;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  phone: string | null;
  admission_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSchool {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  state: string | null;
  type: string | null;
  sub_domain: string | null;
  address: string | null;
  subscription_status: string;
  subscription_plan: string;
  academic_session: string;
  current_term: string;
}

export interface AuthContext {
  user: DbUser;
  school: DbSchool | null;
}

type RouteHandler = (
  req: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

// Extract token from cookie or Authorization header
function extractToken(req: NextRequest): string | null {
  const cookie = req.cookies.get("token")?.value;
  if (cookie) return cookie;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
}

// Wraps a route handler with authentication. Usage:
//   export const GET = withAuth(async (req, { user, school }) => { ... });
export function withAuth(handler: RouteHandler, allowedRoles?: string[]) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    try {
      const { limited, retryAfter } = isRateLimited(req);
      if (limited) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: { "Retry-After": retryAfter.toString() }
          }
        );
      }

      const token = extractToken(req);
      if (!token) return unauthorized();

      let payload;
      try {
        payload = verifyToken(token);
      } catch (verifyErr) {
        return unauthorized("Invalid or expired token");
      }

      const user = await queryOne<DbUser>(
        `SELECT id, name, email, role, school_id, is_active, first_name, last_name, avatar, phone, admission_no, created_at, updated_at
         FROM users WHERE id = ?`,
        [payload.id]
      );

      if (!user) return unauthorized("User not found");
      if (!user.is_active) return unauthorized("Account deactivated");

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return NextResponse.json({ message: "Access denied" }, { status: 403 });
      }

      let school: DbSchool | null = null;
      if (user.school_id) {
        school = await queryOne<DbSchool>(
          `SELECT id, name, email, phone, state, type, sub_domain, address,
                  subscription_status, subscription_plan, academic_session, current_term
           FROM schools WHERE id = ?`,
          [user.school_id]
        );
      } else if (user.role === "school_owner") {
        // If school owner has no school_id, find and link to their owned school
        school = await queryOne<DbSchool>(
          `SELECT id, name, email, phone, state, type, sub_domain, address,
                  subscription_status, subscription_plan, academic_session, current_term
           FROM schools WHERE owner_id = ?`,
          [user.id]
        );
        // Auto-link the school_id if found
        if (school) {
          await execute("UPDATE users SET school_id = ? WHERE id = ?", [school.id, user.id]);
          user.school_id = school.id;
        }
      }

      const params = context?.params ? await context.params : undefined;
      return handler(req, { user, school }, params);
    } catch (err) {
      return unauthorized("Not authorized, please login");
    }
  };
}
