import { getDb } from './lib/db/turso';
console.log('getDb imported');
(async () => {
  try {
    const db = getDb();
    console.log('db obtained');
    const res = await db.execute({ sql: 'SELECT 1 as ok', args: [] });
    console.log('ok:', JSON.stringify(res.rows));
  } catch (err) {
    console.error('err:', err);
  }
})();
