/** Razorpay billing + Pro entitlement helpers (backend source of truth). */

export const PLANS = {
  monthly: { amount: 9900, label: "Glowminds Pro Monthly", durationDays: 30 },
  yearly: { amount: 59900, label: "Glowminds Pro Yearly", durationDays: 365 },
};

export const PRO_TIER = "pro";

/** Legacy keys still treated as paid when tier is missing. */
const LEGACY_PAID_PLAN_KEYS = new Set(["yearly", "monthly", "lifetime"]);

const TRUSTED_PRO_SOURCES = new Set(["verify", "webhook", "admin_grant"]);

function parseEndDate(endDate) {
  if (!endDate) return null;
  if (typeof endDate?.toDate === "function") return endDate.toDate();
  const parsed = new Date(endDate);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/**
 * Active Pro by dates/plan only — does not verify payment proof.
 * @param {Record<string, unknown> | null | undefined} sub
 * @returns {boolean}
 */
export function isActiveProSubscription(sub) {
  // "cancelled" with a future endDate still has access until the period ends.
  if (!sub || (sub.status !== "active" && sub.status !== "cancelled")) return false;

  const end = parseEndDate(sub.endDate);
  if (!end || end < new Date()) return false;

  if (sub.tier === PRO_TIER) return true;

  // Hashed plan ids or legacy keys with a future endDate.
  if (sub.plan && sub.plan !== "free") {
    if (LEGACY_PAID_PLAN_KEYS.has(sub.plan) || LEGACY_PAID_PLAN_KEYS.has(sub.planKey)) return true;
    // Opaque hashed plan id (16 hex) from admin pricing.
    if (typeof sub.plan === "string" && /^[0-9a-f]{16}$/.test(sub.plan)) return true;
  }

  return false;
}

/** Pro subscription backed by Razorpay payment or a trusted server source. */
export function isTrustedProSubscription(sub) {
  if (!isActiveProSubscription(sub)) return false;
  if (sub.razorpayPaymentId) return true;
  return TRUSTED_PRO_SOURCES.has(sub.source);
}

export function hasProAccess(sub) {
  return isTrustedProSubscription(sub);
}
