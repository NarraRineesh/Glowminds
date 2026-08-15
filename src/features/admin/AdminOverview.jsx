import { useEffect, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminBarChart, AdminChartCard, AdminDonut } from './AdminCharts'
import { AdminKpi, AdminPageHeader } from './adminUi'

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
      <AdminPageHeader
        title="Overview"
        description="Users, Pro revenue, AI cost, and credit burn."
        actions={(
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        )}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpi label="Users" value={d.users?.toLocaleString?.('en-IN') ?? d.users} />
        <AdminKpi label="Active Pro" value={d.activePro?.toLocaleString?.('en-IN') ?? d.activePro} />
        <AdminKpi
          label="Pro conversion"
          value={d.proConversionRate != null ? `${d.proConversionRate}%` : '—'}
          hint="Active Pro / users"
        />
        <AdminKpi label="Est. MRR" value={formatInr(d.mrrEstimatePaise)} hint="Yearly plans / 12" />
      </div>

      {d.costSpike?.alert ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {d.costSpike.message}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpi label="AI calls today" value={d.today?.calls ?? 0} />
        <AdminKpi label="Tokens today" value={(d.today?.totalTokens ?? 0).toLocaleString('en-IN')} />
        <AdminKpi
          label="Est. cost today"
          value={`$${(d.today?.estimatedCostUsd ?? 0).toFixed(4)}`}
          hint={d.last30Days?.avgDailyCostUsd != null ? `30d avg $${Number(d.last30Days.avgDailyCostUsd).toFixed(4)}/day` : undefined}
        />
        <AdminKpi label="Lifetime paid" value={formatInr(d.totalPaidPaise)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <AdminChartCard title="AI cost (30d)" subtitle="Estimated USD by day">
          <AdminBarChart
            data={(d.dailySeries || []).map((row) => ({
              label: row.date,
              value: Number(row.estimatedCostUsd) || 0,
            }))}
            color="#d97706"
          />
        </AdminChartCard>
        <AdminChartCard title="Plan mix" subtitle="Active Pro vs Free">
          <AdminDonut
            segments={[
              { label: 'Pro', value: d.activePro || 0, color: '#0f766e' },
              { label: 'Free', value: Math.max(0, (d.users || 0) - (d.activePro || 0)), color: '#64748b' },
            ]}
          />
        </AdminChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <AdminChartCard title="AI by feature (today)" subtitle="Calls per task">
          {(d.today?.byTask || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No AI calls logged today yet.</p>
          ) : (
            <>
              <AdminBarChart
                data={d.today.byTask.map((row) => ({
                  label: row.task,
                  value: row.calls || 0,
                }))}
              />
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
            </>
          )}
        </AdminChartCard>

        <AdminChartCard title="Last 30 days" subtitle="Aggregate usage">
          <dl className="grid gap-2 sm:grid-cols-3 text-sm">
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
          <AdminBarChart
            className="mt-4"
            data={(d.dailySeries || []).map((row) => ({
              label: row.date,
              value: row.calls || 0,
            }))}
            color="#6366f1"
          />
        </AdminChartCard>
      </div>
    </div>
  )
}
