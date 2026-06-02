import { NextRequest } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { verifyToken } from "@/lib/utils/jwt";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

interface CountRow { total: number }

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("auth_token")?.value;
  const headerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const rawToken = cookieToken || headerToken;

  if (!rawToken) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  let userId: string;
  let schoolId: string | null = null;
  try {
    const payload = verifyToken(rawToken);
    userId = payload.id;
    const user = await queryOne<{ school_id: string | null }>(
      "SELECT school_id FROM users WHERE id = ? AND is_active = 1",
      [userId]
    );
    if (!user) return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    schoolId = user.school_id;
  } catch {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const row = await queryOne<CountRow>(
      `SELECT COUNT(*) AS total FROM announcements
       WHERE school_id = ?
         AND (expires_at IS NULL OR expires_at > datetime('now'))
         AND created_at > datetime('now', '-7 days')`,
      [schoolId ?? ""]
    );

    return new Response(JSON.stringify({ unread: row?.total ?? 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ unread: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
