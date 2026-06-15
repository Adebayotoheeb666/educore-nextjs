import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { execute } from "../lib/db/turso";

async function main() {
  const stmts = [
    "PRAGMA foreign_keys=OFF;",
    `CREATE TABLE IF NOT EXISTS user_relationships_tmp (
      id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      relationship TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(parent_id, child_id)
    );`,
    `INSERT OR IGNORE INTO user_relationships_tmp (id, parent_id, child_id, relationship, created_at)
      SELECT id, parent_id, child_id, relationship, created_at FROM user_relationships;`,
    "DROP TABLE IF EXISTS user_relationships;",
    "ALTER TABLE user_relationships_tmp RENAME TO user_relationships;",
    "PRAGMA foreign_keys=ON;",
  ];

  try {
    for (const s of stmts) {
      console.log('Running:', s.split('\n')[0]);
      await execute(s, []);
    }
    console.log('user_relationships rebuilt to reference users successfully');
  } catch (err) {
    console.error('Failed to rebuild user_relationships:', err);
    process.exit(1);
  }
}

main();
