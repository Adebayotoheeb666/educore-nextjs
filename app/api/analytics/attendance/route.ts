import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(requireService("analytics", async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const sid = school.id;

    const [overall, byClass] = await Promise.all([
      queryOne<{ rate: number }>(
        "SELECT COALESCE(ROUND(100.0*SUM(CASE WHEN status='present' THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0),1),0) rate FROM attendance WHERE school_id=?",
        [sid]
      ),
      query<{ class: string; rate: number }>(
        `SELECT c.name || COALESCE(' ' || c.section, '') as class,
         COALESCE(ROUND(100.0*SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0),1),0) as rate
         FROM attendance a JOIN classes c ON a.class_id=c.id
         WHERE a.school_id=?
         GROUP BY a.class_id ORDER BY rate DESC LIMIT 10`,
        [sid]
      ),
    ]);

    return ok({
      thisWeek: overall?.rate ?? 0,
      lastWeek: null,
      byClass,
    });
  } catch (err) {
    return serverError(err);
  }
}));
