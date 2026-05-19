import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

const VALID_TERMS = ["first", "second", "third"];

// PATCH /api/school/settings
export const PATCH = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { academicSession, currentTerm } = await req.json();

      if (currentTerm && !VALID_TERMS.includes(currentTerm)) {
        return badRequest("currentTerm must be 'first', 'second', or 'third'");
      }

      await execute(
        `UPDATE schools SET
           academic_session = COALESCE(?, academic_session),
           current_term = COALESCE(?, current_term),
           updated_at = datetime('now')
         WHERE id = ?`,
        [academicSession || null, currentTerm || null, school.id]
      );

      const updated = await queryOne("SELECT * FROM schools WHERE id = ?", [school.id]);
      return ok(updated);
    } catch (err) {
      return serverError(err);
    }
  },
  ["school_owner", "principal"]
);
