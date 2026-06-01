/** Display + gating constants for Free vs Pro (frontend mirror of backend plans). */

export const PLANS = {
  yearly: {
    id: 'yearly',
    label: 'Glowminds Pro Yearly',
    displayPrice: '₹399',
    period: '/year',
    amountPaise: 39900,
    durationDays: 365,
  },
  monthly: {
    id: 'monthly',
    label: 'Glowminds Pro Monthly',
    displayPrice: '₹49',
    period: '/month',
    amountPaise: 4900,
    durationDays: 30,
  },
}

export const FREE_LIMITS = {
  applications: 5,
  resumes: 3,
  template: 'onyx',
}

export const PRO_TIER = 'pro'

const PAID_PLANS = new Set(['yearly', 'monthly'])

function parseEndDate(endDate) {
  if (!endDate) return null
  if (typeof endDate?.toDate === 'function') return endDate.toDate()
  const parsed = new Date(endDate)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

/**
 * @param {import('@/constants/schema').Subscription | null | undefined} sub
 * @returns {boolean}
 */
export function isActiveProSubscription(sub) {
  if (!sub || sub.status !== 'active') return false

  if (sub.tier === PRO_TIER) {
    const end = parseEndDate(sub.endDate)
    if (!end) return false
    return end >= new Date()
  }

  if (!PAID_PLANS.has(sub.plan)) return false

  const end = parseEndDate(sub.endDate)
  if (!end) return false
  return end >= new Date()
}

export function formatSubscriptionEndDate(sub) {
  const end = parseEndDate(sub?.endDate)
  if (!end) return null
  return end.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * @param {{ subscription?: import('@/constants/schema').Subscription | null, isAdmin?: boolean }} opts
 */
export function hasProAccess({ subscription, isAdmin = false } = {}) {
  if (isAdmin) return true
  return isActiveProSubscription(subscription)
}
