import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { ok, serverError, badRequest, conflict } from "@/lib/utils/response";
import { normalizePhone } from "@/lib/utils/string";

export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req: NextRequest, { user }: AuthContext): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, avatar } = body;

    const currentUser = await queryOne<{
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
    }>(
      "SELECT first_name, last_name, email, phone FROM users WHERE id = ?",
      [user.id]
    );

    if (!currentUser) return badRequest("User not found");

    const normalizedEmail = email !== undefined ? (email ? String(email).toLowerCase().trim() : null) : currentUser.email;
    const normalizedPhone = phone !== undefined ? normalizePhone(phone) : currentUser.phone;

    if (!normalizedEmail && !normalizedPhone) {
      return badRequest("Please provide either an email or phone number");
    }

    if (email !== undefined && normalizedEmail) {
      const existingEmail = await queryOne("SELECT id FROM users WHERE email = ? AND id != ?", [normalizedEmail, user.id]);
      if (existingEmail) return conflict("Email is already in use");
    }
    if (phone !== undefined && normalizedPhone) {
      const existingPhone = await queryOne("SELECT id FROM users WHERE phone = ? AND id != ?", [normalizedPhone, user.id]);
      if (existingPhone) return conflict("Phone number is already in use");
    }

    const newFirstName = firstName ?? currentUser.first_name ?? "";
    const newLastName = lastName ?? currentUser.last_name ?? "";
    const newName = `${newFirstName} ${newLastName}`.trim();

    await execute(
      `UPDATE users
       SET first_name = ?, last_name = ?, name = ?, email = COALESCE(?, email), phone = COALESCE(?, phone), avatar = COALESCE(?, avatar), updated_at = datetime('now')
       WHERE id = ?`,
      [newFirstName || null, newLastName || null, newName, email !== undefined ? normalizedEmail : null, phone !== undefined ? normalizedPhone : null, avatar || null, user.id]
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
