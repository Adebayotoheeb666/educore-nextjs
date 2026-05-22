import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getDb } from "../lib/db/turso";

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
    .filter((s) => s.length > 0);

  for (const sql of statements) {
    try {
      await db.execute(sql + ";");
    } catch (err) {
      console.error("Migration statement failed:", sql.slice(0, 80));
      throw err;
    }
  }

  console.log(`Applied ${statements.length} schema migration statements.`);

  // Run individual migration files
  const migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") && f.match(/^\d+_/))
    .sort();

  for (const file of migrationFiles) {
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
      .filter((s) => s.length > 0);

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
  }

  console.log(`All migrations applied successfully.`);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
