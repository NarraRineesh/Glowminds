import { useEffect, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminBarChart, AdminChartCard } from './AdminCharts'

export default function AdminTokenUsage() {
  const addToast = useAppStore((s) => s.addToast)
  const [data, setData] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  async function load(d = days) {
    setLoading(true)
    try {
      setData(await adminApi.tokenUsage(d))
    } catch (err) {
      addToast?.('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totals = data?.totals || {}
  const list = data?.days || []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Token & cost usage</h1>
          <p className="text-sm text-muted-foreground">Estimated provider cost from logged AI calls.</p>
        </div>
        <div className="flex gap-2">
          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={days}
            onChange={(e) => {
              const d = Number(e.target.value)
              setDays(d)
              load(d)
            }}
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <Button size="sm" variant="outline" onClick={() => load()} disabled={loading}>Refresh</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-background p-4">
          <p className="text-xs uppercase text-muted-foreground">Calls</p>
          <p className="text-2xl font-semibold tabular-nums">{(totals.calls || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-background p-4">
          <p className="text-xs uppercase text-muted-foreground">Tokens</p>
          <p className="text-2xl font-semibold tabular-nums">{(totals.totalTokens || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-background p-4">
          <p className="text-xs uppercase text-muted-foreground">Est. cost</p>
          <p className="text-2xl font-semibold tabular-nums">${Number(totals.estimatedCostUsd || 0).toFixed(4)}</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <AdminChartCard title="Daily cost" subtitle="Estimated USD">
          <AdminBarChart
            data={list.map((row) => ({ label: row.date, value: Number(row.estimatedCostUsd) || 0 }))}
            color="#d97706"
          />
        </AdminChartCard>
        <AdminChartCard title="Daily tokens" subtitle="Token volume">
          <AdminBarChart
            data={list.map((row) => ({ label: row.date, value: Number(row.totalTokens) || 0 }))}
            color="#6366f1"
          />
        </AdminChartCard>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/70 bg-background">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Calls</th>
              <th className="px-3 py-2">Tokens</th>
              <th className="px-3 py-2">Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.date} className="border-b border-border/40">
                <td className="px-3 py-2">{d.date}</td>
                <td className="px-3 py-2 tabular-nums">{d.calls}</td>
                <td className="px-3 py-2 tabular-nums">{(d.totalTokens || 0).toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 tabular-nums">${Number(d.estimatedCostUsd || 0).toFixed(4)}</td>
              </tr>
            ))}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No usage yet. AI calls will appear here after telemetry starts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
