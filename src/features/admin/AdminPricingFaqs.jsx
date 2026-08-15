import { useEffect, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminJsonEditor, AdminPageHeader } from './adminUi'

/** Admin JSON for config/pricingFaqs */
export default function AdminPricingFaqs() {
  const addToast = useAppStore((s) => s.addToast)
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await adminApi.getPricingFaqs()
      setJson(JSON.stringify(res, null, 2))
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
      const res = await adminApi.updatePricingFaqs(parsed)
      setJson(JSON.stringify(res, null, 2))
      addToast?.('success', 'Pricing FAQs saved')
    } catch (err) {
      addToast?.('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Pricing FAQs"
        description={(
          <>
            Firestore <code className="text-xs">config/pricingFaqs</code>
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
