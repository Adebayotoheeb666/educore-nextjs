import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('TURSO_DATABASE_URL not set');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  try {
    const res = await client.execute({ sql: 'SELECT 1 as ok' });
    console.log('DB response rows:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('DB connection error:', err);
    process.exit(2);
  }
}

main();
