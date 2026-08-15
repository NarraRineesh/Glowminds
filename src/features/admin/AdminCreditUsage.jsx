import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminBarChart, AdminChartCard } from './AdminCharts'
import { AdminPageHeader, AdminPanel, AdminTableWrap, adminTableClass, adminTdClass, adminThClass } from './adminUi'

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
    <div className="space-y-5">
      <AdminPageHeader
        title="Credit usage"
        description="Burn by feature from the credit ledger."
        actions={<Button size="sm" variant="outline" onClick={load} disabled={loading}>Refresh</Button>}
      />

      <AdminChartCard title="Credits debited by feature" subtitle="Absolute debit volume">
        <AdminBarChart data={burnChart} color="#dc2626" />
      </AdminChartCard>

      <AdminTableWrap>
        <table className={adminTableClass}>
          <thead>
            <tr>
              <th className={adminThClass}>Feature</th>
              <th className={adminThClass}>Debited</th>
              <th className={adminThClass}>Granted</th>
              <th className={adminThClass}>Net</th>
            </tr>
          </thead>
          <tbody>
            {(data?.byFeature || []).map((f) => (
              <tr key={f.featureKey} className="hover:bg-muted/40">
                <td className={`${adminTdClass} font-medium`}>{f.featureKey}</td>
                <td className={`${adminTdClass} tabular-nums`}>{f.debits}</td>
                <td className={`${adminTdClass} tabular-nums`}>{f.credits}</td>
                <td className={`${adminTdClass} tabular-nums`}>{f.net}</td>
              </tr>
            ))}
            {!loading && !(data?.byFeature || []).length && (
              <tr>
                <td colSpan={4} className={`${adminTdClass} py-8 text-center text-muted-foreground`}>No ledger data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableWrap>

      <AdminPanel title="Recent ledger">
        <AdminTableWrap className="-mx-4 -mb-4 rounded-none border-0 border-t">
          <table className={`${adminTableClass} min-w-[640px]`}>
            <thead>
              <tr>
                <th className={adminThClass}>User</th>
                <th className={adminThClass}>Feature</th>
                <th className={adminThClass}>Amount</th>
                <th className={adminThClass}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {(data?.entries || []).map((e) => (
                <tr key={e.id} className="hover:bg-muted/40">
                  <td className={`${adminTdClass} font-mono text-xs`}>{e.userId}</td>
                  <td className={adminTdClass}>{e.featureKey}</td>
                  <td className={`${adminTdClass} tabular-nums`}>{e.amount}</td>
                  <td className={`${adminTdClass} tabular-nums`}>{e.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableWrap>
      </AdminPanel>
    </div>
  )
}
