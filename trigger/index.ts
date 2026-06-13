import "dotenv/config";
import { configure } from "@trigger.dev/sdk/v3";

if (!process.env.TRIGGER_SECRET_KEY) {
  throw new Error("TRIGGER_SECRET_KEY must be set to register Trigger.dev tasks.");
}

configure({
  accessToken: process.env.TRIGGER_SECRET_KEY,
  baseURL: process.env.TRIGGER_API_URL ?? "https://api.trigger.dev",
});

import "./backupScheduler";

// Keep the process alive so tasks are continuously registered
console.log("✓ Trigger.dev tasks loaded and configured");
console.log("  Task: educore-scheduled-backup (runs on schedule)");
console.log("");
console.log("For development with auto-sync, run:");
console.log("  npx trigger-dev@latest dev");

