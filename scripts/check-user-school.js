const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function check() {
  const client = createClient({ url, authToken });
  
  try {
    // Check the test user
    const userResult = await client.execute({
      sql: "SELECT id, name, email, school_id FROM users WHERE email = 'testname@gmail.com'",
      args: []
    });
    
    console.log("Test user:", userResult.rows[0]);
    
    if (userResult.rows[0]?.school_id) {
      // Check if school exists
      const schoolResult = await client.execute({
        sql: "SELECT id, name FROM schools WHERE id = ?",
        args: [userResult.rows[0].school_id]
      });
      console.log("School exists:", schoolResult.rows[0] ? "YES" : "NO");
      if (!schoolResult.rows[0]) {
        console.log("School ID:", userResult.rows[0].school_id);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

check();
