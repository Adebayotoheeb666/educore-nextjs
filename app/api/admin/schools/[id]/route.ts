import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError, badRequest } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/schools/[id] — delete a school (super admin only)
 * Deletes the school, its users, and all cascading school-scoped records.
 */
export const DELETE = withAuth(
  async (_req: NextRequest, _ctx: AuthContext, params?: Record<string, string>): Promise<NextResponse> => {
    try {
      const id = params?.id ?? "";
      if (!id) return badRequest("School ID is required");

      const existing = await queryOne<{ id: string; owner_id: string | null }>(
        "SELECT id, owner_id FROM schools WHERE id = ?",
        [id]
      );
      if (!existing) return notFound("School not found");

      // SQLite ON DELETE CASCADE will clean up all child records (users, classes, fees, etc.)
      // We delete users first to avoid any FK constraint issues with school_id = NULL fallback.
      await execute("DELETE FROM users WHERE school_id = ?", [id]);

      // If the school has an owner user without school_id, delete them too
      if (existing.owner_id) {
        await execute("DELETE FROM users WHERE id = ?", [existing.owner_id]);
      }

      // Deleting the school cascades to all other school-scoped tables
      await execute("DELETE FROM schools WHERE id = ?", [id]);

      return ok({ id, deleted: true });
    } catch (err) {
      return serverError(err);
    }
  },
  ["super_admin"]
);
