import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// POST /api/results/release
export const POST = withAuth(
  requireService("results", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { classId, term, session } = await req.json();

      const args: (string | number | boolean | null)[] = [school.id];
      let filters = "";
      if (classId) { filters += " AND class_id = ?"; args.push(classId); }
      if (term)    { filters += " AND term = ?"; args.push(term); }
      if (session) { filters += " AND academic_session = ?"; args.push(session); }

      await execute(
        `UPDATE results SET remark = COALESCE(remark, 'Released'), updated_at = datetime('now') WHERE school_id = ? ${filters}`,
        args
      );

      return ok({ message: "Results released successfully" });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["school_owner", "principal", "vp_academics", "vp_admin", "admin_staff"]
);
