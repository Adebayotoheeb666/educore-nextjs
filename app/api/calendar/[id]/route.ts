import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { forbidden, notFound, ok, serverError } from "@/lib/utils/response";

export const DELETE = withAuth(requireService("calendar", async (
  req: NextRequest,
  { school, user }: AuthContext,
  params?: Record<string, string>
): Promise<NextResponse> => {
  try {
    const id = params?.id;
    if (!id) return notFound("Event not found");
    const event = await queryOne(
      "SELECT id, school_id, created_by FROM academic_calendar WHERE id = ?",
      [id]
    );
    if (!event || event.school_id !== school?.id) return notFound("Event not found");
    if (event.created_by !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      return forbidden("You can only delete events you created");
    }
    await execute("DELETE FROM academic_calendar WHERE id = ?", [id]);
    return ok({ deleted: true });
  } catch (err) { return serverError(err); }
}));
