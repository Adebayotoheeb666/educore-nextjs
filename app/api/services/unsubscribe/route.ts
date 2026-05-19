import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/utils/response";

// POST /api/services/unsubscribe - Deactivate a service for a school
export const POST = withAuth(
  async (req: NextRequest, { user, school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return forbidden("School context required");

      const { slug } = await req.json();
      if (!slug) return badRequest("Service slug is required");

      const service = await queryOne<{ id: string; is_compulsory: number }>(
        "SELECT id, is_compulsory FROM services WHERE slug = ?",
        [slug]
      );
      if (!service) return badRequest(`Unknown service: ${slug}`);
      if (service.is_compulsory) {
        return forbidden("Compulsory services cannot be deactivated");
      }

      // Check no active services depend on this one
      const dependents = await query<{ name: string; slug: string }>(
        `SELECT s.name, s.slug
         FROM school_services ss
         JOIN services s ON ss.service_id = s.id
         WHERE ss.school_id = ? AND ss.status = 'active' AND s.dependencies LIKE ?`,
        [school.id, `%"${slug}"%`]
      );

      if (dependents.length > 0) {
        const names = dependents.map((d) => d.name).join(", ");
        return badRequest(
          `Cannot deactivate '${slug}': it is required by active services: ${names}`
        );
      }

      await execute(
        `UPDATE school_services SET status = 'inactive', updated_at = datetime('now')
         WHERE school_id = ? AND service_id = ?`,
        [school.id, service.id]
      );

      return ok({ message: `Service '${slug}' deactivated successfully` });
    } catch (err) {
      return serverError(err);
    }
  },
  ["school_owner", "principal", "super_admin"]
);
