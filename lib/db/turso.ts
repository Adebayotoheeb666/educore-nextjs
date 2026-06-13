import { createClient, type Client } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

let _client: Client | null = null;
let _initialized: Promise<void> | null = null;

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

export function getDb(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is not set");
  }

  // Create the Turso client with the default fetch implementation first.
  // The custom timeout fetch is only a fallback when the library cannot create
  // a client without the extra fetch option.
  try {
    _client = createClient({ url, authToken });
  } catch (err) {
    try {
      _client = createClient({ url, authToken, fetch: makeTimeoutFetch(30_000) } as any);
    } catch (err2) {
      console.error("Failed to create Turso client:", err2);
      throw err2;
    }
  }

  return _client;
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

async function recoverUsersOldState(db: Client, schemaSql: string): Promise<boolean> {
  const usersOldExists = await tableExists(db, "users_old");
  if (!usersOldExists) return false;

  const usersExists = await tableExists(db, "users");
  if (usersExists) {
    await db.execute({ sql: "DROP TABLE IF EXISTS users_old", args: [] });
    return false;
  }

  const usersCreateMatch = schemaSql.match(/CREATE TABLE IF NOT EXISTS users\s*\([\s\S]*?\);/i);
  if (!usersCreateMatch) {
    throw new Error("Unable to extract users table creation SQL from schema.sql");
  }

  await db.execute({ sql: usersCreateMatch[0], args: [] });
  await db.execute({
    sql: `INSERT INTO users (id, name, email, password, role, school_id, is_active, phone, first_name, last_name, avatar, admission_no, class_id, dob, gender, parent_phone, address, state_of_origin, created_at, updated_at)
          SELECT id, name, email, password, role, school_id, is_active, phone, first_name, last_name, avatar, admission_no, class_id, dob, gender, parent_phone, address, state_of_origin, created_at, updated_at
          FROM users_old`,
    args: [],
  });
  await db.execute({ sql: "DROP TABLE IF EXISTS users_old", args: [] });
  return true;
}

async function ensureSchema(): Promise<void> {
  if (_initialized) return _initialized;

  _initialized = (async () => {
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
        await db.execute({ sql: sql + ";", args: [] });
      } catch (err) {
        const message = (err as Error).message;
        if (message.includes("already exists") || message.includes("duplicate")) {
          continue;
        }
        throw err;
      }
    }

    await ensureMigrationTable(db);
    const recoveredUsersMigration = await recoverUsersOldState(db, schemaSql);
    const migrationsDir = join(process.cwd(), "migrations");
    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql") && file.match(/^\d+_/))
      .sort();

    for (const file of migrationFiles) {
      if (recoveredUsersMigration && file === "0010_add_librarian_role.sql") {
        await markMigrationApplied(db, file);
        continue;
      }

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
          await db.execute({ sql: sql + ";", args: [] });
        } catch (err) {
          const message = (err as Error).message;
          if (message.includes("already exists") || message.includes("duplicate") || message.includes("no such table")) {
            continue;
          }
          throw err;
        }
      }

      await markMigrationApplied(db, file);
    }

    const blogPostColumns = await db.execute({
      sql: "SELECT name FROM pragma_table_info('blog_posts')",
      args: []
    });

    const existingColumns = (blogPostColumns.rows as any[] | []).map((row) => row.name);

    if (!existingColumns.includes("category")) {
      await db.execute({ sql: "ALTER TABLE blog_posts ADD COLUMN category TEXT", args: [] });
    }
    if (!existingColumns.includes("read_time")) {
      await db.execute({ sql: "ALTER TABLE blog_posts ADD COLUMN read_time TEXT", args: [] });
    }
    const relationshipColumns = await db.execute({ sql: "PRAGMA table_info('user_relationships')", args: [] });
    const userRelationshipCols = (relationshipColumns.rows as any[] | []).map((row) => row.name);
    if (!userRelationshipCols.includes("relationship")) {
      await db.execute({ sql: "ALTER TABLE user_relationships ADD COLUMN relationship TEXT", args: [] });
    }
  })();

  return _initialized;
}

// Convenience query helpers
export async function query<T = Record<string, unknown>>(
  sql: string,
  args: (string | number | boolean | null)[] = []
): Promise<T[]> {
  await ensureSchema();
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
  await ensureSchema();
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
  await ensureSchema();
  const db = getDb();
  await db.batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    "write"
  );
}
