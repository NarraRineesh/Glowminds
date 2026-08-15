import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button, Input } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminBarChart, AdminChartCard, AdminDonut } from './AdminCharts'

const PAGE_SIZE = 20

export default function AdminJobs() {
  const addToast = useAppStore((s) => s.addToast)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [showTable, setShowTable] = useState(false)
  const [q, setQ] = useState('')
  const [jobs, setJobs] = useState([])
  const [moderation, setModeration] = useState({ hiddenIds: [], boostedIds: [] })
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      setStats(await adminApi.jobStats())
    } catch (err) {
      addToast('error', err.message || 'Failed to load job stats')
    }
    setStatsLoading(false)
  }, [addToast])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const loadPage = useCallback(async (pageNum, search = q) => {
    setLoading(true)
    try {
      const data = await adminApi.jobs({
        q: search,
        limit: PAGE_SIZE,
        page: pageNum,
      })
      setJobs(data.jobs || [])
      setModeration(data.moderation || { hiddenIds: [], boostedIds: [] })
      setPagination(data.pagination || null)
      setPage(pageNum)
    } catch (err) {
      addToast('error', err.message || 'Failed to load jobs')
    }
    setLoading(false)
  }, [addToast, q])

  const openTable = async () => {
    setShowTable(true)
    await loadPage(1, q)
  }

  const moderate = async (payload) => {
    const id = payload.hideId || payload.unhideId || payload.boostId || payload.unboostId
    setBusyId(id)
    try {
      const next = await adminApi.moderateJob(payload)
      setModeration(next)
      addToast('success', 'Visibility updated')
      await loadStats()
    } catch (err) {
      addToast('error', err.message || 'Moderation failed')
    }
    setBusyId(null)
  }

  const hidden = useMemo(() => new Set(moderation.hiddenIds || []), [moderation.hiddenIds])
  const chartSegments = useMemo(() => {
    const total = stats?.total || 0
    const hid = stats?.hidden || 0
    const boost = stats?.boosted || 0
    const visible = Math.max(0, total - hid)
    return [
      { label: 'Visible', value: visible, color: '#0f766e' },
      { label: 'Hidden', value: hid, color: '#dc2626' },
      { label: 'Boosted', value: boost, color: '#d97706' },
    ]
  }, [stats])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Catalog stats from api.glowminds.in. Hide/boost flags stay in Firestore.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadStats()} disabled={statsLoading}>
            Refresh counts
          </Button>
          {!showTable && (
            <Button size="sm" onClick={() => void openTable()} disabled={statsLoading}>
              Show jobs table
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-background p-4">
          <p className="text-xs uppercase text-muted-foreground">Total jobs</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {statsLoading && stats == null ? '…' : (stats?.total ?? 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-lg border border-border/70 bg-background p-4">
          <p className="text-xs uppercase text-muted-foreground">Hidden</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{stats?.hidden ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-background p-4">
          <p className="text-xs uppercase text-muted-foreground">Boosted</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{stats?.boosted ?? 0}</p>
        </div>
      </div>

      <AdminChartCard title="Inventory mix" subtitle="Visible vs hidden vs boosted flags">
        <AdminDonut segments={chartSegments} />
      </AdminChartCard>

      {showTable && (
        <>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void loadPage(1, q)
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

          <div className="overflow-x-auto rounded-lg border border-border/70 bg-background">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-border/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Job</th>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Posted</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && !jobs.length ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Loading…</td>
                  </tr>
                ) : null}
                {jobs.map((j) => {
                  const isHidden = hidden.has(j.id)
                  return (
                    <tr key={j.id} className="border-b border-border/40">
                      <td className="px-3 py-2">
                        <p className="font-medium">{j.title}</p>
                        <p className="max-w-[280px] truncate text-xs text-muted-foreground">{j.id}</p>
                      </td>
                      <td className="px-3 py-2 text-xs">{j.company || j.co || '—'}</td>
                      <td className="px-3 py-2 text-xs">{j.type || '—'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{j.posted || j.publishedAt || '—'}</td>
                      <td className="px-3 py-2">
                        {isHidden ? (
                          <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">Hidden</span>
                        ) : (
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs text-emerald-700">Visible</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === j.id}
                            onClick={() => void moderate(isHidden ? { unhideId: j.id } : { hideId: j.id })}
                          >
                            {isHidden ? 'Show' : 'Hide'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!loading && !jobs.length && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No jobs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Page {page}
              {pagination?.total != null ? ` · ${pagination.total.toLocaleString('en-IN')} total` : ''}
              {loading ? ' · refreshing…' : ''}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={loading || page <= 1}
                onClick={() => void loadPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading || !pagination?.hasMore}
                onClick={() => void loadPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>

          {jobs.length > 0 && (
            <AdminChartCard title="Page snapshot" subtitle="Jobs on this page (1 = row)">
              <AdminBarChart
                data={jobs.slice(0, 12).map((j, i) => ({
                  label: String(i + 1),
                  value: hidden.has(j.id) ? 0 : 1,
                }))}
              />
            </AdminChartCard>
          )}
        </>
      )}
    </div>
  )
}
