// Tool usage tracker.
//
// Counts how many times each user invokes each tool. Per-user counts live
// on `users/{uid}.usage` as a flat map of `{ <toolKey>: <int> }`. There's
// no separate metrics doc — the admin endpoint aggregates across all users
// on demand (cached briefly) so per-user is the single source of truth.
//
// All writes use FieldValue.increment so concurrent requests can't lose
// counts. Fire-and-forget: callers should never block their response on
// this — see `trackAsync` below and the routes that use it.

import { getFirestore, admin } from "../config/firebase.js";

// Allowlist of tool keys we'll accept from the client-facing track endpoint.
// Backend-internal tracking (ai.* / jobs.*) bypasses this guard because the
// keys come from a known TASKS registry or hard-coded route handlers.
export const ALLOWED_CLIENT_TOOLS = new Set([
  "resume.export",
  "linkedinAudit.complete",
  "savedJobs.toggle",
]);

/**
 * Increment a single usage counter on the user's document.
 *
 * @param {string|null} uid    Firebase uid of the caller. Skipped if empty.
 * @param {string} toolKey     Dot-separated key, e.g. "ai.cover-letter".
 * @param {number} count       How much to add (default 1).
 */
export async function recordUsage(uid, toolKey, count = 1) {
  if (!uid) return;
  if (!toolKey || typeof toolKey !== "string") return;
  if (!Number.isFinite(count) || count <= 0) return;

  const db = getFirestore();
  const inc = admin.firestore.FieldValue.increment(count);

  try {
    await db
      .collection("users")
      .doc(uid)
      .set({ usage: { [toolKey]: inc } }, { merge: true });
  } catch (err) {
    // Never let metrics failures bubble up to user-facing errors.
    console.warn(`[usage] failed toolKey=${toolKey} uid=${uid}:`, err.message);
  }
}

/**
 * Convenience: tracks an event without blocking the caller. Useful inside
 * route handlers where we want the user's response to ship immediately.
 */
export function trackAsync(uid, toolKey, count = 1) {
  // Intentional fire-and-forget; recordUsage already swallows errors.
  void recordUsage(uid, toolKey, count);
}

// -----------------------------------------------------------------------
// Admin aggregation
// -----------------------------------------------------------------------
//
// `aggregateAllUsers` walks every `users/{uid}` doc, picks out the `usage`
// map, and sums each tool counter across the entire user base. Cached for
// AGGREGATE_TTL_MS so an admin dashboard polling once a second only hits
// Firestore on the first request and then once per minute.

const AGGREGATE_TTL_MS = 60_000;
let aggregateCache = null; // { at: <epoch>, value: <result> }

function invalidateAggregateCache() {
  aggregateCache = null;
}

/**
 * Aggregate tool usage across every user.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.fresh=false]  Skip the cache and re-scan now.
 * @returns {Promise<{
 *   tools: Record<string, number>,
 *   total: number,
 *   userCount: number,
 *   computedAt: string,        // ISO timestamp
 *   cached: boolean,
 * }>}
 */
export async function aggregateAllUsers({ fresh = false } = {}) {
  if (!fresh && aggregateCache) {
    const age = Date.now() - aggregateCache.at;
    if (age < AGGREGATE_TTL_MS) {
      return { ...aggregateCache.value, cached: true };
    }
  }

  const db = getFirestore();
  const snap = await db.collection("users").select("usage").get();

  const tools = {};
  let userCount = 0;

  snap.forEach((doc) => {
    userCount += 1;
    const usage = doc.get("usage");
    if (!usage || typeof usage !== "object") return;
    for (const [key, val] of Object.entries(usage)) {
      // Skip legacy meta fields (`_total`, `_lastAt`) from earlier tracker
      // versions — they're timestamps/aggregates, not tool counters.
      if (key.startsWith("_")) continue;
      const n = Number(val);
      if (!Number.isFinite(n) || n <= 0) continue;
      tools[key] = (tools[key] || 0) + n;
    }
  });

  const total = Object.values(tools).reduce((s, n) => s + n, 0);
  const value = {
    tools,
    total,
    userCount,
    computedAt: new Date().toISOString(),
  };

  aggregateCache = { at: Date.now(), value };
  return { ...value, cached: false };
}
