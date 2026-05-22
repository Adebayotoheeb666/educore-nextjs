import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth } from "@/lib/middleware/auth";
import { ok, serverError } from "@/lib/utils/response";

// GET /api/admin/users — get all users across platform (super admin only)
export const GET = withAuth(
  async (_req: NextRequest): Promise<NextResponse> => {
    try {
      const users = await query<{
        id: string;
        name: string;
        email: string;
        role: string;
        is_active: number;
        school_id?: string;
        school_name?: string;
        created_at: string;
      }>(
        `SELECT u.id, u.name, u.email, u.role, u.is_active, u.school_id, s.name as school_name, u.created_at
         FROM users u
         LEFT JOIN schools s ON u.school_id = s.id
         ORDER BY u.created_at DESC`
      );

      return ok(users);
    } catch (err) {
      return serverError(err);
    }
  },
  ["super_admin"]
);
