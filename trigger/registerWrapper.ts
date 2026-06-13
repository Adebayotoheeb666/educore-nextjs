import "dotenv/config";
import "./index";
import { schedules } from "@trigger.dev/sdk/v3";

(async () => {
  console.log("[trigger/registerWrapper] imported trigger definitions; waiting 20s to allow registration...");

  // Wait 20 seconds for SDK to register tasks with Trigger.dev
  await new Promise((r) => setTimeout(r, 20000));

  try {
    const res = await schedules.list({ perPage: 100 });
    console.log("[trigger/registerWrapper] schedules:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("[trigger/registerWrapper] error listing schedules:", err);
  }

  console.log("[trigger/registerWrapper] done; exiting.");
})();
