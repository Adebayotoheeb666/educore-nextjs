import * as dotenvFlow from "dotenv";
import { resolve } from "path";
dotenvFlow.config({ path: resolve(process.cwd(), ".env") });

import { query } from "../lib/db/turso";

async function run() {
  try {
    const schools = await query("SELECT id, name, email, phone, owner_id, sub_domain FROM schools");
    console.log("Schools in Turso database:");
    console.log(JSON.stringify(schools, null, 2));
  } catch (error) {
    console.error("Error checking schools:", error);
  }
}

run();
