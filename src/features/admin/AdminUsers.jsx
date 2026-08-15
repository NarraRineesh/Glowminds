import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminApi } from '@/services/adminApi'
import { Button, Input } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminChartCard, AdminDonut } from './AdminCharts'
import { AdminKpi, AdminPageHeader, AdminTableWrap, adminTableClass, adminTdClass, adminThClass } from './adminUi'

const PAGE_SIZE = 25

function normalizeFilter(value) {
  if (value === 'pro' || value === 'free') return value
  return 'all'
}

export default function AdminUsers() {
  const addToast = useAppStore((s) => s.addToast)
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = normalizeFilter(searchParams.get('filter'))
  const [q, setQ] = useState('')
  const [users, setUsers] = useState([])
  const [pageCursors, setPageCursors] = useState([null])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busyUid, setBusyUid] = useState(null)
  const [overview, setOverview] = useState(null)
  const reqId = useRef(0)

  const loadPage = useCallback(async (pageNum, pageCursor, searchQ = q) => {
    const id = ++reqId.current
    setLoading(true)
    try {
      const res = await adminApi.users({
        q: searchQ.trim() || undefined,
        filter,
        limit: PAGE_SIZE,
        cursor: pageCursor || undefined,
      })
      if (id !== reqId.current) return
      setUsers(res.users || [])
      setHasNext(!!res.nextCursor)
      setPage(pageNum)
      setPageCursors((prev) => {
        const next = prev.slice(0, pageNum)
        next[pageNum - 1] = pageCursor ?? null
        if (res.nextCursor) next[pageNum] = res.nextCursor
        return next
      })
    } catch (err) {
      if (id !== reqId.current) return
      addToast?.('error', err.message || 'Failed to load users')
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [addToast, filter, q])

  useEffect(() => {
    setPageCursors([null])
    loadPage(1, null, q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  useEffect(() => {
    adminApi.overview().then(setOverview).catch(() => {})
  }, [])

  const onFilterChange = (value) => {
    const next = normalizeFilter(value)
    if (next === 'all') setSearchParams({}, { replace: true })
    else setSearchParams({ filter: next }, { replace: true })
  }

  const runAction = async (uid, fn, successMsg) => {
    setBusyUid(uid)
    try {
      await fn()
      addToast('success', successMsg)
      await loadPage(page, pageCursors[page - 1] ?? null)
      const ov = await adminApi.overview().catch(() => null)
      if (ov) setOverview(ov)
    } catch (err) {
      addToast('error', err.message || 'Action failed')
    }
    setBusyUid(null)
  }

  const planChart = useMemo(() => {
    const pro = overview?.activePro ?? users.filter((u) => u.isPro).length
    const total = overview?.users ?? Math.max(users.length, pro)
    const free = Math.max(0, (total || 0) - (pro || 0))
    return [
      { label: 'Pro', value: pro || 0, color: '#0f766e' },
      { label: 'Free', value: free || 0, color: '#64748b' },
    ]
  }, [overview, users])

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Users"
        description="Search, filter, disable, delete, grant Pro, or downgrade."
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminKpi
            label="Total users"
            value={(overview?.users ?? '—').toLocaleString?.('en-IN') ?? overview?.users ?? '—'}
          />
          <AdminKpi label="Active Pro" value={overview?.activePro ?? '—'} />
          <AdminKpi
            label="Conversion"
            value={overview?.proConversionRate != null ? `${overview.proConversionRate}%` : '—'}
          />
        </div>
        <AdminChartCard title="Plan mix" subtitle="Pro vs Free">
          <AdminDonut segments={planChart} size={100} />
        </AdminChartCard>
      </div>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPageCursors([null])
          loadPage(1, null)
        }}
      >
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">Search</label>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email or name"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Filter</label>
          <select
            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pro">Pro only</option>
            <option value="free">Free only</option>
          </select>
        </div>
        <Button type="submit" size="sm" disabled={loading}>Search</Button>
      </form>

      <AdminTableWrap>
        <table className={`${adminTableClass} min-w-[1100px]`}>
          <thead>
            <tr>
              <th className={adminThClass}>User</th>
              <th className={adminThClass}>Plan</th>
              <th className={adminThClass}>Status</th>
              <th className={adminThClass}>Credits</th>
              <th className={adminThClass}>Account</th>
              <th className={`${adminThClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={6} className={`${adminTdClass} py-8 text-center text-muted-foreground`}>
                  Loading…
                </td>
              </tr>
            ) : null}
            {users.map((u) => (
              <tr key={u.uid} className="hover:bg-muted/40">
                <td className={adminTdClass}>
                  <Link to={`/admin/users/${u.uid}`} className="font-medium hover:underline">
                    {u.displayName || u.email || u.uid}
                  </Link>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className={adminTdClass}>
                  {u.isPro ? (
                    <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                      Pro {u.plan || ''}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Free</span>
                  )}
                </td>
                <td className={`${adminTdClass} text-xs`}>
                  {u.subscriptionStatus || '—'}
                </td>
                <td className={`${adminTdClass} tabular-nums`}>{u.creditsBalance ?? '—'}</td>
                <td className={adminTdClass}>
                  {u.disabled ? (
                    <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">Disabled</span>
                  ) : (
                    <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs text-emerald-700">Active</span>
                  )}
                </td>
                <td className={adminTdClass}>
                  <div className="flex flex-wrap justify-end gap-1">
                    {!u.isPro ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyUid === u.uid}
                        onClick={() => void runAction(u.uid, () => adminApi.grantPro(u.uid, { plan: 'yearly' }), 'Granted Pro')}
                      >
                        Make Pro
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyUid === u.uid}
                        onClick={() => {
                          if (!window.confirm(`Downgrade ${u.email || u.uid} from Pro?`)) return
                          void runAction(u.uid, () => adminApi.revokePro(u.uid), 'Downgraded to Free')
                        }}
                      >
                        Downgrade
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyUid === u.uid}
                      onClick={() => void runAction(
                        u.uid,
                        () => adminApi.setUserDisabled(u.uid, !u.disabled),
                        u.disabled ? 'User enabled' : 'User disabled',
                      )}
                    >
                      {u.disabled ? 'Enable' : 'Disable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyUid === u.uid}
                      onClick={() => {
                        if (!window.confirm(`Permanently delete ${u.email || u.uid}? This cannot be undone.`)) return
                        void runAction(u.uid, () => adminApi.deleteUser(u.uid), 'User deleted')
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className={`${adminTdClass} py-8 text-center text-muted-foreground`}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableWrap>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Page {page}
          {users.length ? ` · ${users.length} on this page` : ''}
          {loading ? ' · refreshing…' : ''}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={loading || page <= 1} onClick={() => loadPage(page - 1, pageCursors[page - 2] ?? null)}>
            Previous
          </Button>
          <Button size="sm" variant="outline" disabled={loading || !hasNext} onClick={() => loadPage(page + 1, pageCursors[page])}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
