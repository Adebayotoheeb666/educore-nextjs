import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { getDb } from "../lib/db/turso";

async function main() {
  const db = getDb();
  try {
    const res = await db.execute({ sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", args: [] });
    console.log("Tables:");
    for (const row of res.rows as any[]) {
      console.log("- ", row.name);
    }
  } catch (err) {
    console.error("Failed to list tables:", err);
    process.exit(1);
  }
}

main();
