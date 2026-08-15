import { Link } from 'react-router-dom'
import useIsPro from '@/hooks/useIsPro'
import useEntitlements from '@/hooks/useEntitlements'
import usePricingConfig from '@/hooks/usePricingConfig'
import { PRO_FEATURE_COPY } from '@/constants/featureAccess'
import AppIcon from '@/components/icons/AppIcon'
import { Button, Card, CardContent, cn } from '@/components/ui'

/**
 * Gates Pro-only dashboard features. Credit-based free tools should NOT use this.
 */
export default function UpgradeGate({
  children,
  feature = 'This feature',
  description,
  highlights,
  proOnly = true,
  className,
}) {
  const isPro = useIsPro()
  const { loading } = useEntitlements()
  const { freeLimits } = usePricingConfig()
  const freeCredits = freeLimits?.aiCredits ?? 10
  const freeApps = freeLimits?.applications ?? 10
  const freeResumes = freeLimits?.resumes ?? 1

  const copy = PRO_FEATURE_COPY[feature] || {}
  const title = copy.title || feature
  const body = description || copy.description || `${feature} is available on Glowminds Pro.`
  const bullets = highlights || copy.highlights || []

  if (!proOnly) {
    return className ? <div className={className}>{children}</div> : children
  }

  if (loading) {
    return (
      <div className={cn('animate-pulse rounded-xl border border-border bg-muted/40 p-8', className)}>
        <div className="mx-auto h-6 w-48 rounded bg-muted" />
        <div className="mx-auto mt-3 h-4 w-72 max-w-full rounded bg-muted" />
      </div>
    )
  }

  if (isPro) {
    return className ? <div className={className}>{children}</div> : children
  }

  return (
    <div className={cn('flex min-h-[min(28rem,70vh)] items-center justify-center py-8', className)}>
      <Card className="w-full max-w-lg border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-500/5 py-0">
        <CardContent className="space-y-5 p-6 sm:p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <AppIcon name="star" className="size-7 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Pro feature</p>
            <h2 className="text-xl font-black text-foreground">{title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
          {bullets.length > 0 && (
            <ul className="space-y-2 text-left text-sm text-muted-foreground">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <AppIcon name="check" className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button nativeButton={false} render={<Link to="/dashboard/plans" />}>
              Compare plans & choose
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Free plan still includes job search, {freeResumes} resume{freeResumes === 1 ? '' : 's'},{' '}
            {freeApps} application tracks, and {freeCredits} AI credits/month for grammar & profile tools.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
