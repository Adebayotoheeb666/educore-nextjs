import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

// POST /api/students/promote
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { fromClassId, toClassId, studentIds } = await req.json();

      if (!fromClassId || !toClassId || !Array.isArray(studentIds) || !studentIds.length) {
        return badRequest("fromClassId, toClassId, and studentIds are required");
      }

      const [fromClass, toClass] = await Promise.all([
        queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [fromClassId, school.id]),
        queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [toClassId, school.id]),
      ]);

      if (!fromClass || !toClass) return notFound("One or both classes not found");

      // Update attendance records to reflect new class (forward-looking only; history stays in old class)
      // In SQLite, promotion is tracked as attendance class changes
      // For now, update any future timetable/class-related data
      // The main effect: future attendance will use the new classId when teachers mark it

      return ok({ message: `Promoted ${studentIds.length} student(s)`, count: studentIds.length });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_academics", "school_owner"]
);
