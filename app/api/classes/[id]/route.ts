import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute, query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const classDoc = await queryOne(
      `SELECT c.*, u.name as teacher_name, u.email as teacher_email
       FROM classes c LEFT JOIN users u ON c.class_teacher_id = u.id
       WHERE c.id = ? AND c.school_id = ?`,
      [params?.id ?? "", school.id]
    );
    if (!classDoc) return notFound("Class not found");

    const students = await query(
      "SELECT id, name, first_name, last_name, admission_no, avatar FROM users WHERE school_id = ? AND role = 'student' ORDER BY name",
      [school.id]
    );
    const subjects = await query(
      "SELECT id, name, code FROM subjects WHERE school_id = ? AND class_id = ?",
      [school.id, params?.id ?? ""]
    );

    return ok({ ...classDoc, students, subjects });
  } catch (err) {
    return serverError(err);
  }
});

export const PATCH = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!existing) return notFound("Class not found");

      const { name, arm, level, classTeacher } = await req.json();
      await execute(
        `UPDATE classes SET
           name = COALESCE(?, name),
           section = COALESCE(?, section),
           level = COALESCE(?, level),
           class_teacher_id = COALESCE(?, class_teacher_id),
           updated_at = datetime('now')
         WHERE id = ?`,
        [name || null, arm || null, level || null, classTeacher || null, id]
      );

      const updated = await queryOne(
        "SELECT c.*, u.name as teacher_name FROM classes c LEFT JOIN users u ON c.class_teacher_id = u.id WHERE c.id = ?",
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
      const id = params?.id ?? "";
      const existing = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!existing) return notFound("Class not found");
      await execute("DELETE FROM classes WHERE id = ?", [id]);
      return ok({ message: "Class deleted" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "school_owner"]
);
