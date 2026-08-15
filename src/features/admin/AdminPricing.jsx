import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminBarChart, AdminChartCard } from './AdminCharts'
import { AdminJsonEditor, AdminPageHeader } from './adminUi'

/**
 * Admin JSON editor for config/pricing — plans[] + creditPolicies[].
 * Missing 16-hex ids are assigned on the server when you save.
 */
export default function AdminPricing() {
  const addToast = useAppStore((s) => s.addToast)
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await adminApi.getPricing()
      setJson(JSON.stringify(res.pricing, null, 2))
    } catch (err) {
      addToast?.('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function save() {
    let parsed
    try {
      parsed = JSON.parse(json)
    } catch {
      addToast?.('error', 'Invalid JSON')
      return
    }
    setSaving(true)
    try {
      const res = await adminApi.updatePricing(parsed)
      setJson(JSON.stringify(res.pricing, null, 2))
      addToast?.('success', 'Pricing saved')
    } catch (err) {
      addToast?.('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const creditBars = useMemo(() => {
    try {
      const parsed = JSON.parse(json || '{}')
      const policies = parsed.creditPolicies || []
      if (Array.isArray(policies) && policies.length) {
        return policies.map((p) => ({
          label: p.key || p.label,
          value: Number(p.creditCost) || 0,
        }))
      }
      const costs = parsed.creditCosts || {}
      return Object.entries(costs).map(([label, value]) => ({ label, value: Number(value) || 0 }))
    } catch {
      return []
    }
  }, [json])

  const planCount = useMemo(() => {
    try {
      const parsed = JSON.parse(json || '{}')
      return Array.isArray(parsed.plans) ? parsed.plans.length : 0
    } catch {
      return 0
    }
  }, [json])

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Pricing config"
        description={(
          <>
            Firestore <code className="text-xs">config/pricing</code> — <strong>plans[]</strong> (cards) +{' '}
            <strong>creditPolicies[]</strong> (backend access/credits only). Ids are 16 hex digits.
            {planCount ? ` · ${planCount} plans` : null}
          </>
        )}
        actions={(
          <>
            <Button size="sm" variant="outline" onClick={load} disabled={loading || saving}>Reload</Button>
            <Button size="sm" onClick={save} disabled={loading || saving}>Save</Button>
          </>
        )}
      />

      <AdminChartCard title="Credit costs" subtitle="From creditPolicies (or legacy creditCosts)">
        <AdminBarChart data={creditBars} color="#0f766e" />
      </AdminChartCard>

      <AdminJsonEditor value={json} onChange={setJson} disabled={loading} minHeight="min-h-[480px]" />
    </div>
  )
}
