import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getDb } from './lib/db/turso';

function isTransactionControlStatement(sql: string): boolean {
  const normalized = sql.trim().toUpperCase();
  return normalized === "BEGIN" || normalized === "BEGIN TRANSACTION" || normalized === "COMMIT" || normalized === "ROLLBACK";
}

(async () => {
  const db = getDb();
  
  const schemaPath = join(process.cwd(), "lib/db/schema.sql");
  const schemaSql = readFileSync(schemaPath, "utf-8");

  // Parse schemaSql into statements
  const cleanSql = schemaSql
    .split("\n")
    .map((line) => (line.trim().startsWith("--") ? "" : line))
    .join("\n");

  const statements = cleanSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !isTransactionControlStatement(s));

  // Extract CREATE TABLE statements
  const tableStatements: { name: string; sql: string }[] = [];
  for (const stmt of statements) {
    const match = stmt.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
    if (match) {
      tableStatements.push({
        name: match[1],
        sql: stmt + ";"
      });
    }
  }

  console.log(`Found ${tableStatements.length} tables in schema.sql.`);

  console.log("Creating dummy tables to satisfy SQLite schema checks...");
  // Create dummy tables so that SQLite doesn't complain about missing references during drops/creates
  await db.execute({ sql: 'CREATE TABLE IF NOT EXISTS "classes_old_temp" (id TEXT PRIMARY KEY);', args: [] });
  await db.execute({ sql: 'CREATE TABLE IF NOT EXISTS "subjects_old_temp" (id TEXT PRIMARY KEY);', args: [] });

  console.log("Setting PRAGMAs...");
  // Disable foreign keys temporarily
  await db.execute({ sql: "PRAGMA foreign_keys = OFF;", args: [] });

  for (const { name: table, sql: createSql } of tableStatements) {
    // Skip dummy tables themselves if they are in the schema
    if (["classes_old_temp", "subjects_old_temp"].includes(table)) continue;

    console.log(`Processing table: ${table}`);

    // Check if the table currently exists
    const existsCheck = await db.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      args: [table]
    });

    const tableExists = existsCheck.rows.length > 0;
    const tempName = `${table}_repair_tmp`;

    if (tableExists) {
      console.log(`Creating temp table ${tempName}...`);
      await db.execute({ sql: `DROP TABLE IF EXISTS "${tempName}"`, args: [] });
      
      const tempCreateSql = createSql.replace(new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?"?${table}"?`, 'i'), `CREATE TABLE "${tempName}"`);
      await db.execute({ sql: tempCreateSql, args: [] });

      console.log(`Copying data to ${tempName}...`);
      await db.execute({ sql: `INSERT INTO "${tempName}" SELECT * FROM "${table}"`, args: [] });

      console.log(`Dropping original table ${table}...`);
      await db.execute({ sql: `DROP TABLE "${table}"`, args: [] });
    }

    console.log(`Recreating original table ${table}...`);
    await db.execute({ sql: createSql, args: [] });

    if (tableExists) {
      console.log(`Copying data back into ${table}...`);
      await db.execute({ sql: `INSERT INTO "${table}" SELECT * FROM "${tempName}"`, args: [] });

      console.log(`Dropping temp table ${tempName}...`);
      await db.execute({ sql: `DROP TABLE "${tempName}"`, args: [] });
    }
    console.log(`Table ${table} processed.`);
  }

  console.log("Dropping dummy tables...");
  await db.execute({ sql: 'DROP TABLE IF EXISTS "classes_old_temp";', args: [] });
  await db.execute({ sql: 'DROP TABLE IF EXISTS "subjects_old_temp";', args: [] });

  // Restore PRAGMAs
  await db.execute({ sql: "PRAGMA foreign_keys = ON;", args: [] });

  console.log("Database tables rebuild/repair completed successfully!");

})().catch((e) => {
  console.error("Rebuild failed:", e);
  process.exit(1);
});
