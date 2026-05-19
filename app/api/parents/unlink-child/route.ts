import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { parentId, studentId } = await req.json();
      if (!parentId || !studentId) return badRequest("parentId and studentId are required");

      await execute(
        "DELETE FROM user_relationships WHERE parent_id = ? AND child_id = ?",
        [parentId, studentId]
      );
      return ok({ message: "Child unlinked from parent" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "admin_staff", "school_owner"]
);
