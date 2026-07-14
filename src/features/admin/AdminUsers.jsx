import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminApi } from '@/services/adminApi'
import { Button, Input } from '@/components/ui'
import useAppStore from '@/store/authStore'

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

  // Single effect — filter from URL is the source of truth (avoids double fetch).
  useEffect(() => {
    setPageCursors([null])
    loadPage(1, null, q)
    // Intentionally omit `q` so typing doesn't refetch until Search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const onFilterChange = (value) => {
    const next = normalizeFilter(value)
    if (next === 'all') setSearchParams({}, { replace: true })
    else setSearchParams({ filter: next }, { replace: true })
  }

  const goNext = () => {
    if (!hasNext || !pageCursors[page]) return
    loadPage(page + 1, pageCursors[page])
  }

  const goPrev = () => {
    if (page <= 1) return
    loadPage(page - 1, pageCursors[page - 2] ?? null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          All users with Free/Pro status, billing fields, and credits — one table with pagination.
        </p>
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
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
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

      <div className="overflow-x-auto rounded-lg border border-border/70 bg-background">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Credits</th>
              <th className="px-3 py-2 font-medium">Ends</th>
              <th className="px-3 py-2 font-medium">Paid</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : null}
            {users.map((u) => (
              <tr key={u.uid} className="border-b border-border/40 hover:bg-foreground/[0.02]">
                <td className="px-3 py-2">
                  <Link to={`/admin/users/${u.uid}`} className="font-medium hover:underline">
                    {u.displayName || u.email || u.uid}
                  </Link>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="px-3 py-2">
                  {u.isPro ? (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                      Pro {u.plan || ''}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Free</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  {u.subscriptionStatus || '—'}
                  {u.cancelAtPeriodEnd ? (
                    <span className="ml-1 text-amber-600 dark:text-amber-400">(ending)</span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{u.source || '—'}</td>
                <td className="px-3 py-2 tabular-nums">{u.creditsBalance ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {u.endDate ? new Date(u.endDate).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-3 py-2 tabular-nums text-xs">
                  {u.totalPaidPaise != null
                    ? `₹${(u.totalPaidPaise / 100).toLocaleString('en-IN')}`
                    : '—'}
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Page {page}
          {users.length ? ` · ${users.length} on this page` : ''}
          {loading ? ' · refreshing…' : ''}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={loading || page <= 1} onClick={goPrev}>
            Previous
          </Button>
          <Button size="sm" variant="outline" disabled={loading || !hasNext} onClick={goNext}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
