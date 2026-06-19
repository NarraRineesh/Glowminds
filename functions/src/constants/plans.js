/** Razorpay billing + Pro entitlement helpers (backend source of truth). */

export const PLANS = {
  monthly: { amount: 9900, label: "Glowminds Pro Monthly", durationDays: 30 },
  yearly: { amount: 59900, label: "Glowminds Pro Yearly", durationDays: 365 },
};

export const PRO_TIER = "pro";

const PAID_PLANS = new Set(["yearly", "monthly"]);

function parseEndDate(endDate) {
  if (!endDate) return null;
  if (typeof endDate?.toDate === "function") return endDate.toDate();
  const parsed = new Date(endDate);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/**
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

/**
 * @param {Record<string, unknown> | null | undefined} sub
 * @param {boolean} [isAdmin]
 */
export function hasProAccess(sub, isAdmin = false) {
  if (isAdmin) return true;
  return isActiveProSubscription(sub);
}
