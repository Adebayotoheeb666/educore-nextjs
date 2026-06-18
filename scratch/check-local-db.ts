import { createClient } from "@libsql/client";
import { resolve } from "path";

async function checkLocalDb() {
  const dbPath = resolve(process.cwd(), "lib/db/educore.db");
  console.log("Checking local DB at:", dbPath);
  const client = createClient({ url: `file:${dbPath}` });

  try {
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log("Tables in local DB:", tables.rows.map(r => r.name));

    const users = await client.execute("SELECT id, name, email, password, role, is_active FROM users");
    console.log(`Found ${users.rows.length} users in local DB:`);
    console.log(JSON.stringify(users.rows, null, 2));

    const matching = users.rows.filter((u: any) => u.email && u.email.toLowerCase().includes("fvs"));
    console.log("Matching fvs user in local DB:", JSON.stringify(matching, null, 2));
  } catch (error) {
    console.error("Error reading local DB:", error);
  }
}

checkLocalDb();
