import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/utils/response";
import { getServiceBySlug, validateDependencies } from "@/config/services/catalog";
import { generateId } from "@/lib/utils/id";

// POST /api/services/subscribe - Subscribe school to a service
export const POST = withAuth(
  async (req: NextRequest, { user, school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return forbidden("School context required");

      const { slug } = await req.json();
      if (!slug) return badRequest("Service slug is required");

      const catalogEntry = getServiceBySlug(slug);
      if (!catalogEntry) return badRequest(`Unknown service: ${slug}`);
      if (catalogEntry.is_compulsory) {
        return badRequest("Compulsory services are automatically activated");
      }

      // Validate all dependencies are active for this school
      const activeSlugs = await queryOne<{ slugs: string }>(
        `SELECT GROUP_CONCAT(s.slug) as slugs
         FROM school_services ss
         JOIN services s ON ss.service_id = s.id
         WHERE ss.school_id = ? AND ss.status = 'active'`,
        [school.id]
      );
      const currentSlugs = activeSlugs?.slugs?.split(",") ?? [];
      const missingDeps = validateDependencies([...currentSlugs, slug]).filter(
        (dep) => !currentSlugs.includes(dep)
      );

      if (missingDeps.length > 0) {
        return badRequest(
          `Cannot activate '${slug}': missing required services: ${missingDeps.join(", ")}`
        );
      }

      // Get service record from DB
      const service = await queryOne<{ id: string }>(
        "SELECT id FROM services WHERE slug = ? AND is_active = 1",
        [slug]
      );
      if (!service) return badRequest(`Service '${slug}' not found or inactive`);

      // Check if already subscribed
      const existing = await queryOne(
        "SELECT id, status FROM school_services WHERE school_id = ? AND service_id = ?",
        [school.id, service.id]
      );

      if (existing && (existing as { status: string }).status === "active") {
        return badRequest(`Service '${slug}' is already active`);
      }

      if (existing) {
        // Reactivate
        await execute(
          `UPDATE school_services SET status = 'active', subscribed_at = datetime('now'), activated_by = ?, updated_at = datetime('now')
           WHERE school_id = ? AND service_id = ?`,
          [user.id, school.id, service.id]
        );
      } else {
        // New subscription
        const id = generateId();
        await execute(
          `INSERT INTO school_services (id, school_id, service_id, status, subscribed_at, price_paid, billing_period, activated_by, created_at, updated_at)
           VALUES (?, ?, ?, 'active', datetime('now'), ?, 'monthly', ?, datetime('now'), datetime('now'))`,
          [id, school.id, service.id, catalogEntry.base_price, user.id]
        );
      }

      return ok({ message: `Service '${slug}' activated successfully` });
    } catch (err) {
      return serverError(err);
    }
  },
  ["school_owner", "principal", "super_admin"]
);
