import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, conflict, created, ok, serverError } from "@/lib/utils/response";
import { hashPassword } from "@/lib/utils/password";
import { generateId } from "@/lib/utils/id";
import { capitalizeName, normalizePhone } from "@/lib/utils/string";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const parents = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.avatar, u.is_active, u.created_at,
              COUNT(ur.child_id) as children_count
       FROM users u
       LEFT JOIN user_relationships ur ON ur.parent_id = u.id
       WHERE u.school_id = ? AND u.role = 'parent'
       GROUP BY u.id
       ORDER BY u.name`,
      [school.id]
    );
    return ok(parents);
  } catch (err) {
    return serverError(err);
  }
});

export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { name, email, password, phone, avatar } = await req.json();
      const fullName = capitalizeName(name || "");
      const normalizedEmail = email ? String(email).toLowerCase().trim() : null;
      const normalizedPhone = phone ? normalizePhone(phone) : null;

      if (!fullName || (!normalizedEmail && !normalizedPhone)) return badRequest("Name and either email or phone are required");

      if (normalizedEmail) {
        const [existing] = await query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
        if (existing) return conflict("Email already registered");
      }
      if (normalizedPhone) {
        const [existsPhone] = await query("SELECT id FROM users WHERE phone = ?", [normalizedPhone]);
        if (existsPhone) return conflict("Phone already registered");
      }

      const defaultPassword = password || `EduCore@${new Date().getFullYear()}`;
      const hashed = await hashPassword(defaultPassword);
      const id = generateId();
      await execute(
        `INSERT INTO users (id, name, email, password, role, phone, school_id, avatar, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'parent', ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [id, fullName, normalizedEmail, hashed, normalizedPhone || null, school.id, avatar || null]
      );

      return created({ id, name: fullName, email: normalizedEmail, phone: normalizedPhone, role: "parent", defaultPassword });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "admin_staff", "school_owner"]
);
