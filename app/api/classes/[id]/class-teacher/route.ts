import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// POST /api/classes/[id]/class-teacher — assign a class teacher
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";
      const { teacherId } = await req.json();

      if (!teacherId) return badRequest("teacherId is required");

      const cls = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!cls) return notFound("Class not found");

      const teacher = await queryOne(
        "SELECT id, name FROM users WHERE id = ? AND school_id = ? AND role = 'class_teacher'",
        [teacherId, school.id]
      );
      if (!teacher) return notFound("Class teacher not found");

      await execute(
        "UPDATE classes SET class_teacher_id = ?, updated_at = datetime('now') WHERE id = ?",
        [teacherId, classId]
      );

      return ok({ classId, classTeacherId: teacherId, classTeacherName: teacher.name });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "school_owner"]
);

// DELETE /api/classes/[id]/class-teacher — remove class teacher
export const DELETE = withAuth(
  async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";

      const cls = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!cls) return notFound("Class not found");

      await execute(
        "UPDATE classes SET class_teacher_id = NULL, updated_at = datetime('now') WHERE id = ?",
        [classId]
      );

      return ok({ message: "Class teacher removed" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "school_owner"]
);
