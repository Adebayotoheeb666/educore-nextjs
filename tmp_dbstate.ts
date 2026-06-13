import 'dotenv/config';
import { getDb } from './lib/db/turso';
(async () => {
  try {
    const db = getDb();
    const tables = await db.execute({ sql: "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users_old','users','services','schema_migrations')", args: [] });
    console.log('tables', JSON.stringify(tables.rows));
    const migrations = await db.execute({ sql: 'SELECT id, applied_at FROM schema_migrations ORDER BY id', args: [] });
    console.log('schema_migrations', JSON.stringify(migrations.rows));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
