import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, conflict, created, ok, serverError } from "@/lib/utils/response";
import { hashPassword } from "@/lib/utils/password";
import { generateId } from "@/lib/utils/id";

const TEACHER_ROLES = ["class_teacher", "subject_teacher"];

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const teachers = await query(
      `SELECT id, name, first_name, last_name, email, phone, avatar, role, is_active, created_at
       FROM users WHERE school_id = ? AND role IN ('class_teacher','subject_teacher')
       ORDER BY name`,
      [school.id]
    );
    return ok(teachers);
  } catch (err) {
    return serverError(err);
  }
});

export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { name, firstName, lastName, email, password, phone, role, avatar } = await req.json();
      const fullName = name || `${firstName ?? ""} ${lastName ?? ""}`.trim();

      if (!fullName || !email) {
        return badRequest("Name and email are required");
      }

      const defaultPassword = password || `EduCore@${new Date().getFullYear()}`;

      const normalizedEmail = String(email).toLowerCase().trim();
      const [existing] = await query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
      if (existing) return conflict("Email already registered");

      const teacherRole = TEACHER_ROLES.includes(role) ? role : "subject_teacher";
      const hashed = await hashPassword(defaultPassword);
      const id = generateId();

      await execute(
        `INSERT INTO users (id, name, first_name, last_name, email, password, phone, role, school_id, avatar, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [id, fullName, firstName || fullName.split(" ")[0], lastName || fullName.split(" ").slice(1).join(" "),
         normalizedEmail, hashed, phone || null, teacherRole, school.id, avatar || null]
      );

      return created({ id, name: fullName, email: normalizedEmail, role: teacherRole, defaultPassword });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin"]
);
