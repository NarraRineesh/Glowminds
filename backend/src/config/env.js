function asArray(value, fallback = []) {
  if (!value) return fallback;
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function asBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function asInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: asInt(process.env.PORT, 3001),
  corsOrigins: asArray(process.env.CORS_ORIGINS, [
    "http://localhost:5173",
    "http://localhost:4173",
  ]),

  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",

  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterSiteUrl:
    process.env.OPENROUTER_SITE_URL || "https://ai-jobcopilot.web.app",
  openrouterAppName:
    process.env.OPENROUTER_APP_NAME || "Glowminds AI Job Copilot",

  // Primary AI provider — Google Generative Language API (Gemini).
  // OpenRouter (above) is the fallback / used for cover-letter creativity.
  geminiApiKey: process.env.GEMINI_API_KEY || "",

  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",

  enrichUrl: process.env.ENRICH_URL || "http://127.0.0.1:5000",
  syncConcurrency: asInt(process.env.SYNC_CONCURRENCY, 5),
  syncDryRun: asBool(process.env.SYNC_DRY_RUN, false),
};

export function requireEnv(key) {
  const value = env[key];
  if (!value || (typeof value === "string" && !value.trim())) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}
