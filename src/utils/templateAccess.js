/**
 * Resume-template entitlement for the embedded builder.
 *
 * Pro plans store `limits.template: null` for every template, or an array of ids
 * for a specific set. `entitlements.limits.template` is the wrong field for this:
 * a null Pro limit is replaced with the free template id before it reaches the client.
 */
export function resolveTemplateAllowance(entitlements, isPro) {
  if (!isPro) {
    const free = entitlements?.freeLimits?.template
    return typeof free === 'string' && free ? free : 'onyx'
  }

  const plans = Array.isArray(entitlements?.plans) ? entitlements.plans : []
  const planId = entitlements?.planId
    || entitlements?.subscription?.currentPlanId
    || entitlements?.subscription?.plan
    || null
  const active = plans.find((plan) => plan && (plan.id === planId || plan.key === planId))
  const raw = active?.limits?.template

  if (Array.isArray(raw)) {
    const ids = raw.filter((id) => typeof id === 'string' && id)
    return ids.length > 0 ? ids : null
  }
  if (typeof raw === 'string' && raw) return raw
  return null
}
