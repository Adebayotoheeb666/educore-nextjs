import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/utils/response";
import { initializeTransaction } from "@/lib/services/payments/paystack";
import { getServiceBySlug } from "@/config/services/catalog";
import { generateId } from "@/lib/utils/id";

// POST /api/services/initialize-payment
// Body: { serviceSlug, callbackUrl? }
export const POST = withAuth(
  async (req: NextRequest, { user, school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return forbidden("School context required");

      const { serviceSlug, callbackUrl } = await req.json();
      if (!serviceSlug) return badRequest("serviceSlug is required");

      // Verify the service exists in catalog
      const catalogEntry = getServiceBySlug(serviceSlug);
      if (!catalogEntry) return badRequest(`Unknown service: ${serviceSlug}`);
      
      if (catalogEntry.is_compulsory) {
        return badRequest("Compulsory services are automatically activated");
      }

      if (catalogEntry.base_price === 0) {
        return badRequest(`Service '${serviceSlug}' is free and doesn't require payment`);
      }

      // Get service from database
      const service = await queryOne<{ id: string; name: string }>(
        "SELECT id, name FROM services WHERE slug = ? AND is_active = 1",
        [serviceSlug]
      );
      if (!service) return notFound(`Service '${serviceSlug}' not found or inactive`);

      // Check if already active
      const existing = await queryOne(
        "SELECT id, status FROM school_services WHERE school_id = ? AND service_id = ?",
        [school.id, service.id]
      );
      
      if (existing && (existing as { status: string }).status === "active") {
        return badRequest(`Service '${serviceSlug}' is already active`);
      }

      if (!school.email && !user.email) {
        return badRequest("School or user email is required for payment");
      }

      // Use school email if available, otherwise use user email
      const paymentEmail = school.email || user.email;

      // Generate unique reference
      const reference = `SVC-${generateId().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      // Initialize Paystack transaction
      const result = await initializeTransaction({
        email: paymentEmail,
        amount: catalogEntry.base_price,
        reference,
        callback_url: callbackUrl ?? `${appUrl}/services?ref=${reference}&status=success`,
        metadata: {
          school_id: school.id,
          service_id: service.id,
          service_slug: serviceSlug,
          service_name: service.name,
          school_name: school.name,
          custom_fields: [
            { display_name: "School", variable_name: "school_name", value: school.name },
            { display_name: "Service", variable_name: "service_name", value: service.name },
          ],
        },
      });

      if (!result.status || !result.data) {
        return badRequest(result.message ?? "Paystack initialization failed");
      }

      return ok({
        authorizationUrl: result.data.authorization_url,
        accessCode: result.data.access_code,
        reference: result.data.reference,
        amount: catalogEntry.base_price,
        serviceName: service.name,
        schoolName: school.name,
      });
    } catch (err) {
      return serverError(err);
    }
  },
  ["school_owner", "principal", "super_admin"]
);
