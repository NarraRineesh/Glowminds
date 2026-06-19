import { Link, useNavigate } from 'react-router-dom'
import useEntitlements from '@/hooks/useEntitlements'
import useUpgradePro from '@/hooks/useUpgradePro'
import { AppIcon, Button, DashboardCard, Progress, cn } from '@/components/ui'

function formatResetDate(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return null
  }
}

/** Compact inline badge for headers (e.g. "3 credits · 1/msg"). */
export function AiCreditsBadge({ action, className }) {
  const { creditBalance, creditCosts, isPro, loading } = useEntitlements()
  if (loading || creditBalance == null) return null

  const cost = action ? creditCosts?.[action] : null
  const label = isPro
    ? `${creditBalance} credits left`
    : `${creditBalance} free credit${creditBalance === 1 ? '' : 's'} left`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary',
        className,
      )}
    >
      <AppIcon name="sparkle" className="size-3" />
      {label}
      {cost ? ` · ${cost}/use` : ''}
    </span>
  )
}

/** Dashboard card: AI credits + application/resume usage from server entitlements. */
export default function PlanUsageSummary({ className, compact = false }) {
  const { entitlements, isPro, creditBalance, loading, refresh } = useEntitlements()
  const { startUpgrade, loading: upgrading } = useUpgradePro()

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
  const appLimit = freeLimits?.applications ?? 10
  const resumeLimit = freeLimits?.resumes ?? 1
  const proMonthly = entitlements?.proLimits?.aiCreditsPerMonth ?? 100
  const credits = entitlements?.credits
  const resetLabel = formatResetDate(credits?.periodEnd)

  const appPct = isPro ? 100 : Math.min(100, Math.round((appCount / appLimit) * 100))
  const resumePct = isPro ? 100 : Math.min(100, Math.round((resumeCount / resumeLimit) * 100))
  const creditPct = isPro
    ? Math.min(100, Math.round(((creditBalance ?? 0) / proMonthly) * 100))
    : Math.min(100, Math.round(((creditBalance ?? 0) / (freeLimits?.aiCredits ?? 5)) * 100))

  if (compact) {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground',
          className,
        )}
      >
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <AppIcon name="sparkle" className="size-3.5 text-primary" />
          {creditBalance ?? '—'} AI credits
          {isPro && resetLabel ? ` · resets ${resetLabel}` : !isPro ? ' (lifetime)' : ''}
        </span>
        {!isPro && (
          <>
            <span aria-hidden>·</span>
            <span>{appCount}/{appLimit} apps</span>
            <span aria-hidden>·</span>
            <span>{resumeCount}/{resumeLimit} resume{resumeLimit === 1 ? '' : 's'}</span>
          </>
        )}
        <Button variant="ghost" size="sm" className="ms-auto h-7 px-2 text-xs" onClick={() => void refresh({ force: true })}>
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <DashboardCard
      className={className}
      titleIcon="sparkle"
      title={isPro ? 'Pro usage' : 'Free plan usage'}
      action={
        !isPro ? (
          <Button size="sm" disabled={upgrading} onClick={() => void startUpgrade({ plan: 'yearly' })}>
            {upgrading ? 'Opening…' : 'Upgrade'}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => void refresh({ force: true })}>
            Refresh
          </Button>
        )
      }
      contentClassName="space-y-4"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">AI credits</span>
          <span className="font-semibold tabular-nums text-foreground">
            {creditBalance ?? '—'}
            {isPro ? ` / ${proMonthly}` : ` / ${freeLimits?.aiCredits ?? 5} lifetime`}
          </span>
        </div>
        <Progress value={creditPct} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
        {isPro && resetLabel && (
          <p className="text-xs text-muted-foreground">Monthly credits reset on {resetLabel}</p>
        )}
      </div>

      {!isPro && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Applications tracked</span>
              <span className="font-semibold tabular-nums">{appCount} / {appLimit}</span>
            </div>
            <Progress value={appPct} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Resumes</span>
              <span className="font-semibold tabular-nums">{resumeCount} / {resumeLimit}</span>
            </div>
            <Progress value={resumePct} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
          </div>
        </>
      )}

      {entitlements?.creditCosts && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="mb-1.5 font-semibold text-foreground">Credit costs</p>
          <ul className="grid gap-1 sm:grid-cols-2">
            <li>AI Coach · {entitlements.creditCosts.careerChat}</li>
            <li>Cover letter · {entitlements.creditCosts.coverLetter}</li>
            <li>Mock interview · {entitlements.creditCosts.interviewSession}</li>
            <li>Grammar / paraphrase · {entitlements.creditCosts.grammar}</li>
          </ul>
        </div>
      )}

      {!isPro && (
        <p className="text-xs text-muted-foreground">
          Need more?{' '}
          <Link to="/pricing" className="font-medium text-primary hover:underline">
            See Pro plans
          </Link>
          {' '}for 100 credits/month and unlimited tracking.
        </p>
      )}
    </DashboardCard>
  )
}

export function ApplicationLimitBanner({ className }) {
  const navigate = useNavigate()
  const { isPro, entitlements, loading } = useEntitlements()
  if (loading || isPro || !entitlements) return null

  const count = entitlements.entitlements?.applicationCount ?? 0
  const limit = entitlements.freeLimits?.applications ?? 10
  if (count < limit) {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        {count} of {limit} free application slots used.
      </p>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm',
        className,
      )}
    >
      <span className="text-amber-700 dark:text-amber-400">
        You&apos;ve reached the free limit ({limit} applications). Upgrade for unlimited tracking.
      </span>
      <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>
        Upgrade
      </Button>
    </div>
  )
}
