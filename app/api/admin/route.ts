import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { withAuth } from "@/lib/middleware/auth";
import { ok, serverError } from "@/lib/utils/response";

// GET /api/admin — super admin overview
export const GET = withAuth(async (_req: NextRequest): Promise<NextResponse> => {
  try {
    const [schools, users, students, teachers, services, recentSchools] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM schools"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE is_active = 1"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = 1"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'teacher' AND is_active = 1"),
      query("SELECT slug, name, is_compulsory, base_price, is_active FROM services ORDER BY category, name"),
      query("SELECT id, name, created_at, subscription_status FROM schools ORDER BY created_at DESC LIMIT 5"),
    ]);

    const totalSchools = schools?.count ?? 0;
    const totalUsers = users?.count ?? 0;
    const totalStudents = students?.count ?? 0;
    const totalTeachers = teachers?.count ?? 0;

    return ok({
      totals: {
        schools: totalSchools,
        users: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        revenue: 0,
        activeSchools: 0,
        inactiveSchools: 0,
        trialSchools: 0,
      },
      recentSchools,
      services,
    });
  } catch (err) {
    return serverError(err);
  }
}, ["super_admin"]);
