import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";
import { hashPassword } from "@/lib/utils/password";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const parent = await queryOne(
      `SELECT u.id, u.name, u.email, u.phone, u.avatar, u.is_active, u.created_at,
              GROUP_CONCAT(c.id) as child_ids, GROUP_CONCAT(c.name) as child_names
       FROM users u
       LEFT JOIN user_relationships ur ON ur.parent_id = u.id
       LEFT JOIN users c ON ur.child_id = c.id
       WHERE u.id = ? AND u.school_id = ? AND u.role = 'parent'
       GROUP BY u.id`,
      [params?.id ?? "", school.id]
    );
    if (!parent) return notFound("Parent not found");
    return ok(parent);
  } catch (err) {
    return serverError(err);
  }
});

export const PATCH = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'parent'", [id, school.id]);
      if (!existing) return notFound("Parent not found");

      const { name, phone, avatar, password } = await req.json();
      let hashedPw: string | null = null;
      if (password?.trim()) hashedPw = await hashPassword(password.trim());

      await execute(
        `UPDATE users SET
           name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           avatar = COALESCE(?, avatar),
           password = COALESCE(?, password),
           updated_at = datetime('now')
         WHERE id = ?`,
        [name || null, phone || null, avatar || null, hashedPw, id]
      );

      const updated = await queryOne(
        "SELECT id, name, email, phone, avatar, is_active FROM users WHERE id = ?", [id]
      );
      return ok(updated);
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "admin_staff", "school_owner"]
);

export const DELETE = withAuth(
  async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'parent'", [id, school.id]);
      if (!existing) return notFound("Parent not found");
      await execute("DELETE FROM users WHERE id = ?", [id]);
      await execute("DELETE FROM user_relationships WHERE parent_id = ?", [id]);
      return ok({ message: "Parent deleted" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "school_owner"]
);
