import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export const GET = withAuth(
  async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const admins = await query(
        `SELECT id, name, email, phone, role, avatar, is_active, created_at
         FROM users
         WHERE school_id = ? AND role IN ('principal','vp_academics','vp_admin','admin_staff','bursar','librarian')
         ORDER BY name`,
        [school.id]
      );
      return ok(admins);
    } catch (err) {
      return serverError(err);
    }
  },
  ["school_owner"]
);
