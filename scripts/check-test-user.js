const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function checkTestUser() {
  const client = createClient({ url, authToken });
  
  try {
    const result = await client.execute({
      sql: "SELECT id, name, email, role, is_active FROM users WHERE email = 'testname@gmail.com' LIMIT 1",
      args: []
    });
    
    if (result.rows && result.rows.length > 0) {
      console.log("✓ Test user found:");
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log("✗ Test user not found");
    }
    
    // Also check total users count
    const countResult = await client.execute({
      sql: "SELECT COUNT(*) as total FROM users",
      args: []
    });
    console.log("\nTotal users in database:", countResult.rows[0].total);
    
  } catch (error) {
    console.error("Error checking test user:", error);
    process.exit(1);
  }
}

checkTestUser();
