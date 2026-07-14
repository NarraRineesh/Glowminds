import { useEffect, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'

function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value ?? '—'}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function formatInr(paise) {
  if (paise == null) return '—'
  return `₹${(Number(paise) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export default function AdminOverview() {
  const addToast = useAppStore((s) => s.addToast)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setData(await adminApi.overview())
    } catch (err) {
      setError(err.message || 'Failed to load overview')
      addToast?.('error', err.message || 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await adminApi.overview()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load overview')
          addToast?.('error', err.message || 'Failed to load overview')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [addToast])

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground">Loading overview…</p>
  }

  if (error && !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button size="sm" onClick={load}>Retry</Button>
      </div>
    )
  }

  const d = data || {}

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="text-sm text-muted-foreground">Users, Pro revenue, AI cost, and credit burn.</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Users" value={d.users?.toLocaleString?.('en-IN') ?? d.users} />
        <Kpi label="Active Pro" value={d.activePro?.toLocaleString?.('en-IN') ?? d.activePro} />
        <Kpi
          label="Pro conversion"
          value={d.proConversionRate != null ? `${d.proConversionRate}%` : '—'}
          hint="Active Pro / users"
        />
        <Kpi label="Est. MRR" value={formatInr(d.mrrEstimatePaise)} hint="Yearly plans / 12" />
      </div>

      {d.costSpike?.alert ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {d.costSpike.message}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="AI calls today" value={d.today?.calls ?? 0} />
        <Kpi label="Tokens today" value={(d.today?.totalTokens ?? 0).toLocaleString('en-IN')} />
        <Kpi
          label="Est. cost today"
          value={`$${(d.today?.estimatedCostUsd ?? 0).toFixed(4)}`}
          hint={d.last30Days?.avgDailyCostUsd != null ? `30d avg $${Number(d.last30Days.avgDailyCostUsd).toFixed(4)}/day` : undefined}
        />
        <Kpi label="Lifetime paid" value={formatInr(d.totalPaidPaise)} />
      </div>

      <div className="rounded-lg border border-border/70 bg-background p-4">
        <h2 className="text-sm font-semibold">AI by feature (today)</h2>
        {(d.today?.byTask || []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No AI calls logged today yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {d.today.byTask.map((row) => (
              <li key={row.task} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-medium">{row.task}</span>
                <span className="tabular-nums text-muted-foreground">
                  {row.calls} calls · ${(row.estimatedCostUsd || 0).toFixed(4)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-border/70 bg-background p-4">
        <h2 className="text-sm font-semibold">Last 30 days</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Calls</dt>
            <dd className="font-medium tabular-nums">{(d.last30Days?.calls ?? 0).toLocaleString('en-IN')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tokens</dt>
            <dd className="font-medium tabular-nums">{(d.last30Days?.totalTokens ?? 0).toLocaleString('en-IN')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Est. cost (USD)</dt>
            <dd className="font-medium tabular-nums">${(d.last30Days?.estimatedCostUsd ?? 0).toFixed(4)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
