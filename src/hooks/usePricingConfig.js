import usePricingStore from '@/store/pricingStore'
import { yearlyPriceLabel as formatYearlyPriceLabel } from '@/constants/pricingDefaults'

export default function usePricingConfig() {
  const config = usePricingStore((s) => s.config)
  const loading = usePricingStore((s) => s.loading)
  const loaded = usePricingStore((s) => s.loaded)
  const fromRemote = usePricingStore((s) => s.fromRemote)

  return {
    config,
    loading,
    loaded,
    fromRemote,
    plans: config.plans,
    freeLimits: config.freeLimits,
    pricing: config.pricing,
    freeFeatures: config.freeFeatures,
    proFeatures: config.proFeatures,
    pricingComparison: config.pricingComparison,
    pricingFaqs: config.pricingFaqs,
    marketing: config.marketing,
    yearlyPriceLabel: formatYearlyPriceLabel(config),
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
