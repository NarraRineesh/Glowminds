// Runtime config for the API function.
//
// Non-secret values are sourced from functions/.env (deployed alongside the
// function by the Firebase CLI). Secrets (Gemini, OpenRouter, Razorpay keys)
// are injected via `defineSecret` in src/index.js and surfaced through
// `process.env` only while the request is being served.

function asArray(value, fallback = []) {
  if (!value) return fallback;
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  if (env.corsOrigins.includes(origin)) return true;

  const projectId = env.firebaseProjectId;
  if (!projectId) return false;

  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (hostname === `${projectId}.web.app`) return true;
    if (hostname === `${projectId}.firebaseapp.com`) return true;
  } catch {
    return false;
  }
  return false;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "production",
  corsOrigins: asArray(process.env.CORS_ORIGINS, [
    "https://glowminds-abc84.web.app",
    "https://glowminds-abc84.firebaseapp.com",
    "https://glowminds.in",
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5000",
  ]),

  // Firebase Admin uses the runtime service account automatically — no env
  // var or JSON file is required inside Functions.
  firebaseProjectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "",

  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterSiteUrl:
    process.env.OPENROUTER_SITE_URL || "https://glowminds-abc84.web.app",
  openrouterAppName:
    process.env.OPENROUTER_APP_NAME || "Glowminds AI Job Copilot",

  geminiApiKey: process.env.GEMINI_API_KEY || "",

  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
};

export function requireEnv(key) {
  const value = env[key];
  if (!value || (typeof value === "string" && !value.trim())) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

export { isAllowedCorsOrigin };
