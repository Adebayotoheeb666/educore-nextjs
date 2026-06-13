import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getDb } from "../lib/db/turso";

function isTransactionControlStatement(sql: string): boolean {
  const normalized = sql.trim().toUpperCase();
  return normalized === "BEGIN" || normalized === "BEGIN TRANSACTION" || normalized === "COMMIT" || normalized === "ROLLBACK";
}

async function tableExists(db: ReturnType<typeof getDb>, tableName: string): Promise<boolean> {
  const result = await db.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [tableName],
  });
  return ((result.rows as any[] | []).length ?? 0) > 0;
}

async function ensureMigrationTable(db: ReturnType<typeof getDb>): Promise<void> {
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    args: [],
  });
}

async function isMigrationApplied(db: ReturnType<typeof getDb>, migrationId: string): Promise<boolean> {
  const result = await db.execute({
    sql: "SELECT 1 FROM schema_migrations WHERE id = ? LIMIT 1",
    args: [migrationId],
  });
  return ((result.rows as any[] | []).length ?? 0) > 0;
}

async function markMigrationApplied(db: ReturnType<typeof getDb>, migrationId: string): Promise<void> {
  await db.execute({
    sql: "INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)",
    args: [migrationId],
  });
}

async function runMigrations() {
  const db = getDb();

  console.log("Running database migrations...");

  const migrationsDir = join(__dirname);
  const schemaPath = join(migrationsDir, "../lib/db/schema.sql");
  const schemaSql = readFileSync(schemaPath, "utf-8");

  // Remove comment lines from schema
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
      await db.execute(sql + ";");
    } catch (err) {
      console.error("Migration statement failed:", sql.slice(0, 80));
      throw err;
    }
  }

  console.log(`Applied ${statements.length} schema migration statements.`);

  await ensureMigrationTable(db);

  // Run individual migration files
  const migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") && f.match(/^\d+_/))
    .sort();

  for (const file of migrationFiles) {
    if (await isMigrationApplied(db, file)) {
      console.log(`Skipping already applied migration: ${file}`);
      continue;
    }

    const filePath = join(migrationsDir, file);
    const migrationSql = readFileSync(filePath, "utf-8");

    // Remove comment lines
    const cleanMigration = migrationSql
      .split("\n")
      .map((line) => (line.trim().startsWith("--") ? "" : line))
      .join("\n");

    const migrationStatements = cleanMigration
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !isTransactionControlStatement(s));

    console.log(`Running migration: ${file}`);
    for (const sql of migrationStatements) {
      try {
        await db.execute(sql + ";");
      } catch (err) {
        // Ignore "column already exists" errors for ALTER TABLE ADD
        if ((err as Error).message?.includes("already exists") || (err as Error).message?.includes("duplicate")) {
          console.log(`Skipping (already exists): ${sql.slice(0, 60)}...`);
          continue;
        }
        console.error("Migration statement failed:", sql.slice(0, 80));
        throw err;
      }
    }

    await markMigrationApplied(db, file);
  }

  console.log(`All migrations applied successfully.`);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
