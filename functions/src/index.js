// Single HTTPS Cloud Function that hosts the entire Glowminds REST API.
//
// All `/api/**` traffic from Firebase Hosting is rewritten to this function
// (see firebase.json). Wrapping the existing Express app lets us reuse every
// route, middleware, and service file from the old VPS backend with zero
// changes — only the entry point differs.

import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";

import { createApp } from "./app.js";

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
