import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { parentId, studentId, relationship } = await req.json();
      if (!parentId || !studentId) return badRequest("parentId and studentId are required");

      const [parent, student] = await Promise.all([
        queryOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'parent'", [parentId, school.id]),
        queryOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'student'", [studentId, school.id]),
      ]);
      if (!parent || !student) return notFound("Parent or student not found");

      const id = generateId();
      await execute(
        "INSERT OR IGNORE INTO user_relationships (id, parent_id, child_id, relationship, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
        [id, parentId, studentId, relationship || null]
      );
      return ok({ message: "Child assigned to parent" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "admin_staff", "school_owner"]
);
