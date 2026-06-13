import "dotenv/config";
import { configure, schedules } from "@trigger.dev/sdk/v3";

if (!process.env.TRIGGER_SECRET_KEY) {
  console.error("TRIGGER_SECRET_KEY is not set");
  process.exit(1);
}

configure({
  accessToken: process.env.TRIGGER_SECRET_KEY,
  baseURL: process.env.TRIGGER_API_URL ?? "https://api.trigger.dev",
});

(async () => {
  try {
    console.log("Fetching schedules from Trigger.dev...");
    const res = await schedules.list({ perPage: 100 });
    console.log(JSON.stringify(res, null, 2));
  } catch (err: unknown) {
    console.error("Error fetching schedules:", err instanceof Error ? err.message : String(err));
    process.exit(2);
  }
})();
