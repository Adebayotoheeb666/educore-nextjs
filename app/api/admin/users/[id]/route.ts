import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

// PATCH /api/admin/users/[id] — activate/deactivate a user (super admin only)
export const PATCH = withAuth(
  async (req: NextRequest, _ctx: AuthContext, params): Promise<NextResponse> => {
    try {
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM users WHERE id = ?", [id]);
      if (!existing) return notFound("User not found");

      const { is_active, role } = await req.json();

      const updates: string[] = [];
      const args: (string | number | boolean | null)[] = [];

      if (is_active !== undefined) { updates.push("is_active = ?"); args.push(is_active ? 1 : 0); }
      if (role)       { updates.push("role = ?"); args.push(role); }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        args.push(id);
        await execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, args);
      }

      return ok({ id, updated: true });
    } catch (err) {
      return serverError(err);
    }
  },
  ["super_admin"]
);
