import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { ok, forbidden, serverError } from "@/lib/utils/response";

export const GET = withAuth(
  async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return forbidden("School context required");

      const activeServices = await query(
        `SELECT s.slug, s.name, s.is_compulsory, ss.status
         FROM services s
         LEFT JOIN school_services ss ON s.id = ss.service_id AND ss.school_id = ?
         WHERE s.is_active = 1 AND (s.is_compulsory = 1 OR ss.status = 'active')`,
        [school.id]
      );

      return ok({
        schoolId: school.id,
        schoolName: school.name,
        academicSession: school.academic_session,
        currentTerm: school.current_term,
        services: activeServices
      });
    } catch (err) {
      return serverError(err);
    }
  },
  ["school_owner", "principal", "super_admin", "parent", "student", "class_teacher", "subject_teacher"]
);
