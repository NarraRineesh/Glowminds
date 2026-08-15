import { useEffect, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminJsonEditor, AdminPageHeader } from './adminUi'

/** Admin JSON for config/featureComparison */
export default function AdminFeatureComparison() {
  const addToast = useAppStore((s) => s.addToast)
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await adminApi.getFeatureComparison()
      setJson(JSON.stringify(res.featureComparison, null, 2))
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
      const res = await adminApi.updateFeatureComparison(parsed)
      setJson(JSON.stringify(res.featureComparison, null, 2))
      addToast?.('success', 'Feature Comparison saved')
    } catch (err) {
      addToast?.('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Feature Comparison"
        description={(
          <>
            Firestore <code className="text-xs">config/featureComparison</code> — columns + rows for the pricing page table.
          </>
        )}
        actions={(
          <>
            <Button size="sm" variant="outline" onClick={load} disabled={loading || saving}>Reload</Button>
            <Button size="sm" onClick={save} disabled={loading || saving}>Save</Button>
          </>
        )}
      />
      <AdminJsonEditor value={json} onChange={setJson} disabled={loading} minHeight="min-h-[480px]" />
    </div>
  )
}
