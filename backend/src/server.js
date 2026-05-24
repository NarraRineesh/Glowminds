import { env } from "./config/env.js";
import { getFirebaseApp } from "./config/firebase.js";
import { createApp } from "./app.js";

getFirebaseApp();

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(
    `[api] listening on http://localhost:${env.port} (env=${env.nodeEnv})`,
  );
});

function shutdown(signal) {
  console.log(`[api] received ${signal}, closing http server...`);
  server.close((err) => {
    if (err) {
      console.error("[api] server close error:", err);
      process.exit(1);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("[api] unhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[api] uncaughtException:", err);
  process.exit(1);
});
