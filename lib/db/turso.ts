import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

function makeTimeoutFetch(timeoutMs = 30_000) {
  return async (input: RequestInfo, init?: RequestInit) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(input as any, { signal: controller.signal, ...(init ?? {}) });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };
}

export function getDb(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is not set");
  }

  // Try to create a client with a wrapped fetch that increases the connect timeout.
  // If the client library doesn't accept the `fetch` option, fall back to default.
  try {
    _client = createClient({ url, authToken, fetch: makeTimeoutFetch(30_000) } as any);
  } catch (err) {
    // Fallback: create without custom fetch
    try {
      _client = createClient({ url, authToken });
    } catch (err2) {
      // Surface a clear error for debugging
      console.error("Failed to create Turso client:", err2);
      throw err2;
    }
  }

  return _client;
}

// Convenience query helpers
export async function query<T = Record<string, unknown>>(
  sql: string,
  args: (string | number | boolean | null)[] = []
): Promise<T[]> {
  const db = getDb();
  const result = await db.execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  args: (string | number | boolean | null)[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  args: (string | number | boolean | null)[] = []
): Promise<{ rowsAffected: number; lastInsertRowid?: bigint }> {
  const db = getDb();
  const result = await db.execute({ sql, args });
  return {
    rowsAffected: result.rowsAffected,
    lastInsertRowid: result.lastInsertRowid,
  };
}

// Run multiple statements in a transaction
export async function transaction(
  statements: { sql: string; args?: (string | number | boolean | null)[] }[]
): Promise<void> {
  const db = getDb();
  await db.batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    "write"
  );
}
