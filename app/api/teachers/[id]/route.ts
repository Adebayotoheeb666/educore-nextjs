import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

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
      const ex = await queryOne<{ first_name: string | null; last_name: string | null }>(
        "SELECT id, first_name, last_name FROM users WHERE id = ? AND school_id = ?",
        [id, school.id]
      );
      if (!ex) return notFound("Teacher not found");

      const { firstName, lastName, phone, role, isActive, avatar } = await req.json();
      if (role && !TEACHER_ROLES.includes(role)) return badRequest("Invalid role");

      const newFirst = firstName ?? ex.first_name ?? "";
      const newLast = lastName ?? ex.last_name ?? "";

      await execute(
        `UPDATE users SET
           first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           name = ?,
           phone = COALESCE(?, phone),
           role = COALESCE(?, role),
           is_active = COALESCE(?, is_active),
           avatar = COALESCE(?, avatar),
           updated_at = datetime('now')
         WHERE id = ?`,
        [firstName || null, lastName || null, `${newFirst} ${newLast}`.trim(),
         phone || null, role || null,
         isActive !== undefined ? (isActive ? 1 : 0) : null,
         avatar || null, id]
      );

      const updated = await queryOne(
        "SELECT id, name, first_name, last_name, email, phone, avatar, role, is_active FROM users WHERE id = ?",
        [id]
      );
      return ok(updated);
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin"]
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
  ["principal"]
);
