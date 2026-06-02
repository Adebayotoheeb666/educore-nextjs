import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req: NextRequest, { user }: AuthContext): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, avatar } = body;

    const currentUser = await queryOne<{
      first_name: string | null;
      last_name: string | null;
    }>(
      "SELECT first_name, last_name FROM users WHERE id = ?",
      [user.id]
    );

    const newFirstName = firstName ?? currentUser?.first_name ?? "";
    const newLastName = lastName ?? currentUser?.last_name ?? "";
    const newName = `${newFirstName} ${newLastName}`.trim();

    await execute(
      `UPDATE users
       SET first_name = ?, last_name = ?, name = ?, phone = COALESCE(?, phone), avatar = COALESCE(?, avatar), updated_at = datetime('now')
       WHERE id = ?`,
      [newFirstName || null, newLastName || null, newName, phone || null, avatar || null, user.id]
    );

    const updated = await queryOne(
      `SELECT id, name, first_name, last_name, email, role, school_id, phone, avatar, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [user.id]
    );

    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
});
