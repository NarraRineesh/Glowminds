import { useEffect, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminBarChart, AdminChartCard } from './AdminCharts'
import { AdminKpi, AdminPageHeader, AdminTableWrap, adminTableClass, adminTdClass, adminThClass } from './adminUi'

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
    <div className="space-y-5">
      <AdminPageHeader
        title="Token & cost usage"
        description="Estimated provider cost from logged AI calls."
        actions={(
          <div className="flex gap-2">
            <select
              className="h-9 rounded-md border border-border bg-card px-2 text-sm"
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
        )}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminKpi label="Calls" value={(totals.calls || 0).toLocaleString('en-IN')} />
        <AdminKpi label="Tokens" value={(totals.totalTokens || 0).toLocaleString('en-IN')} />
        <AdminKpi label="Est. cost" value={`$${Number(totals.estimatedCostUsd || 0).toFixed(4)}`} />
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

      <AdminTableWrap>
        <table className={`${adminTableClass} min-w-[560px]`}>
          <thead>
            <tr>
              <th className={adminThClass}>Date</th>
              <th className={adminThClass}>Calls</th>
              <th className={adminThClass}>Tokens</th>
              <th className={adminThClass}>Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.date} className="hover:bg-muted/40">
                <td className={adminTdClass}>{d.date}</td>
                <td className={`${adminTdClass} tabular-nums`}>{d.calls}</td>
                <td className={`${adminTdClass} tabular-nums`}>{(d.totalTokens || 0).toLocaleString('en-IN')}</td>
                <td className={`${adminTdClass} tabular-nums`}>${Number(d.estimatedCostUsd || 0).toFixed(4)}</td>
              </tr>
            ))}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={4} className={`${adminTdClass} py-8 text-center text-muted-foreground`}>
                  No usage yet. AI calls will appear here after telemetry starts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableWrap>
    </div>
  )
}
