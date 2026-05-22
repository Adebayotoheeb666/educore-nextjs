import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

type Params = { params: { id: string } };

// GET /api/students/[id]
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const student = await queryOne(
      `SELECT u.id, u.name, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.admission_no, u.dob, u.gender, u.parent_phone, u.is_active, u.address, u.state_of_origin, u.created_at, u.updated_at,
              c.name as class_name, c.section as class_section,
              p.email as parent_email, 'active' as status
       FROM users u
       LEFT JOIN classes c ON u.class_id = c.id
       LEFT JOIN user_relationships ur ON u.id = ur.child_id
       LEFT JOIN users p ON ur.parent_id = p.id
       WHERE u.id = ? AND u.school_id = ? AND u.role = 'student'`,
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

      const { firstName, lastName, email, dob, gender, classId, parentId, isActive, avatar, address, stateOfOrigin } = await req.json();
      const ex = existing as { first_name: string | null; last_name: string | null };
      const newFirst = firstName ?? ex.first_name ?? "";
      const newLast = lastName ?? ex.last_name ?? "";

      let setClauses = `first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           name = ?,
           dob = COALESCE(?, dob),
           gender = ?,
           is_active = COALESCE(?, is_active),
           avatar = COALESCE(?, avatar),
           class_id = COALESCE(?, class_id),
           address = COALESCE(?, address),
           state_of_origin = COALESCE(?, state_of_origin),
           updated_at = datetime('now')`;
      let args: (string | number | null)[] = [firstName || null, lastName || null, `${newFirst} ${newLast}`.trim(),
         dob || null, gender !== undefined ? gender : null,
         isActive !== undefined ? (isActive ? 1 : 0) : null,
         avatar || null,
         classId || null,
         address || null,
         stateOfOrigin || null];

      if (email !== undefined) {
        setClauses = `email = COALESCE(?, email), ${setClauses}`;
        args.unshift(email || null);
      }

      args.push(id);

      await execute(
        `UPDATE users SET ${setClauses} WHERE id = ?`,
        args
      );

      if (parentId) {
        const parentRecord = await queryOne(
          "SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'parent'",
          [parentId, school.id]
        );
        if (parentRecord) {
          const relId = generateId();
          await execute(
            `INSERT OR IGNORE INTO user_relationships (id, parent_id, child_id, created_at) VALUES (?, ?, ?, datetime('now'))`,
            [relId, parentId, id]
          );
        }
      }

      const updated = await queryOne(
        `SELECT u.id, u.name, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.admission_no, u.dob, u.gender, u.parent_phone, u.is_active, u.address, u.state_of_origin, u.created_at, u.updated_at,
                c.name as class_name, c.section as class_section,
                p.email as parent_email, 'active' as status
         FROM users u
         LEFT JOIN classes c ON u.class_id = c.id
         LEFT JOIN user_relationships ur ON u.id = ur.child_id
         LEFT JOIN users p ON ur.parent_id = p.id
         WHERE u.id = ?`,
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
  ["principal", "school_owner", "admin_staff", "vp_admin"]
);
