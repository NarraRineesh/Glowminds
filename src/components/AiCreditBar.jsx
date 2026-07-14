import { DEFAULT_PRICING_CONFIG } from '@/constants/pricingDefaults'

/** @deprecated Credit balance bar removed from AI tool UIs. Cost helper kept for callers. */
export function getCareerChatCost(creditCosts) {
  return creditCosts?.careerChat ?? DEFAULT_PRICING_CONFIG.creditCosts.careerChat ?? 1
}

export default function AiCreditBar() {
  return null
}
