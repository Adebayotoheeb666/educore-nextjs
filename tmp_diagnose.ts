import 'dotenv/config';
import { getDb } from './lib/db/turso';

(async () => {
  const db = getDb();
  
  // Find tables referencing any _old_temp table
  const brokenTemp = await db.execute({
    sql: `SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%_old_temp%'`,
    args: [],
  });
  console.log('Broken temp tables:', JSON.stringify(brokenTemp.rows, null, 2));

  // Find tables referencing users_old
  const brokenUsersOld = await db.execute({
    sql: `SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%users_old%'`,
    args: [],
  });
  console.log('Broken users_old tables:', JSON.stringify(brokenUsersOld.rows, null, 2));

})().catch((e) => { console.error(e); process.exit(1); });
