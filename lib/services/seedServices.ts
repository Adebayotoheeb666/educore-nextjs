import { execute, queryOne } from "@/lib/db/turso";
import { SERVICE_CATALOG } from "@/config/services/catalog";

// Seeds the services table from the catalog. Safe to call multiple times (upsert).
export async function seedServices(): Promise<void> {
  for (const svc of SERVICE_CATALOG) {
    const existing = await queryOne("SELECT id FROM services WHERE id = ?", [svc.id]);
    if (existing) {
      await execute(
        `UPDATE services SET name = ?, slug = ?, description = ?, is_compulsory = ?, base_price = ?,
         billing_period = ?, dependencies = ?, category = ?, is_active = 1, version = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [
          svc.name, svc.slug, svc.description, svc.is_compulsory ? 1 : 0,
          svc.base_price, svc.billing_period, JSON.stringify(svc.dependencies),
          svc.category, svc.version, svc.id,
        ]
      );
    } else {
      await execute(
        `INSERT INTO services (id, name, slug, description, is_compulsory, base_price, billing_period, dependencies, category, is_active, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))`,
        [
          svc.id, svc.name, svc.slug, svc.description, svc.is_compulsory ? 1 : 0,
          svc.base_price, svc.billing_period, JSON.stringify(svc.dependencies),
          svc.category, svc.version,
        ]
      );
    }
  }
}

// Activates all compulsory services for a newly registered school.
export async function activateCompulsoryServices(
  schoolId: string,
  activatedBy: string
): Promise<void> {
  const compulsory = SERVICE_CATALOG.filter((s) => s.is_compulsory);
  for (const svc of compulsory) {
    const existing = await queryOne(
      "SELECT id FROM school_services WHERE school_id = ? AND service_id = ?",
      [schoolId, svc.id]
    );
    if (!existing) {
      const id = crypto.randomUUID();
      await execute(
        `INSERT INTO school_services (id, school_id, service_id, status, subscribed_at, price_paid, billing_period, activated_by, created_at, updated_at)
         VALUES (?, ?, ?, 'active', datetime('now'), 0, 'monthly', ?, datetime('now'), datetime('now'))`,
        [id, schoolId, svc.id, activatedBy]
      );
    }
  }
}
