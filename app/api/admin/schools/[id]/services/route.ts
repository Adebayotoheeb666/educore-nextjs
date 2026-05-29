import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/utils/response";
import { SERVICE_CATALOG, getServiceBySlug } from "@/config/services/catalog";
import { generateId } from "@/lib/utils/id";

/**
 * GET /api/admin/schools/[id]/services
 * Returns all services with their activation status for a specific school.
 * Super admin only.
 */
export const GET = withAuth(
  async (_req: NextRequest, { user }: AuthContext, params?: Record<string, string>): Promise<NextResponse> => {
    try {
      const schoolId = params?.id;
      if (!schoolId) return badRequest("School ID required");

      const school = await queryOne<{ id: string; name: string }>(
        "SELECT id, name FROM schools WHERE id = ?",
        [schoolId]
      );
      if (!school) return badRequest("School not found");

      const rows = await query<{
        id: string; slug: string; name: string; description: string;
        base_price: number; category: string; is_compulsory: number;
        subscription_status: string | null; subscribed_at: string | null; activated_by_name: string | null;
      }>(
        `SELECT s.id, s.slug, s.name, s.description, s.base_price, s.category, s.is_compulsory,
                ss.status as subscription_status, ss.subscribed_at,
                u.name as activated_by_name
         FROM services s
         LEFT JOIN school_services ss ON s.id = ss.service_id AND ss.school_id = ?
         LEFT JOIN users u ON ss.activated_by = u.id
         WHERE s.is_active = 1
         ORDER BY s.is_compulsory DESC, s.category, s.name`,
        [schoolId]
      );

      return ok({ school, services: rows });
    } catch (err) {
      return serverError(err);
    }
  },
  ["super_admin"]
);

/**
 * POST /api/admin/schools/[id]/services
 * Activate or deactivate a service for a school (super admin override).
 * Body: { slug: string; action: "activate" | "deactivate" }
 */
export const POST = withAuth(
  async (req: NextRequest, { user }: AuthContext, params?: Record<string, string>): Promise<NextResponse> => {
    try {
      const schoolId = params?.id;
      if (!schoolId) return badRequest("School ID required");

      const { slug, action } = await req.json();
      if (!slug || !action) return badRequest("slug and action are required");
      if (!["activate", "deactivate"].includes(action)) return badRequest("action must be 'activate' or 'deactivate'");

      const catalogEntry = getServiceBySlug(slug);
      if (!catalogEntry) return badRequest(`Unknown service: ${slug}`);

      const school = await queryOne<{ id: string }>("SELECT id FROM schools WHERE id = ?", [schoolId]);
      if (!school) return badRequest("School not found");

      const service = await queryOne<{ id: string; is_compulsory: number }>(
        "SELECT id, is_compulsory FROM services WHERE slug = ? AND is_active = 1",
        [slug]
      );
      if (!service) return badRequest(`Service '${slug}' not found in catalog`);

      if (action === "activate") {
        if (service.is_compulsory) return badRequest("Compulsory services are always active");

        const existing = await queryOne<{ status: string }>(
          "SELECT status FROM school_services WHERE school_id = ? AND service_id = ?",
          [schoolId, service.id]
        );

        if (existing && existing.status === "active") {
          return badRequest(`Service '${slug}' is already active`);
        }

        if (existing) {
          await execute(
            `UPDATE school_services SET status = 'active', subscribed_at = datetime('now'),
             activated_by = ?, updated_at = datetime('now') WHERE school_id = ? AND service_id = ?`,
            [user.id, schoolId, service.id]
          );
        } else {
          const id = generateId();
          await execute(
            `INSERT INTO school_services (id, school_id, service_id, status, subscribed_at, price_paid, billing_period, activated_by, created_at, updated_at)
             VALUES (?, ?, ?, 'active', datetime('now'), ?, 'monthly', ?, datetime('now'), datetime('now'))`,
            [id, schoolId, service.id, catalogEntry.base_price, user.id]
          );
        }
        return ok({ message: `Service '${catalogEntry.name}' activated for school` });
      }

      // Deactivate
      if (service.is_compulsory) return forbidden("Compulsory services cannot be deactivated");

      // Check if any active service depends on this one
      const dependents = await query<{ name: string }>(
        `SELECT s.name FROM school_services ss
         JOIN services s ON ss.service_id = s.id
         WHERE ss.school_id = ? AND ss.status = 'active' AND s.dependencies LIKE ?`,
        [schoolId, `%"${slug}"%`]
      );

      if (dependents.length > 0) {
        return badRequest(
          `Cannot deactivate '${slug}': required by active services: ${dependents.map((d) => d.name).join(", ")}`
        );
      }

      await execute(
        `UPDATE school_services SET status = 'inactive', updated_at = datetime('now')
         WHERE school_id = ? AND service_id = ?`,
        [schoolId, service.id]
      );

      return ok({ message: `Service '${catalogEntry.name}' deactivated for school` });
    } catch (err) {
      return serverError(err);
    }
  },
  ["super_admin"]
);

/**
 * PUT /api/admin/schools/[id]/services
 * Bulk activate a set of services for a school (e.g. assign a preset plan).
 * Body: { slugs: string[] }
 * Super admin only — skips dependency checks (admin override).
 */
export const PUT = withAuth(
  async (req: NextRequest, { user }: AuthContext, params?: Record<string, string>): Promise<NextResponse> => {
    try {
      const schoolId = params?.id;
      if (!schoolId) return badRequest("School ID required");

      const { slugs } = await req.json();
      if (!Array.isArray(slugs)) return badRequest("slugs must be an array");

      const school = await queryOne<{ id: string }>("SELECT id FROM schools WHERE id = ?", [schoolId]);
      if (!school) return badRequest("School not found");

      let activated = 0;
      for (const slug of slugs) {
        const catalogEntry = getServiceBySlug(slug);
        if (!catalogEntry || catalogEntry.is_compulsory) continue;

        const service = await queryOne<{ id: string }>(
          "SELECT id FROM services WHERE slug = ? AND is_active = 1",
          [slug]
        );
        if (!service) continue;

        const existing = await queryOne<{ status: string }>(
          "SELECT status FROM school_services WHERE school_id = ? AND service_id = ?",
          [schoolId, service.id]
        );

        if (existing) {
          if (existing.status !== "active") {
            await execute(
              `UPDATE school_services SET status = 'active', subscribed_at = datetime('now'),
               activated_by = ?, updated_at = datetime('now') WHERE school_id = ? AND service_id = ?`,
              [user.id, schoolId, service.id]
            );
            activated++;
          }
        } else {
          const id = generateId();
          await execute(
            `INSERT INTO school_services (id, school_id, service_id, status, subscribed_at, price_paid, billing_period, activated_by, created_at, updated_at)
             VALUES (?, ?, ?, 'active', datetime('now'), 0, 'monthly', ?, datetime('now'), datetime('now'))`,
            [id, schoolId, service.id, user.id]
          );
          activated++;
        }
      }

      return ok({ message: `${activated} service(s) activated successfully` });
    } catch (err) {
      return serverError(err);
    }
  },
  ["super_admin"]
);
