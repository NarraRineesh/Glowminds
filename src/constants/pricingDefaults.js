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
    proTagline: 'Just ₹33/month billed yearly — less than a cup of coffee',
    monthlyEquivalent: '₹33/month',
    heroDescription:
      'Unlimited access to AI-powered career tools. Built for students, priced for students. Just ₹33/month.',
    billingBlurb:
      'One payment of ₹399/year — about ₹33/month. Secure checkout via Razorpay (UPI, cards, net banking).',
    termsBillingText:
      'Pro subscriptions are billed annually at ₹399/year. Payments are processed securely through Razorpay. You can cancel your subscription at any time from your dashboard. Cancellations take effect at the end of the current billing period.',
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
  if (!plan) return '₹399/year'
  return `${plan.displayPrice || '₹399'}${plan.period || '/year'}`
}

export function yearlySeoPrice(config = DEFAULT_PRICING_CONFIG) {
  const plan = config?.plans?.yearly
  if (!plan?.displayPrice) return '399'
  return String(plan.displayPrice).replace(/[^\d]/g, '') || '399'
}
