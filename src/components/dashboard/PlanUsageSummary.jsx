import { Link } from 'react-router-dom'
import useEntitlements from '@/hooks/useEntitlements'
import { AppIcon, Button, DashboardCard, Progress } from '@/components/ui'

function formatResetDate(iso) {
  if (!iso) return null
  const parsed = new Date(iso)
  if (!Number.isFinite(parsed.getTime())) return null
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Credits, application, and resume usage from server entitlements. */
export default function PlanUsageSummary({ className }) {
  const { entitlements, isPro, credits, loading, refresh } = useEntitlements()
  const creditBalance = credits?.balance

  if (loading && !entitlements) {
    return (
      <DashboardCard
        className={className}
        titleIcon="sparkle"
        title="Plan usage"
        contentClassName="text-sm text-muted-foreground"
      >
        Loading usage…
      </DashboardCard>
    )
  }

  const freeLimits = entitlements?.freeLimits
  const appCount = entitlements?.entitlements?.applicationCount ?? 0
  const resumeCount = entitlements?.entitlements?.resumeCount ?? 0
  const appLimit = entitlements?.limits?.applications ?? freeLimits?.applications ?? 10
  const resumeLimit = entitlements?.limits?.resumes ?? freeLimits?.resumes ?? 1
  const proMonthly = entitlements?.proLimits?.aiCreditsPerMonth
  const freeGrant = freeLimits?.aiCredits ?? 10
  const creditCap = isPro ? (proMonthly || null) : freeGrant
  const resetLabel = formatResetDate(credits?.periodEnd)
  const creditPct = creditCap
    ? Math.min(100, Math.round(((creditBalance ?? 0) / creditCap) * 100))
    : 0
  const appPct = isPro || appLimit < 0 ? 0 : Math.min(100, Math.round((appCount / Math.max(appLimit, 1)) * 100))
  const resumePct = isPro || resumeLimit < 0 ? 0 : Math.min(100, Math.round((resumeCount / Math.max(resumeLimit, 1)) * 100))

  return (
    <DashboardCard
      className={className}
      titleIcon="sparkle"
      title={isPro ? 'Pro usage' : 'Free plan usage'}
      action={(
        <Button variant="ghost" size="sm" onClick={() => void refresh({ force: true })}>
          Refresh
        </Button>
      )}
      contentClassName="space-y-4"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">AI credits</span>
          <span className="font-semibold tabular-nums text-foreground">
            {creditBalance ?? '—'}
            {creditCap ? ` / ${creditCap}` : ''}
          </span>
        </div>
        {creditCap ? <Progress value={creditPct} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" /> : null}
        {resetLabel ? (
          <p className="text-xs text-muted-foreground">Credits reset on {resetLabel}</p>
        ) : null}
      </div>

      {!isPro && appLimit >= 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Applications tracked</span>
            <span className="font-semibold tabular-nums">{appCount} / {appLimit}</span>
          </div>
          <Progress value={appPct} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
        </div>
      )}

      {!isPro && resumeLimit >= 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Resumes</span>
            <span className="font-semibold tabular-nums">
              {resumeCount} / {resumeLimit}
            </span>
          </div>
          <Progress value={resumePct} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
        </div>
      )}

      {isPro && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <AppIcon name="check" className="size-4 text-emerald-500" />
          Pro includes unlimited resumes and tracked applications.
        </p>
      )}

      {!isPro && (
        <p className="text-xs text-muted-foreground">
          Need a higher plan?{' '}
          <Link to="/dashboard/plans" className="font-medium text-primary hover:underline">
            Compare plans
          </Link>
        </p>
      )}
    </DashboardCard>
  )
}
