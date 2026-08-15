import { useEffect, useState } from 'react'
import PlanCard from '@/features/public/components/PlanCard'
import { DEFAULT_FEATURE_COMPARISON } from '@/constants/featureComparisonDefaults'
import { apiFetch } from '@/services/apiClient'
import { cn } from '@/components/ui'
import {
  COMPARISON_FLEX_HEADER_CLASS,
  COMPARISON_FLEX_ROW_CLASS,
  ComparisonTableShell,
} from '@/features/public/components/publicPageUi'

export function plansGridClass(count) {
  if (count >= 4) return 'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-7'
  if (count === 3) return 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7'
  return 'mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2'
}

export function useFeatureComparison() {
  const [featureComparison, setFeatureComparison] = useState(null)

  useEffect(() => {
    let cancelled = false
    apiFetch('/config/feature-comparison', { method: 'GET', auth: false })
      .then((comp) => {
        if (!cancelled) setFeatureComparison(comp?.featureComparison || null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const comparison = featureComparison?.columns?.length >= 3
    ? featureComparison
    : DEFAULT_FEATURE_COMPARISON
  return comparison
}

export function PlansGrid({
  plans = [],
  currentPlan = null,
  isPro = false,
  loggedIn = false,
  upgradeLoading = false,
  onUpgrade,
}) {
  return (
    <div className={plansGridClass(plans.length)}>
      {plans.map((plan) => {
        const isCurrent = currentPlan
          ? currentPlan.id === plan.id || currentPlan.key === plan.key
          : isPro && plan.tier === 'pro' && plan.highlighted
        return (
          <PlanCard
            key={plan.id}
            plan={plan}
            isProUser={Boolean(isCurrent && Number(plan.amountPaise) > 0)}
            upgradeLoading={upgradeLoading}
            loggedIn={loggedIn}
            onUpgrade={onUpgrade}
          />
        )
      })}
    </div>
  )
}

export function PlansComparisonTable({ comparison }) {
  const columns = Array.isArray(comparison?.columns) ? comparison.columns : []
  const rows = Array.isArray(comparison?.rows) ? comparison.rows : []
  if (!rows.length || !columns.length) return null

  const cols = {
    gridTemplateColumns: `minmax(160px,1.5fr) repeat(${columns.length}, minmax(100px,1fr))`,
  }

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-black tracking-tight text-foreground md:text-3xl">
        {comparison.title || 'Plans Comparison'}
      </h2>
      <ComparisonTableShell className="rounded-xl border border-border bg-card">
        <div className={COMPARISON_FLEX_HEADER_CLASS} style={cols}>
          <div className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">Feature</div>
          {columns.map((col) => (
            <div key={col.id || col.key} className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {col.label}
            </div>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row.id || row.feature} className={COMPARISON_FLEX_ROW_CLASS} style={cols}>
            <div className="py-0.5 text-sm font-medium text-foreground">{row.feature}</div>
            {columns.map((col) => {
              const val = row.values?.[col.key] ?? '—'
              const empty = !val || val === '-' || val === '—'
              return (
                <div key={col.key} className={cn('text-center text-sm', empty ? 'text-muted-foreground/50' : 'text-muted-foreground')}>
                  {val}
                </div>
              )
            })}
          </div>
        ))}
      </ComparisonTableShell>
    </div>
  )
}

/** Shared Free / Monthly / Yearly / Lifetime catalog + comparison. */
export default function PlansCatalog({
  plans = [],
  currentPlan = null,
  isPro = false,
  loggedIn = false,
  upgradeLoading = false,
  onUpgrade,
  comparison,
  showComparison = true,
  className,
}) {
  return (
    <div className={cn('flex flex-col gap-12 md:gap-16', className)}>
      <PlansGrid
        plans={plans}
        currentPlan={currentPlan}
        isPro={isPro}
        loggedIn={loggedIn}
        upgradeLoading={upgradeLoading}
        onUpgrade={onUpgrade}
      />
      {showComparison ? <PlansComparisonTable comparison={comparison} /> : null}
    </div>
  )
}
