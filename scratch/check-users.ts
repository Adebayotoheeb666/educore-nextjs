import * as dotenvFlow from "dotenv";
import { resolve } from "path";
dotenvFlow.config({ path: resolve(process.cwd(), ".env") });

import { query } from "../lib/db/turso";

async function run() {
  try {
    const tables = await query<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'");
    console.log("Tables in Turso database:");
    for (const table of tables) {
      if (table.name.startsWith("sqlite_")) continue;
      const countRes = await query<{ count: number }>(`SELECT COUNT(*) as count FROM ${table.name}`);
      console.log(`  - ${table.name}: ${countRes[0]?.count ?? 0} rows`);
    }
  } catch (error) {
    console.error("Error checking database:", error);
  }
}

run();
