import { useEffect, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui'
import useAppStore from '@/store/authStore'

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Pricing FAQs</h1>
          <p className="text-sm text-muted-foreground">
            Firestore <code className="text-xs">config/pricingFaqs</code>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} disabled={loading || saving}>Reload</Button>
          <Button size="sm" onClick={save} disabled={loading || saving}>Save</Button>
        </div>
      </div>
      <textarea
        className="min-h-[480px] w-full rounded-lg border border-border/70 bg-background p-3 font-mono text-xs leading-relaxed"
        value={json}
        onChange={(e) => setJson(e.target.value)}
        spellCheck={false}
        disabled={loading}
      />
    </div>
  )
}
