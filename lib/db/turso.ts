import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

export function getDb(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is not set");
  }

  _client = createClient({ url, authToken });
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
