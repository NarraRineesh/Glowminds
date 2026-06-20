/** Razorpay billing + Pro entitlement helpers (backend source of truth). */

export const PLANS = {
  monthly: { amount: 9900, label: "Glowminds Pro Monthly", durationDays: 30 },
  yearly: { amount: 59900, label: "Glowminds Pro Yearly", durationDays: 365 },
};

export const PRO_TIER = "pro";

const PAID_PLANS = new Set(["yearly", "monthly"]);

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
  if (!sub || sub.status !== "active") return false;

  if (sub.tier === PRO_TIER) {
    const end = parseEndDate(sub.endDate);
    if (!end) return false;
    return end >= new Date();
  }

  if (!PAID_PLANS.has(sub.plan)) return false;

  const end = parseEndDate(sub.endDate);
  if (!end) return false;
  return end >= new Date();
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
