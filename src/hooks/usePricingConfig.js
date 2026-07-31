import usePricingStore from '@/store/pricingStore'
import {
  cardFeaturesAsChecklist,
  findPlanByIdOrKey,
  highlightedPlan,
  resolveUserPlan,
  visiblePlans,
  yearlyPriceLabel as formatYearlyPriceLabel,
} from '@/constants/pricingDefaults'

export default function usePricingConfig() {
  const config = usePricingStore((s) => s.config)
  const loading = usePricingStore((s) => s.loading)
  const loaded = usePricingStore((s) => s.loaded)
  const fromRemote = usePricingStore((s) => s.fromRemote)

  const plansList = visiblePlans(config)
  const freePlan = findPlanByIdOrKey(config, 'free')
  const proPlan = highlightedPlan(config) || findPlanByIdOrKey(config, 'yearly')

  return {
    config,
    loading,
    loaded,
    fromRemote,
    plans: config.plans,
    plansList,
    freePlan,
    proPlan,
    freeLimits: config.freeLimits,
    creditPolicies: config.creditPolicies || [],
    pricing: {
      free: freePlan
        ? {
            label: freePlan.label,
            price: freePlan.displayPrice,
            period: freePlan.period,
            desc: freePlan.desc,
            features: (freePlan.cardFeatures || []).filter((f) => f.included !== false).map((f) => f.text),
          }
        : null,
      pro: proPlan
        ? {
            label: proPlan.label,
            price: proPlan.displayPrice,
            regularPrice: proPlan.regularPrice,
            period: proPlan.period,
            desc: proPlan.desc,
            highlights: (proPlan.cardFeatures || []).filter((f) => f.badge).map((f) => f.text),
            features: (proPlan.cardFeatures || []).filter((f) => f.included !== false).map((f) => f.text),
          }
        : null,
    },
    freeFeatures: cardFeaturesAsChecklist(freePlan),
    proFeatures: cardFeaturesAsChecklist(proPlan),
    pricingComparison: [],
    pricingFaqs: [],
    marketing: config.marketing,
    yearlyPriceLabel: formatYearlyPriceLabel(config),
    resolvePlan: (subscription, isPro, planId = null) =>
      resolveUserPlan(config, subscription, { isPro, planId }),
  }
}

export function useYearlyPriceLabel() {
  const config = usePricingStore((s) => s.config)
  return formatYearlyPriceLabel(config)
}

export function useFreeLimits() {
  const config = usePricingStore((s) => s.config)
  return config.freeLimits
}

export { resolveUserPlan, cardFeaturesAsChecklist, findPlanByIdOrKey, highlightedPlan, visiblePlans }
