import { createClient, type Client } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const globalForDb = globalThis as unknown as {
  _client: Client | undefined;
  _initialized: Promise<void> | undefined;
};

function isTransactionControlStatement(sql: string): boolean {
  const normalized = sql.trim().toUpperCase();
  return normalized === "BEGIN" || normalized === "BEGIN TRANSACTION" || normalized === "COMMIT" || normalized === "ROLLBACK";
}

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

function normalizeSql(sql: string): string {
  if (!sql) return sql;
  // Replace legacy temp/old users table references with the canonical `users` table
  return sql.replace(/\b(main\.)?users_old\b/gi, "users");
}

export function getDb(): Client {
  if (globalForDb._client) return globalForDb._client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is not set");
  }

  // Create the Turso client with the default fetch implementation first.
  // The custom timeout fetch is only a fallback when the library cannot create
  // a client without the extra fetch option.
  try {
    globalForDb._client = createClient({ url, authToken });
  } catch (err) {
    try {
      globalForDb._client = createClient({ url, authToken, fetch: makeTimeoutFetch(30_000) } as any);
    } catch (err2) {
      console.error("Failed to create Turso client:", err2);
      throw err2;
    }
  }

  return globalForDb._client;
}

async function tableExists(db: Client, tableName: string): Promise<boolean> {
  const result = await db.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [tableName],
  });
  return ((result.rows as any[] | []).length ?? 0) > 0;
}

async function ensureMigrationTable(db: Client): Promise<void> {
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    args: [],
  });
}

async function isMigrationApplied(db: Client, migrationId: string): Promise<boolean> {
  const result = await db.execute({
    sql: "SELECT 1 FROM schema_migrations WHERE id = ? LIMIT 1",
    args: [migrationId],
  });
  return ((result.rows as any[] | []).length ?? 0) > 0;
}

async function markMigrationApplied(db: Client, migrationId: string): Promise<void> {
  await db.execute({
    sql: "INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)",
    args: [migrationId],
  });
}

async function ensureSchema(): Promise<void> {
  if (globalForDb._initialized) return globalForDb._initialized;

  globalForDb._initialized = (async () => {
    try {
      const db = getDb();
      const schemaPath = join(process.cwd(), "lib/db/schema.sql");
      const schemaSql = readFileSync(schemaPath, "utf-8");

      const cleanSql = schemaSql
        .split("\n")
        .map((line) => (line.trim().startsWith("--") ? "" : line))
        .join("\n");

      const statements = cleanSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !isTransactionControlStatement(s));

      for (const sql of statements) {
        try {
          const norm = normalizeSql(sql + ";");
          await db.execute({ sql: norm, args: [] });
        } catch (err) {
          const message = (err as Error).message || "";
          const m = message.toLowerCase();
          if (m.includes("already exists") || m.includes("duplicate") || m.includes("unique")) {
            continue;
          }
          throw err;
        }
      }

      await ensureMigrationTable(db);
      const migrationsDir = join(process.cwd(), "migrations");
      const migrationFiles = readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql") && file.match(/^\d+_/))
        .sort();

      for (const file of migrationFiles) {
        if (await isMigrationApplied(db, file)) {
          continue;
        }

        const filePath = join(migrationsDir, file);
        const migrationSql = readFileSync(filePath, "utf-8");
        const cleanMigration = migrationSql
          .split("\n")
          .map((line) => (line.trim().startsWith("--") ? "" : line))
          .join("\n");

        const migrationStatements = cleanMigration
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !isTransactionControlStatement(s) && !s.toUpperCase().startsWith("PRAGMA"));

        for (const sql of migrationStatements) {
          try {
            const norm = normalizeSql(sql + ";");
            await db.execute({ sql: norm, args: [] });
          } catch (err) {
            const message = (err as Error).message || "";
            const m = message.toLowerCase();
            if (m.includes("already exists") || m.includes("duplicate") || m.includes("no such table") || m.includes("unique")) {
              continue;
            }
            throw err;
          }
        }

        await markMigrationApplied(db, file);
      }

      const blogPostColumns = await db.execute({
        sql: normalizeSql("SELECT name FROM pragma_table_info('blog_posts')"),
        args: []
      });

      const existingColumns = (blogPostColumns.rows as any[] | []).map((row) => row.name);

      if (!existingColumns.includes("category")) {
        await db.execute({ sql: normalizeSql("ALTER TABLE blog_posts ADD COLUMN category TEXT"), args: [] });
      }
      if (!existingColumns.includes("read_time")) {
        await db.execute({ sql: normalizeSql("ALTER TABLE blog_posts ADD COLUMN read_time TEXT"), args: [] });
      }
      const relationshipColumns = await db.execute({ sql: normalizeSql("PRAGMA table_info('user_relationships')"), args: [] });
      const userRelationshipCols = (relationshipColumns.rows as any[] | []).map((row) => row.name);
      if (!userRelationshipCols.includes("relationship")) {
        await db.execute({ sql: normalizeSql("ALTER TABLE user_relationships ADD COLUMN relationship TEXT"), args: [] });
      }
    } catch (err) {
      globalForDb._initialized = undefined;
      throw err;
    }
  })();

  return globalForDb._initialized;
}

// Convenience query helpers
export async function query<T = Record<string, unknown>>(
  sql: string,
  args: (string | number | boolean | null)[] = []
): Promise<T[]> {
  await ensureSchema();
  const db = getDb();
  try {
    const norm = normalizeSql(sql);
    const result = await db.execute({ sql: norm, args });
    return result.rows as unknown as T[];
  } catch (err) {
    console.error("DB query error:", { sql, args, err });
    throw err;
  }
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
  await ensureSchema();
  const db = getDb();
  try {
    const norm = normalizeSql(sql);
    const result = await db.execute({ sql: norm, args });
    return {
      rowsAffected: result.rowsAffected,
      lastInsertRowid: result.lastInsertRowid,
    };
  } catch (err) {
    console.error("DB execute error:", { sql, args, err });
    throw err;
  }
}

// Run multiple statements in a transaction
export async function transaction(
  statements: { sql: string; args?: (string | number | boolean | null)[] }[]
): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.batch(
    statements.map((s) => ({ sql: normalizeSql(s.sql), args: s.args ?? [] })),
    "write"
  );
}
