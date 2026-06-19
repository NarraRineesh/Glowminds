import { useNavigate } from 'react-router-dom'
import useIsPro from '@/hooks/useIsPro'
import useEntitlements from '@/hooks/useEntitlements'
import useUpgradePro from '@/hooks/useUpgradePro'
import { useYearlyPriceLabel } from '@/hooks/usePricingConfig'
import { AppIcon, Button } from '@/components/ui'

/**
 * Gate Pro-only tools. Free users with AI credits see a softer prompt on
 * credit-backed features; salary/LinkedIn remain hard Pro walls.
 */
export default function UpgradeGate({
  feature,
  description,
  children,
  creditAction = null,
  creditCost = null,
}) {
  const isPro = useIsPro()
  const navigate = useNavigate()
  const { startUpgrade, loading } = useUpgradePro()
  const priceLabel = useYearlyPriceLabel()
  const { creditBalance, creditCosts, loading: entitlementsLoading } = useEntitlements()

  if (isPro) return children

  const resolvedCost = creditCost ?? (creditAction ? creditCosts?.[creditAction] : null)
  const hasCredits =
    typeof creditBalance === 'number' &&
    typeof resolvedCost === 'number' &&
    creditBalance >= resolvedCost

  if (creditAction && !entitlementsLoading && hasCredits) {
    return children
  }

  const featureLabel = feature || 'This feature'

  const body =
    creditAction && typeof creditBalance === 'number'
      ? creditBalance > 0
        ? `You have ${creditBalance} AI credit${creditBalance === 1 ? '' : 's'} left${resolvedCost ? ` (${resolvedCost} needed for this action)` : ''}. Upgrade for 100 credits per month.`
        : 'You have used all free AI credits. Upgrade to Pro for 100 credits per month.'
      : description ||
        `This tool is included with Glowminds Pro (${priceLabel}). Use the sidebar lock icon to see what Pro unlocks.`

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
        <AppIcon name="lock" className="size-6 text-primary" />
      </div>
      <div className="max-w-md space-y-1">
        <p className="text-base font-bold text-foreground">{featureLabel}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        <Button size="sm" disabled={loading} onClick={() => void startUpgrade({ plan: 'yearly' })}>
          {loading ? 'Opening checkout…' : 'Upgrade to Pro'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => navigate('/pricing')}>
          View pricing
        </Button>
      </div>
    </div>
  )
}
