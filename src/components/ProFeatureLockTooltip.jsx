import { useYearlyPriceLabel } from '@/hooks/usePricingConfig'
import AppIcon from '@/components/icons/AppIcon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'

/**
 * Wraps a nav row (or control) with a hover explanation for Pro-only features.
 */
export default function ProFeatureLockTooltip({ label, hint, children }) {
  const priceLabel = useYearlyPriceLabel()

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" align="start" className="max-w-[240px] text-left">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <AppIcon name="lock" className="size-3.5 shrink-0 text-primary" />
          {label}
          <span className="font-normal text-muted-foreground">· Pro</span>
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {hint}
          {' '}
          Unlock with Glowminds Pro (
          {priceLabel}
          ).
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

export function proNavCollapsedTooltip(label, hint, priceLabel = '₹599/year') {
  return `${label} (Pro) — ${hint} · ${priceLabel}`
}
