import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

type Params = { params: { id: string } };

// GET /api/students/[id]
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const student = await queryOne(
      `SELECT id, name, first_name, last_name, email, phone, avatar, admission_no, dob, gender, parent_phone, is_active, created_at, updated_at
       FROM users WHERE id = ? AND school_id = ? AND role = 'student'`,
      [params?.id ?? "", school.id]
    );
    if (!student) return notFound("Student not found");
    return ok(student);
  } catch (err) {
    return serverError(err);
  }
});

// PATCH /api/students/[id]
export const PATCH = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne(
        "SELECT id, first_name, last_name FROM users WHERE id = ? AND school_id = ? AND role = 'student'",
        [id, school.id]
      );
      if (!existing) return notFound("Student not found");

      const { firstName, lastName, dob, gender, parentPhone, isActive, avatar } = await req.json();
      const ex = existing as { first_name: string | null; last_name: string | null };
      const newFirst = firstName ?? ex.first_name ?? "";
      const newLast = lastName ?? ex.last_name ?? "";

      await execute(
        `UPDATE users SET
           first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           name = ?,
           dob = COALESCE(?, dob),
           gender = COALESCE(?, gender),
           parent_phone = COALESCE(?, parent_phone),
           is_active = COALESCE(?, is_active),
           avatar = COALESCE(?, avatar),
           updated_at = datetime('now')
         WHERE id = ?`,
        [firstName || null, lastName || null, `${newFirst} ${newLast}`.trim(),
         dob || null, gender || null, parentPhone || null,
         isActive !== undefined ? (isActive ? 1 : 0) : null,
         avatar || null, id]
      );

      const updated = await queryOne(
        "SELECT id, name, first_name, last_name, email, phone, avatar, admission_no, dob, gender, parent_phone, is_active FROM users WHERE id = ?",
        [id]
      );
      return ok(updated);
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "admin_staff", "school_owner", "vp_admin"]
);

// DELETE /api/students/[id]
export const DELETE = withAuth(
  async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne(
        "SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'student'",
        [id, school.id]
      );
      if (!existing) return notFound("Student not found");

      await execute("DELETE FROM users WHERE id = ?", [id]);
      await execute("DELETE FROM user_relationships WHERE child_id = ? OR parent_id = ?", [id, id]);
      return ok({ message: "Student deleted" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "school_owner"]
);
