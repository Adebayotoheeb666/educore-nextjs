import { readFileSync } from "fs";
import { join } from "path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getDb } from "../lib/db/turso";

async function runMigrations() {
  const db = getDb();

  console.log("Running database migrations...");

  const schemaPath = join(__dirname, "../lib/db/schema.sql");
  const schemaSql = readFileSync(schemaPath, "utf-8");

  // Remove comment lines
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

  console.log(`Applied ${statements.length} migration statements successfully.`);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
