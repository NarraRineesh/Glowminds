import useUpgradePro from '@/hooks/useUpgradePro'
import { useYearlyPriceLabel } from '@/hooks/usePricingConfig'
import AppIcon from '@/components/icons/AppIcon'
import { Button } from '@/components/ui'

/** Shown when a feature API returns permission-denied (Pro required). */
export default function ProUpgradeInline({ message, className }) {
  const { startUpgrade, loading } = useUpgradePro()
  const yearlyPriceLabel = useYearlyPriceLabel()

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <AppIcon name="lock" className="size-10 text-primary/60" />
        <p className="text-sm font-semibold text-foreground">Glowminds Pro required</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {message || 'Upgrade to Pro to use this feature.'}
        </p>
        <Button size="sm" disabled={loading} onClick={() => void startUpgrade({ plan: 'yearly' })}>
          {loading ? 'Opening checkout…' : `Upgrade — ${yearlyPriceLabel}`}
        </Button>
      </div>
    </div>
  )
}
