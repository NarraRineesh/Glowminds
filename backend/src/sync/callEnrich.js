import { env } from "../config/env.js";

const ENRICH_TIMEOUT_MS = 10_000;
const ENRICH_HEALTH_TIMEOUT_MS = 1_500;

// Cheap liveness check against the Python enrich service. Used by admin
// sync routes (full + per-company) so an admin sees a clear 412 instead
// of a successful-looking sync that silently writes empty enrichment.
export async function enrichIsReachable() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENRICH_HEALTH_TIMEOUT_MS);
  try {
    const r = await fetch(`${env.enrichUrl}/health`, { signal: controller.signal });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Spammy-warn de-duplication: when Python is down every single job logs
// the same connect-refused error. Throttle to one loud line per ~30s so
// stdout stays readable but the failure is still impossible to miss.
let lastFailureLogAt = 0;
const FAILURE_LOG_INTERVAL_MS = 30_000;

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function partial() {
  return {
    skills: [],
    experience: "",
    seniority: "mid",
    role: "engineering",
    remote: false,
    employmentType: "full-time",
    elapsedMs: 0,
    partial: true,
  };
}

export async function callEnrich({ rawHtml, plainText, descriptionHtml }) {
  const fallbackPlain =
    plainText || stripHtml(descriptionHtml || rawHtml || "");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENRICH_TIMEOUT_MS);

  try {
    const res = await fetch(`${env.enrichUrl}/enrich`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawHtml: rawHtml || descriptionHtml || "",
        plainText: fallbackPlain,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`enrich ${res.status}`);
    }
    const json = await res.json();
    return { ...json, partial: false };
  } catch (err) {
    const now = Date.now();
    if (now - lastFailureLogAt > FAILURE_LOG_INTERVAL_MS) {
      lastFailureLogAt = now;
      console.error(
        `[enrich] UNREACHABLE at ${env.enrichUrl} (${err.message || err}). ` +
          `Jobs will be saved with empty skills/role/seniority. ` +
          `Start the Python service: \`npm run dev:py\` or PM2 \`enrich\`.`,
      );
    }
    return partial();
  } finally {
    clearTimeout(timer);
  }
}
