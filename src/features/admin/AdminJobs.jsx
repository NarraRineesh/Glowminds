import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button, Input } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminBarChart, AdminChartCard, AdminDonut } from './AdminCharts'
import { AdminKpi, AdminPageHeader, AdminTableWrap, adminTableClass, adminTdClass, adminThClass } from './adminUi'

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
    <div className="space-y-5">
      <AdminPageHeader
        title="Jobs"
        description="Catalog stats from api.glowminds.in. Hide/boost flags stay in Firestore."
        actions={(
          <>
            <Button size="sm" variant="outline" onClick={() => void loadStats()} disabled={statsLoading}>
              Refresh counts
            </Button>
            {!showTable && (
              <Button size="sm" onClick={() => void openTable()} disabled={statsLoading}>
                Show jobs table
              </Button>
            )}
          </>
        )}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminKpi
          label="Total jobs"
          value={statsLoading && stats == null ? '…' : (stats?.total ?? 0).toLocaleString('en-IN')}
        />
        <AdminKpi label="Hidden" value={stats?.hidden ?? 0} />
        <AdminKpi label="Boosted" value={stats?.boosted ?? 0} />
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

          <AdminTableWrap>
            <table className={`${adminTableClass} min-w-[960px]`}>
              <thead>
                <tr>
                  <th className={adminThClass}>Job</th>
                  <th className={adminThClass}>Company</th>
                  <th className={adminThClass}>Type</th>
                  <th className={adminThClass}>Posted</th>
                  <th className={adminThClass}>Status</th>
                  <th className={`${adminThClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && !jobs.length ? (
                  <tr>
                    <td colSpan={6} className={`${adminTdClass} py-8 text-center text-muted-foreground`}>Loading…</td>
                  </tr>
                ) : null}
                {jobs.map((j) => {
                  const isHidden = hidden.has(j.id)
                  return (
                    <tr key={j.id} className="hover:bg-muted/40">
                      <td className={adminTdClass}>
                        <p className="m-0 font-medium">{j.title}</p>
                        <p className="m-0 max-w-[280px] truncate text-xs text-muted-foreground">{j.id}</p>
                      </td>
                      <td className={`${adminTdClass} text-xs`}>{j.company || j.co || '—'}</td>
                      <td className={`${adminTdClass} text-xs`}>{j.type || '—'}</td>
                      <td className={`${adminTdClass} text-xs text-muted-foreground`}>{j.posted || j.publishedAt || '—'}</td>
                      <td className={adminTdClass}>
                        {isHidden ? (
                          <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">Hidden</span>
                        ) : (
                          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs text-emerald-700">Visible</span>
                        )}
                      </td>
                      <td className={adminTdClass}>
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
                    <td colSpan={6} className={`${adminTdClass} py-8 text-center text-muted-foreground`}>No jobs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </AdminTableWrap>

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
