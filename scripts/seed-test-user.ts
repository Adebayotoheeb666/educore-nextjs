import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import { randomBytes } from "crypto";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function seedTestUser() {
  const client = createClient({ url: url!, authToken });
  
  try {
    const hashedPassword = await bcrypt.hash("Demo@1234", 10);
    const userId = "user_" + randomBytes(12).toString("hex");
    
    // First, ensure a school exists for the test user
    const schoolId = "school_test_" + randomBytes(8).toString("hex");
    
    await client.execute({
      sql: `INSERT OR IGNORE INTO schools 
            (id, name, email, phone, state, type, owner_id, sub_domain, address, logo, 
             subscription_status, subscription_plan, ai_token_budget, used_ai_tokens, 
             subscription_expires_at, subscription_last_paid_at, billing_cycle, 
             academic_session, current_term, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        schoolId,
        "Test School",
        "testschool@example.com",
        "1234567890",
        "Lagos",
        "private",
        userId,
        "testschool",
        "Test Address",
        null,
        "active",
        "premium",
        500000,
        0,
        null,
        null,
        "monthly",
        "2024/2025",
        "first"
      ]
    });
    
    // Now insert the test user
    await client.execute({
      sql: `INSERT OR REPLACE INTO users 
            (id, name, first_name, last_name, email, password, role, school_id, 
             is_active, phone, avatar, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        userId,
        "Test Admin",
        "Test",
        "Admin",
        "testname@gmail.com",
        hashedPassword,
        "principal",
        schoolId,
        1,
        "1234567890",
        null
      ]
    });
    
    console.log("✓ Test user created successfully");
    console.log("  Email: testname@gmail.com");
    console.log("  Password: Demo@1234");
    console.log("  Role: principal");
    
  } catch (error) {
    console.error("Error seeding test user:", error);
    process.exit(1);
  }
}

seedTestUser();
