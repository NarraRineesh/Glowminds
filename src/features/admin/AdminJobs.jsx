import { useEffect, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button, Input } from '@/components/ui'
import useAppStore from '@/store/authStore'

export default function AdminJobs() {
  const addToast = useAppStore((s) => s.addToast)
  const [q, setQ] = useState('')
  const [jobs, setJobs] = useState([])
  const [moderation, setModeration] = useState({ hiddenIds: [], boostedIds: [] })
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = async (search = q) => {
    setLoading(true)
    try {
      const data = await adminApi.jobs({ q: search, limit: 25 })
      setJobs(data.jobs || [])
      setModeration(data.moderation || { hiddenIds: [], boostedIds: [] })
    } catch (err) {
      addToast('error', err.message || 'Failed to load jobs')
    }
    setLoading(false)
  }

  useEffect(() => {
    void load('')
  }, [])

  const moderate = async (payload) => {
    const id = payload.hideId || payload.unhideId || payload.boostId || payload.unboostId
    setBusyId(id)
    try {
      const next = await adminApi.moderateJob(payload)
      setModeration(next)
      addToast('success', 'Moderation updated')
      await load()
    } catch (err) {
      addToast('error', err.message || 'Moderation failed')
    }
    setBusyId(null)
  }

  const hidden = new Set(moderation.hiddenIds || [])
  const boosted = new Set(moderation.boostedIds || [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Jobs moderation</h1>
        <p className="text-sm text-muted-foreground">
          Hide stale listings or boost curated roles. Changes apply on the next board search.
        </p>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void load(q)
        }}
      >
        <Input
          className="max-w-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search jobs…"
        />
        <Button type="submit" size="sm" disabled={loading}>{loading ? 'Loading…' : 'Search'}</Button>
      </form>

      <p className="text-xs text-muted-foreground">
        Hidden: {hidden.size} · Boosted: {boosted.size}
      </p>

      <ul className="space-y-2">
        {jobs.map((j) => {
          const isHidden = hidden.has(j.id)
          const isBoosted = boosted.has(j.id)
          return (
            <li
              key={j.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{j.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {j.company || j.co} · {j.id}
                  {isBoosted ? ' · boosted' : ''}
                  {isHidden ? ' · hidden' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === j.id}
                  onClick={() => void moderate(isBoosted ? { unboostId: j.id } : { boostId: j.id })}
                >
                  {isBoosted ? 'Unboost' : 'Boost'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === j.id}
                  onClick={() => void moderate(isHidden ? { unhideId: j.id } : { hideId: j.id })}
                >
                  {isHidden ? 'Unhide' : 'Hide'}
                </Button>
              </div>
            </li>
          )
        })}
        {!loading && !jobs.length && (
          <li className="text-sm text-muted-foreground">No jobs found for this query.</li>
        )}
      </ul>
    </div>
  )
}
