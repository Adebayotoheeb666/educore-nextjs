import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError, conflict } from "@/lib/utils/response";
import { normalizePhone } from "@/lib/utils/string";

const TEACHER_ROLES = ["class_teacher", "subject_teacher"];

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const teacher = await queryOne(
      "SELECT id, name, first_name, last_name, email, phone, avatar, role, is_active, created_at FROM users WHERE id = ? AND school_id = ?",
      [params?.id ?? "", school.id]
    );
    if (!teacher) return notFound("Teacher not found");
    return ok(teacher);
  } catch (err) {
    return serverError(err);
  }
});

export const PATCH = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const ex = await queryOne<{ first_name: string | null; last_name: string | null; email: string | null; phone: string | null; gender: string | null }>(
        "SELECT id, first_name, last_name, email, phone, gender FROM users WHERE id = ? AND school_id = ?",
        [id, school.id]
      );
      if (!ex) return notFound("Teacher not found");

      const { firstName, lastName, email, phone, role, isActive, avatar, gender } = await req.json();
      if (role && !TEACHER_ROLES.includes(role)) return badRequest("Invalid role");

      const normalizedEmail = email !== undefined ? (email ? String(email).toLowerCase().trim() : null) : ex.email;
      const normalizedPhone = phone !== undefined ? normalizePhone(phone) : ex.phone;

      if (!normalizedEmail && !normalizedPhone) {
        return badRequest("Teachers must have either an email or phone number");
      }

      if (email !== undefined && normalizedEmail) {
        const existingEmail = await queryOne("SELECT id FROM users WHERE email = ? AND id != ?", [normalizedEmail, id]);
        if (existingEmail) return conflict("Email is already registered");
      }
      if (phone !== undefined && normalizedPhone) {
        const existingPhone = await queryOne("SELECT id FROM users WHERE phone = ? AND id != ?", [normalizedPhone, id]);
        if (existingPhone) return conflict("Phone number is already registered");
      }

      const newFirst = firstName ?? ex.first_name ?? "";
      const newLast = lastName ?? ex.last_name ?? "";

      await execute(
        `UPDATE users SET
           first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           name = ?,
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           role = COALESCE(?, role),
           is_active = COALESCE(?, is_active),
           avatar = COALESCE(?, avatar),
           gender = COALESCE(?, gender),
           updated_at = datetime('now')
         WHERE id = ?`,
        [firstName || null, lastName || null, `${newFirst} ${newLast}`.trim(), email !== undefined ? normalizedEmail : null,
         phone !== undefined ? normalizedPhone : null, role || null,
         isActive !== undefined ? (isActive ? 1 : 0) : null,
         avatar || null, gender || null, id]
      );

      const updated = await queryOne(
        "SELECT id, name, first_name, last_name, email, phone, avatar, role, is_active, gender FROM users WHERE id = ?",
        [id]
      );
      return ok(updated);
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "school_owner"]
);

export const DELETE = withAuth(
  async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const existing = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ?", [params?.id ?? "", school.id]);
      if (!existing) return notFound("Teacher not found");
      await execute("DELETE FROM users WHERE id = ?", [params?.id ?? ""]);
      return ok({ message: "Teacher deleted" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "school_owner"]
);
