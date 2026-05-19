import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// GET /api/parents/children — returns the authenticated parent's linked children
export const GET = withAuth(
  async (_req: NextRequest, { user, school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");

      const children = await query<{
        id: string; name: string; email: string; admission_no: string | null;
        class_name: string | null; class_section: string | null; avatar: string | null;
      }>(
        `SELECT u.id, u.name, u.email, u.admission_no, u.avatar,
                c.name as class_name, c.section as class_section
         FROM user_relationships ur
         JOIN users u ON ur.child_id = u.id
         LEFT JOIN classes c ON u.class_id = c.id
         WHERE ur.parent_id = ? AND u.school_id = ? AND u.is_active = 1
         ORDER BY u.name`,
        [user.id, school.id]
      );

      return ok(children);
    } catch (err) {
      return serverError(err);
    }
  },
  ["parent"]
);
