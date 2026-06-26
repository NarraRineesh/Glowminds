import { AppIcon, Badge, Button, cn } from '@/components/ui'
import { DEFAULT_PRICING_CONFIG } from '@/constants/pricingDefaults'
import useUpgradePro from '@/hooks/useUpgradePro'

function formatResetDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Credit balance + upgrade CTA for AI tools (career chat, etc.).
 */
export default function AiCreditBar({
  balance,
  cost = 1,
  periodEnd,
  isPro = false,
  loading = false,
  className,
  unitLabel = 'per use',
  onUpgradeSuccess,
}) {
  const { startUpgrade, loading: upgradeLoading } = useUpgradePro()
  const safeCost = Math.max(1, Number(cost) || 1)
  const safeBalance = typeof balance === 'number' ? balance : null
  const canAfford = safeBalance == null ? true : safeBalance >= safeCost
  const lowCredits = safeBalance != null && safeBalance > 0 && safeBalance < safeCost * 3
  const resetLabel = formatResetDate(periodEnd)

  if (loading && safeBalance == null) {
    return (
      <div className={cn('h-9 animate-pulse rounded-lg border border-border bg-muted/40', className)} />
    )
  }

  if (safeBalance != null && !canAfford) {
    return (
      <div className={cn('rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3', className)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">No AI credits left</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Uses {safeCost} credit{safeCost === 1 ? '' : 's'} {unitLabel}.
              {resetLabel ? ` Credits reset ${resetLabel}.` : ''}
              {!isPro ? ' Upgrade to Pro for 100 credits/month.' : ''}
            </p>
          </div>
          {!isPro && (
            <Button size="sm" disabled={upgradeLoading} onClick={() => void startUpgrade({ onSuccess: onUpgradeSuccess })}>
              {upgradeLoading ? 'Opening…' : 'Upgrade to Pro'}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2', className)}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline" className="gap-1 font-semibold tabular-nums">
          <AppIcon name="lightning" className="size-3.5 text-amber-500" />
          {safeBalance == null ? '—' : safeBalance} credits
        </Badge>
        <span className="text-xs text-muted-foreground">
          {safeCost} {unitLabel}
          {resetLabel ? ` · resets ${resetLabel}` : ''}
        </span>
        {lowCredits && (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Running low</span>
        )}
      </div>
      {!isPro && (
        <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={upgradeLoading} onClick={() => void startUpgrade({ onSuccess: onUpgradeSuccess })}>
          Get more credits
        </Button>
      )}
    </div>
  )
}

export function getCareerChatCost(creditCosts) {
  return creditCosts?.careerChat ?? DEFAULT_PRICING_CONFIG.creditCosts.careerChat ?? 1
}
