import { scheduleExpirationWorker } from "./expiration.js";
import { scheduleRetryWorker } from "./retry.js";
import { scheduleHealthWorker } from "./health.js";

export function registerWorkers(cron) {
  console.log("[workers] scheduling expiration (02:00 daily)");
  scheduleExpirationWorker(cron);
  console.log("[workers] scheduling retry queue (every 15min)");
  scheduleRetryWorker(cron);
  console.log("[workers] scheduling health check (every 1h)");
  scheduleHealthWorker(cron);
}
