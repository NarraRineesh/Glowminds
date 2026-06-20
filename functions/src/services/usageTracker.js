// Tool usage tracker.
//
// Counts how many times each user invokes each tool. Per-user counts live
// on `userEntitlements/{uid}.usage` as a flat map of `{ <toolKey>: <int> }`.
//
// All writes use FieldValue.increment so concurrent requests can't lose
// counts. Fire-and-forget: callers should never block their response on
// this — see `trackAsync` below and the routes that use it.

import { getFirestore, admin } from "../config/firebase.js";
import { userEntitlementsRef } from "./userCollections.js";

// Allowlist of tool keys we'll accept from the client-facing track endpoint.
// Backend-internal tracking (ai.* / jobs.*) bypasses this guard because the
// keys come from a known TASKS registry or hard-coded route handlers.
export const ALLOWED_CLIENT_TOOLS = new Set([
  "resume.export",
  "linkedinAudit.complete",
  "savedJobs.toggle",
]);

/**
 * Increment a single usage counter on the user's usage document.
 *
 * @param {string|null} uid    Firebase uid of the caller. Skipped if empty.
 * @param {string} toolKey     Dot-separated key, e.g. "ai.cover-letter".
 * @param {number} count       How much to add (default 1).
 */
export async function recordUsage(uid, toolKey, count = 1) {
  if (!uid) return;
  if (!toolKey || typeof toolKey !== "string") return;
  if (!Number.isFinite(count) || count <= 0) return;

  const inc = admin.firestore.FieldValue.increment(count);

  try {
    await userEntitlementsRef(uid).set(
      {
        userId: uid,
        usage: { [toolKey]: inc },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
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
