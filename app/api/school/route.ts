import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { ok, notFound, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// GET /api/school — get current school
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const full = await queryOne("SELECT * FROM schools WHERE id = ?", [school.id]);
    return ok(full);
  } catch (err) {
    return serverError(err);
  }
});

// PATCH /api/school — update school info
export const PATCH = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { name, address, phone, state, type, email, logo } = await req.json();
      await execute(
        `UPDATE schools SET
           name = COALESCE(?, name),
           address = COALESCE(?, address),
           phone = COALESCE(?, phone),
           state = COALESCE(?, state),
           type = COALESCE(?, type),
           email = COALESCE(?, email),
           logo = COALESCE(?, logo),
           updated_at = datetime('now')
         WHERE id = ?`,
        [name || null, address || null, phone || null, state || null, type || null, email || null, logo || null, school.id]
      );
      const updated = await queryOne("SELECT * FROM schools WHERE id = ?", [school.id]);
      return ok(updated);
    } catch (err) {
      return serverError(err);
    }
  },
  ["school_owner", "principal"]
);
