import { NextRequest } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { verifyToken } from "@/lib/utils/jwt";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

interface CountRow { total: number }

// GET /api/realtime — SSE stream: sends notification count every 30s
export async function GET(req: NextRequest) {
  // Authenticate via cookie or Authorization header
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("auth_token")?.value;
  const headerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const rawToken = cookieToken || headerToken;

  if (!rawToken) {
    return new Response("Unauthorized", { status: 401 });
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
    if (!user) return new Response("Unauthorized", { status: 401 });
    schoolId = user.school_id;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected
        }
      };

      // Send initial count immediately
      const sendCount = async () => {
        try {
          const row = await queryOne<CountRow>(
            `SELECT COUNT(*) AS total FROM announcements
             WHERE school_id = ?
               AND (expires_at IS NULL OR expires_at > datetime('now'))
               AND created_at > datetime('now', '-7 days')`,
            [schoolId ?? ""]
          );
          send({ type: "count", unread: row?.total ?? 0, ts: Date.now() });
        } catch {
          send({ type: "count", unread: 0, ts: Date.now() });
        }
      };

      await sendCount();

      // Poll every 30 seconds
      const interval = setInterval(sendCount, 30_000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
