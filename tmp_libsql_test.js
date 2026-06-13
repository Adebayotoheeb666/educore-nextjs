const { createClient } = require('@libsql/client');
console.log('after require');
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
console.log('url', url?.slice(0,20));
console.log('token', authToken ? authToken.slice(0,20) : authToken);
const fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  return global.fetch(input, { signal: controller.signal, ...(init ?? {}) }).finally(() => clearTimeout(timer));
};
const db = createClient({ url, authToken, fetch });
console.log('client created');
(async () => {
  try {
    const res1 = await db.execute({ sql: 'SELECT 1 as ok', args: [] });
    console.log('res1', res1.rows);
  } catch (err) {
    console.error('exec err', err);
  }
})();
