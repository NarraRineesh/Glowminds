import { useNavigate } from 'react-router-dom'
import useIsPro from '@/hooks/useIsPro'
import useUpgradePro from '@/hooks/useUpgradePro'
import { useYearlyPriceLabel } from '@/hooks/usePricingConfig'
import { AppIcon, Button } from '@/components/ui'

/**
 * When the user opens a Pro route directly, show a minimal locked state —
 * no blur overlay or modal popup.
 */
export default function UpgradeGate({ feature, description, children }) {
  const isPro = useIsPro()
  const navigate = useNavigate()
  const { startUpgrade, loading } = useUpgradePro()
  const priceLabel = useYearlyPriceLabel()

  if (isPro) return children

  const featureLabel = feature || 'This feature'

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
        <AppIcon name="lock" className="size-6 text-primary" />
      </div>
      <div className="max-w-md space-y-1">
        <p className="text-base font-bold text-foreground">{featureLabel}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description || `This tool is included with Glowminds Pro (${priceLabel}). Use the sidebar lock icon to see what Pro unlocks.`}
        </p>
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
