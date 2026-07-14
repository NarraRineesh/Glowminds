import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminBarChart, AdminChartCard } from './AdminCharts'

export default function AdminCreditUsage() {
  const addToast = useAppStore((s) => s.addToast)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      setData(await adminApi.creditUsage(150))
    } catch (err) {
      addToast?.('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const burnChart = useMemo(
    () => (data?.byFeature || []).map((f) => ({ label: f.featureKey, value: Math.abs(f.debits || 0) })),
    [data],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Credit usage</h1>
          <p className="text-sm text-muted-foreground">Burn by feature from the credit ledger.</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      <AdminChartCard title="Credits debited by feature" subtitle="Absolute debit volume">
        <AdminBarChart data={burnChart} color="#dc2626" />
      </AdminChartCard>

      <div className="overflow-x-auto rounded-lg border border-border/70 bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Feature</th>
              <th className="px-3 py-2">Debited</th>
              <th className="px-3 py-2">Granted</th>
              <th className="px-3 py-2">Net</th>
            </tr>
          </thead>
          <tbody>
            {(data?.byFeature || []).map((f) => (
              <tr key={f.featureKey} className="border-b border-border/40">
                <td className="px-3 py-2 font-medium">{f.featureKey}</td>
                <td className="px-3 py-2 tabular-nums">{f.debits}</td>
                <td className="px-3 py-2 tabular-nums">{f.credits}</td>
                <td className="px-3 py-2 tabular-nums">{f.net}</td>
              </tr>
            ))}
            {!loading && !(data?.byFeature || []).length && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No ledger data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/70 bg-background">
        <div className="border-b border-border/60 px-3 py-2 text-sm font-semibold">Recent ledger</div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Feature</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            {(data?.entries || []).map((e) => (
              <tr key={e.id} className="border-t border-border/40">
                <td className="px-3 py-2 text-xs font-mono">{e.userId}</td>
                <td className="px-3 py-2">{e.featureKey}</td>
                <td className="px-3 py-2 tabular-nums">{e.amount}</td>
                <td className="px-3 py-2 tabular-nums">{e.balanceAfter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
