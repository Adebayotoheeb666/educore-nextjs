import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const parent = await queryOne(
      "SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'parent'",
      [params?.id ?? "", school.id]
    );
    if (!parent) return notFound("Parent not found");

    const children = await query(
      `SELECT u.id, u.name, u.first_name, u.last_name, u.email, u.admission_no, u.avatar,
              ur.relationship as relationship
       FROM user_relationships ur
       JOIN users u ON ur.child_id = u.id
       WHERE ur.parent_id = ?`,
      [params?.id ?? ""]
    );
    return ok(children);
  } catch (err) {
    return serverError(err);
  }
});
