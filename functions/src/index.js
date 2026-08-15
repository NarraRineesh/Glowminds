// Single HTTPS Cloud Function that hosts the entire Glowminds REST API.
//
// All `/api/**` traffic from Firebase Hosting is rewritten to this function
// (see firebase.json). Wrapping the existing Express app lets us reuse every
// route, middleware, and service file from the old VPS backend with zero
// changes — only the entry point differs.

import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";

import { createApp } from "./app.js";
import { expireSubscriptions } from "./jobs/expireSubscriptions.js";
import { sendJobAlertDigests } from "./jobs/sendJobAlertDigests.js";

// Region pinned to asia-south1 (Mumbai) to match the previous Cloud Run
// deployment and minimise latency for the India-only user base.
setGlobalOptions({ region: "asia-south1", maxInstances: 10 });

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const OPENROUTER_API_KEY = defineSecret("OPENROUTER_API_KEY");
const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");

// Express app is instantiated once per cold start and reused across warm
// invocations (Gen 2 supports concurrency, so the same instance handles
// multiple in-flight requests).
const app = createApp();

export const api = onRequest(
  {
    region: "asia-south1",
    memory: "512MiB",
    timeoutSeconds: 540,
    maxInstances: 10,
    minInstances: 0,
    concurrency: 40,
    invoker: "public",
    cors: false, // Hosting rewrite means same-origin in production; Express CORS handles dev.
    secrets: [
      GEMINI_API_KEY,
      OPENROUTER_API_KEY,
      RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET,
      RAZORPAY_WEBHOOK_SECRET,
    ],
  },
  app,
);

/**
 * Missing /assets/* must NOT fall through to the SPA index.html rewrite.
 * That previously returned HTML as "JS" with an immutable cache header and
 * broke tabs left open across deploys.
 */
export const assetNotFound = onRequest(
  {
    region: "asia-south1",
    memory: "128MiB",
    timeoutSeconds: 10,
    maxInstances: 10,
    concurrency: 80,
    invoker: "public",
    cors: false,
  },
  (_req, res) => {
    res.set("Cache-Control", "no-store, max-age=0");
    res.status(404).type("text/plain").send("Not found");
  },
);

/** Daily: mark Pro subscriptions past endDate as expired. */
export const expireProSubscriptions = onSchedule(
  {
    schedule: "every day 01:30",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 120,
  },
  async () => {
    const result = await expireSubscriptions();
    console.log("[expireProSubscriptions]", result);
  },
);

/** Daily job-alert digests for opted-in users (in-app notifications). */
export const dailyJobAlertDigests = onSchedule(
  {
    schedule: "every day 08:00",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async () => {
    const result = await sendJobAlertDigests();
    console.log("[dailyJobAlertDigests]", result);
  },
);
