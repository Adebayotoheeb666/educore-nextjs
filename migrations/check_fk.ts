import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { getDb } from "../lib/db/turso";

async function main() {
  const db = getDb();
  try {
    console.log('PRAGMA foreign_key_list("user_relationships")');
    const fk = await db.execute({ sql: "PRAGMA foreign_key_list('user_relationships')", args: [] });
    console.log(JSON.stringify(fk.rows, null, 2));

    console.log('\nPRAGMA table_info("user_relationships")');
    const info = await db.execute({ sql: "PRAGMA table_info('user_relationships')", args: [] });
    console.log(JSON.stringify(info.rows, null, 2));

    console.log('\nsqlite_master entry for user_relationships');
    const sm = await db.execute({ sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name='user_relationships'", args: [] });
    console.log(JSON.stringify(sm.rows, null, 2));
  } catch (err) {
    console.error('Error checking foreign keys:', err);
    process.exit(1);
  }
}

main();
