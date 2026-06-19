import { PLANS, FREE_LIMITS } from './plans'
import { DEFAULT_LANDING_CONTENT } from '@/data/landingDefaults'

const { pricing, pricingComparison, pricingFaqs, freeFeatures, proFeatures } = DEFAULT_LANDING_CONTENT

/** Client-side fallback when /api/config/pricing is unavailable. */
export const DEFAULT_PRICING_CONFIG = {
  currency: 'INR',
  currencySymbol: '₹',
  plans: {
    yearly: { ...PLANS.yearly },
    monthly: { ...PLANS.monthly },
  },
  freeLimits: { ...FREE_LIMITS },
  pricing: {
    free: { ...pricing.free, features: [...pricing.free.features] },
    pro: { ...pricing.pro, features: [...pricing.pro.features] },
  },
  freeFeatures: freeFeatures.map((f) => ({ ...f })),
  proFeatures: proFeatures.map((f) => ({ ...f })),
  pricingComparison: pricingComparison.map((r) => ({ ...r })),
  pricingFaqs: pricingFaqs.map((f) => ({ ...f })),
  marketing: {
    proTagline: 'Only ₹50/month when billed annually — less than ₹2/day',
    monthlyEquivalent: 'Only ₹50/month when billed annually',
    dailyEquivalent: 'Less than ₹2/day',
    heroDescription:
      'AI-powered resumes, interview prep, and job matching — built for students and early-career professionals. Join as a founding member at our launch price.',
    billingBlurb:
      'Founding member offer: ₹599/year (regular ₹999). Secure checkout via Razorpay (UPI, cards, net banking).',
    termsBillingText:
      'Pro subscriptions are billed at ₹599/year (founding member offer; regular price ₹999/year) or ₹99/month. Payments are processed securely through Razorpay. You can cancel your subscription at any time from your dashboard. Cancellations take effect at the end of the current billing period.',
    proHighlights: [
      'ATS Resume Builder',
      'AI Mock Interviews',
      'AI Cover Letters',
      'Smart Job Matching',
      'Application Tracking',
    ],
    launchOfferText: 'Founding Member Offer',
    guaranteeText: '7-day money-back guarantee — try Pro risk-free.',
    socialProof: 'Trusted by students from NITs, IIITs, and state universities across India.',
  },
}

function mergePricingConfig(data) {
  const base = structuredClone(DEFAULT_PRICING_CONFIG)
  if (!data || typeof data !== 'object') return base

  return {
    ...base,
    ...data,
    plans: {
      yearly: { ...base.plans.yearly, ...(data.plans?.yearly || {}) },
      monthly: { ...base.plans.monthly, ...(data.plans?.monthly || {}) },
    },
    freeLimits: { ...base.freeLimits, ...(data.freeLimits || {}) },
    pricing: {
      free: { ...base.pricing.free, ...(data.pricing?.free || {}) },
      pro: { ...base.pricing.pro, ...(data.pricing?.pro || {}) },
    },
    marketing: { ...base.marketing, ...(data.marketing || {}) },
    freeFeatures: Array.isArray(data.freeFeatures) ? data.freeFeatures : base.freeFeatures,
    proFeatures: Array.isArray(data.proFeatures) ? data.proFeatures : base.proFeatures,
    pricingComparison: Array.isArray(data.pricingComparison)
      ? data.pricingComparison
      : base.pricingComparison,
    pricingFaqs: Array.isArray(data.pricingFaqs) ? data.pricingFaqs : base.pricingFaqs,
  }
}

export { mergePricingConfig }

export function yearlyPriceLabel(config = DEFAULT_PRICING_CONFIG) {
  const plan = config?.plans?.yearly
  if (!plan) return '₹599/year'
  return `${plan.displayPrice || '₹599'}${plan.period || '/year'}`
}

export function yearlySeoPrice(config = DEFAULT_PRICING_CONFIG) {
  const plan = config?.plans?.yearly
  if (!plan?.displayPrice) return '599'
  return String(plan.displayPrice).replace(/[^\d]/g, '') || '599'
}
