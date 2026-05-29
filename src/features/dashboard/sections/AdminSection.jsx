import AppIcon from '@/components/icons/AppIcon'
import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import {
  AppDialog,
  Badge,
  Button,
  Checkbox,
  DashboardCard,
  FormField,
  Input,
  Select,
  Textarea,
  cn,
} from '@/components/ui'
import useAppStore from '@/store/authStore'
import {
  bulkCreateCompanies,
  createCompany,
  deleteCompany,
  getAdminOverview,
  listCompanies,
  listSyncRuns,
  updateCompany,
} from '@/services/adminApi'

const ATS_OPTIONS = ['greenhouse', 'lever', 'ashby', 'bamboohr', 'workday']

const BADGE_TONES = {
  gray: 'border-border bg-secondary text-muted-foreground',
  green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  red: 'border-destructive/20 bg-destructive/10 text-destructive',
  blue: 'border-primary/20 bg-primary/10 text-primary',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

function AdminBadge({ children, tone = 'gray' }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em]',
        BADGE_TONES[tone] || BADGE_TONES.gray,
      )}
    >
      {children}
    </Badge>
  )
}

// ----------------------------------------------------------------------
// Small presentational helpers
// ----------------------------------------------------------------------

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtRelative(iso) {
  if (!iso) return 'never'
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function fmtNumber(n) {
  if (n === null || n === undefined) return '—'
  if (typeof n !== 'number') return String(n)
  if (Math.abs(n) >= 1000) return n.toLocaleString()
  return String(n)
}

// ----------------------------------------------------------------------
// Add / Edit Company modal
// ----------------------------------------------------------------------

function CompanyModal({ open, initial, onClose, onSave }) {
  const isEdit = !!initial?.slug
  const [form, setForm] = useState({
    name: '',
    slug: '',
    ats: 'greenhouse',
    website: '',
    active: true,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || '',
        slug: initial?.slug || '',
        ats: initial?.ats || 'greenhouse',
        website: initial?.website || '',
        active: initial?.active !== false,
      })
      setErr('')
    }
  }, [open, initial])

  const submit = async () => {
    setBusy(true)
    setErr('')
    try {
      await onSave(form, isEdit)
      onClose()
    } catch (e) {
      setErr(e?.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={isEdit ? `Edit ${initial?.name || 'company'}` : 'Add company'}
      description={
        isEdit
          ? 'Slug and ATS are immutable. Update name, website, or active state.'
          : 'jobsApi + careersUrl are auto-derived from the ATS.'
      }
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={busy || !form.name || !form.slug}
          >
            {busy ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <FormField label="Name">
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Codalinc"
        />
      </FormField>
      <FormField
        label="Slug"
        hint={form.ats === 'workday' ? 'workday: company|wdN|siteId' : 'lowercase, hyphens ok'}
      >
        <Input
          value={form.slug}
          disabled={isEdit}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
          placeholder="codalinc"
        />
      </FormField>
      <FormField label="ATS">
        <Select
          value={form.ats}
          disabled={isEdit}
          onChange={(e) => setForm((f) => ({ ...f, ats: e.target.value }))}
        >
          {ATS_OPTIONS.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="Website (optional)">
        <Input
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          placeholder="https://codal.com"
        />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={form.active}
          onCheckedChange={(v) => setForm((f) => ({ ...f, active: !!v }))}
        />
        Active — included in scheduled syncs
      </label>
      {err && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}
    </AppDialog>
  )
}

function BulkUploadModal({ open, onClose, onUpload }) {
  const [text, setText] = useState('')
  const [filename, setFilename] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    if (open) {
      setText('')
      setFilename('')
      setErr('')
      setResult(null)
      setProgress(null)
    }
  }, [open])

  const parsed = (() => {
    if (!text.trim()) return null
    try {
      const obj = JSON.parse(text)
      if (Array.isArray(obj)) return obj
      if (Array.isArray(obj?.companies)) return obj.companies
      return null
    } catch {
      return null
    }
  })()
  const parseError = text.trim() && parsed === null

  const onFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFilename(file.name)
    setErr('')
    setResult(null)
    try {
      const content = await file.text()
      setText(content)
    } catch {
      setErr('Failed to read file')
    }
  }

  const submit = async () => {
    if (!parsed) {
      setErr('Paste valid JSON or upload a file first')
      return
    }
    setBusy(true)
    setErr('')
    setProgress({ processed: 0, total: parsed.length, batch: 0, totalBatches: 0 })
    try {
      const r = await onUpload(parsed, (p) => setProgress(p))
      setResult(r)
    } catch (e) {
      setErr(e?.message || 'Upload failed')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const reset = () => {
    setText('')
    setFilename('')
    setResult(null)
    setProgress(null)
  }

  const close = () => {
    if (busy) return
    onClose(result?.summary?.created > 0)
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => !v && close()}
      size="lg"
      title="Bulk upload companies"
      description={
        <>
          Drop a JSON file or paste an array of company objects.{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {`{ name, slug, ats, website?, active? }`}
          </code>
          . Extra fields (jobsApi, jobCount, …) are ignored.
        </>
      }
      contentClassName="max-h-[60vh] overflow-y-auto"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={close} disabled={busy}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button size="sm" onClick={submit} disabled={busy || !parsed}>
              {busy ? 'Uploading…' : `Upload ${parsed ? parsed.length : 0}`}
            </Button>
          )}
          {result && (
            <Button size="sm" onClick={reset}>Upload more</Button>
          )}
        </>
      }
    >
      {!result ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-muted px-3 py-1.5 text-sm font-semibold hover:bg-muted/80">
              <AppIcon name="folder" className="size-3.5" /> Choose JSON file
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={onFileChange}
              />
            </label>
            {filename && (
              <span className="text-sm text-muted-foreground">
                {filename}
              </span>
            )}
            {text && (
              <Button variant="ghost" size="xs" onClick={reset}>Clear</Button>
            )}
          </div>

          <FormField label="Or paste JSON">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              className="font-mono text-xs"
              placeholder={`[\n  {\n    "name": "Codalinc",\n    "slug": "codalinc",\n    "ats": "greenhouse",\n    "website": "https://codal.com",\n    "active": true\n  }\n]`}
            />
          </FormField>

          {parsed && !progress && (
            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
              Parsed <b>{parsed.length}</b> compan{parsed.length === 1 ? 'y' : 'ies'} — ready to upload.
              {parsed.length > 250 && (
                <span className="ml-1 text-muted-foreground">
                  (will upload in {Math.ceil(parsed.length / 250)} batches of 250)
                </span>
              )}
            </div>
          )}
          {progress && (
            <div className="rounded-lg border border-border bg-muted px-3 py-2">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span>
                  Uploading batch {progress.batch || 1}
                  {progress.totalBatches ? ` / ${progress.totalBatches}` : ''}…
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {progress.processed}/{progress.total}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${progress.total ? Math.round((progress.processed / progress.total) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
          {parseError && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              Could not parse JSON. Expected an array or {`{ companies: [...] }`}.
            </div>
          )}
          {err && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}
        </>
      ) : (
        <BulkResultView result={result} />
      )}
    </AppDialog>
  )
}

function BulkResultView({ result }) {
  const { summary, results = [] } = result || {}
  const failed = results.filter((r) => r.status === 'error')
  const skipped = results.filter((r) => r.status === 'skipped')
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Total" value={summary?.total} tone="gray" />
        <Stat label="Created" value={summary?.created} tone="green" />
        <Stat label="Skipped" value={summary?.skipped} tone="amber" />
        <Stat label="Failed" value={summary?.failed} tone="red" />
      </div>
      {failed.length > 0 && (
        <DetailList title={`Errors (${failed.length})`} tone="red" rows={failed} />
      )}
      {skipped.length > 0 && (
        <DetailList title={`Skipped (${skipped.length})`} tone="amber" rows={skipped} />
      )}
    </div>
  )
}

function Stat({ label, value, tone }) {
  const palette = {
    gray: 'text-foreground',
    green: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-destructive',
  }[tone] || 'text-foreground'
  return (
    <div className="rounded-lg border border-border bg-muted py-2">
      <div className={cn('text-[1.2rem] font-extrabold tabular-nums', palette)}>
        {value ?? 0}
      </div>
      <div className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
    </div>
  )
}

function DetailList({ title, tone, rows }) {
  return (
    <details className="rounded-lg border border-border bg-muted" open>
      <summary className="cursor-pointer px-3 py-2 text-[0.8rem] font-bold text-foreground">
        {title}
      </summary>
      <ul className="max-h-48 space-y-1 overflow-y-auto px-3 pb-3 text-[0.76rem]">
        {rows.map((r) => (
          <li key={`${r.index}-${r.slug || 'x'}`} className="flex justify-between gap-2">
            <span className="font-mono text-foreground">
              [{r.index}] {r.slug || '—'}
            </span>
            <span
              className={cn('truncate text-right', tone === 'red' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400')}
            >
              {r.reason || '—'}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

// ----------------------------------------------------------------------
// Main page
// ----------------------------------------------------------------------

export default function AdminSection() {
  const { user, addToast } = useAppStore()

  // Hooks must run before any early returns — admin gate uses Navigate below.

  const [overview, setOverview] = useState(null)
  const [companies, setCompanies] = useState([])
  const [runs, setRuns] = useState([])

  const [loading, setLoading] = useState(true)
  const [filterAts, setFilterAts] = useState('')
  const [filterActive, setFilterActive] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitial, setModalInitial] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  // Server-side cursor pagination state.
  // `cursors` is indexed by page number; cursors[N] is the cursor passed
  // to the backend to fetch page N. Page 0 starts with cursor=null.
  const [pageSize, setPageSize] = useState(25)
  const [pageIdx, setPageIdx] = useState(0)
  const [cursors, setCursors] = useState([null])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [companiesLoading, setCompaniesLoading] = useState(false)

  // ----- data loaders -----
  const loadOverview = useCallback(async ({ fresh = false } = {}) => {
    try {
      const r = await getAdminOverview({ fresh })
      setOverview(r)
    } catch (e) {
      console.warn('admin overview:', e)
    }
  }, [])

  const loadCompanies = useCallback(
    async ({ cursor = null, pageIndex = 0 } = {}) => {
      setCompaniesLoading(true)
      try {
        const opts = { limit: pageSize }
        if (filterAts) opts.ats = filterAts
        if (filterActive === 'active') opts.active = true
        if (filterActive === 'inactive') opts.active = false
        if (debouncedSearch.trim()) opts.q = debouncedSearch.trim()
        if (cursor) opts.cursor = cursor
        const r = await listCompanies(opts)
        setCompanies(r.companies || [])
        setNextCursor(r.nextCursor || null)
        setHasMore(!!r.hasMore)
        setPageIdx(pageIndex)
      } catch (e) {
        console.warn('admin companies:', e)
        addToast?.('error', 'Failed to load companies')
      } finally {
        setCompaniesLoading(false)
      }
    },
    [pageSize, filterAts, filterActive, debouncedSearch, addToast],
  )

  const loadRuns = useCallback(async () => {
    try {
      const r = await listSyncRuns({ limit: 25 })
      setRuns(r.runs || [])
    } catch (e) {
      console.warn('admin sync runs:', e)
    }
  }, [])

  // initial fan-out (companies loads via the filter/cursor effect below)
  useEffect(() => {
    if (!user?.isAdmin) return
    setLoading(true)
    Promise.all([loadOverview(), loadRuns()])
      .finally(() => setLoading(false))
  }, [user?.isAdmin, loadOverview, loadRuns])

  // Debounce the search box so each keystroke isn't a backend hit.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset to page 0 + load fresh whenever filters / page size / search change.
  useEffect(() => {
    if (!user?.isAdmin) return
    setCursors([null])
    loadCompanies({ cursor: null, pageIndex: 0 })
  }, [user?.isAdmin, filterAts, filterActive, pageSize, debouncedSearch, loadCompanies])

  // ----- actions -----
  const onCreateOrUpdate = async (form, isEdit) => {
    if (isEdit) {
      const { name, website, active } = form
      const res = await updateCompany(form.slug, { name, website, active })
      setCompanies((list) =>
        list.map((c) => (c.slug === form.slug ? { ...c, ...res.company } : c)),
      )
      addToast?.('success', `Updated ${form.name}`)
    } else {
      const res = await createCompany(form)
      setCompanies((list) => [res.company, ...list])
      addToast?.('success', `Added ${form.name}`)
      loadOverview({ fresh: true })
    }
  }

  const onDelete = async (slug) => {
    if (!window.confirm(`Delete company "${slug}"? Existing jobs won't be removed.`)) return
    try {
      await deleteCompany(slug)
      setCompanies((list) => list.filter((c) => c.slug !== slug))
      addToast?.('success', 'Company deleted')
      loadOverview({ fresh: true })
    } catch (e) {
      addToast?.('error', e?.message || 'Delete failed')
    }
  }

  const onBulkUpload = async (companies, onProgress) => {
    const r = await bulkCreateCompanies(companies, { onProgress })
    const { summary } = r
    if (summary.created > 0) {
      addToast?.(
        'success',
        `Created ${summary.created} compan${summary.created === 1 ? 'y' : 'ies'}`,
      )
      loadCompanies()
      loadOverview({ fresh: true })
    } else if (summary.failed > 0) {
      addToast?.('error', `${summary.failed} failed`)
    } else if (summary.skipped > 0) {
      addToast?.('info', `${summary.skipped} skipped (already exist)`)
    }
    return r
  }

  // ----- derived -----
  // Range shown in the pagination footer. Cursor pagination doesn't know
  // total pages, so we render "Showing X–Y" and rely on the overview
  // endpoint for the all-up "of N" count next to the card title.
  const rangeFrom = companies.length === 0 ? 0 : pageIdx * pageSize + 1
  const rangeTo = pageIdx * pageSize + companies.length

  // "Go to next page": remember the cursor used for the *next* page and
  // advance pageIdx by 1. We never lose any history — clicking Prev pops
  // straight back to the cached cursor.
  const onNextPage = useCallback(() => {
    if (!hasMore || !nextCursor) return
    setCursors((arr) => {
      const next = arr.slice()
      next[pageIdx + 1] = nextCursor
      return next
    })
    loadCompanies({ cursor: nextCursor, pageIndex: pageIdx + 1 })
  }, [hasMore, nextCursor, pageIdx, loadCompanies])

  const onPrevPage = useCallback(() => {
    if (pageIdx <= 0) return
    const prevIdx = pageIdx - 1
    loadCompanies({ cursor: cursors[prevIdx] || null, pageIndex: prevIdx })
  }, [pageIdx, cursors, loadCompanies])

  // Gate the whole page on the admin claim AFTER hooks have run.
  if (!user) return null
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div>
      <SectionHeader
        badge="ADMIN"
        badgeClassName="border-purple-600/30 bg-purple-600 text-white"
        title="Admin Console"
        subtitle="Manage companies that feed the job board. Bulk job ingestion runs from the local pipeline CLI."
      />

      {/* ---------- KPIs ---------- */}
      <div className="mb-6 grid grid-cols-2 gap-3 @sm/dashboard:grid-cols-3 @3xl/dashboard:grid-cols-4">
        {[
          { ic: 'users', lbl: 'Users', val: overview?.users?.total, sub: 'Signed up' },
          { ic: 'buildings', lbl: 'Companies', val: overview?.companies?.total, sub: `${overview?.companies?.active || 0} active` },
          { ic: 'jobs', lbl: 'Active Jobs', val: overview?.jobs?.active, sub: 'Across all companies' },
          {
            ic: 'refresh',
            lbl: 'Last Sync',
            val: overview?.latestRun?.finishedAt ? fmtRelative(overview.latestRun.finishedAt) : '—',
            sub: overview?.latestRun
              ? `+${overview.latestRun.jobsAdded} ~${overview.latestRun.jobsUpdated} −${overview.latestRun.jobsExpired}`
              : 'No syncs yet',
            isText: true,
          },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.lbl}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.04 }}
            className="rounded-2xl border border-border bg-background px-4 py-3"
          >
            <div className="mb-1"><AppIcon name={kpi.ic} className="size-5 text-primary" /></div>
            <div className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {kpi.lbl}
            </div>
            <div className={`mt-0.5 ${kpi.isText ? 'text-[0.98rem]' : 'text-[1.4rem]'} font-extrabold leading-tight text-foreground`}>
              {kpi.isText ? (kpi.val ?? '—') : fmtNumber(kpi.val)}
            </div>
            <div className="mt-0.5 text-[0.72rem] text-muted-foreground">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ---------- Companies ---------- */}
      <DashboardCard
        className="mb-6"
        title={
          overview?.companies?.total != null
            ? `Companies (${fmtNumber(overview.companies.total)})`
            : 'Companies'
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or slug…"
              className="h-8 w-44 text-xs"
            />
            <Select
              value={filterAts}
              onChange={(e) => setFilterAts(e.target.value)}
              className="h-8 w-auto text-xs"
            >
              <option value="">All ATS</option>
              {ATS_OPTIONS.map((id) => <option key={id} value={id}>{id}</option>)}
            </Select>
            <Select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="h-8 w-auto text-xs"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}><AppIcon name="download" className="size-3.5" /> Bulk upload</Button>
            <Button size="sm" onClick={() => { setModalInitial(null); setModalOpen(true) }}>
              + Add company
            </Button>
          </div>
        }
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[0.82rem]">
            <thead>
              <tr className="border-b border-border text-[0.66rem] uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-4 py-2 font-bold">Company</th>
                <th className="px-2 py-2 font-bold">ATS</th>
                <th className="px-2 py-2 font-bold text-right">Jobs</th>
                <th className="px-2 py-2 font-bold text-right">India</th>
                <th className="px-2 py-2 font-bold">Last sync</th>
                <th className="px-2 py-2 font-bold">Status</th>
                <th className="px-4 py-2 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    {loading || companiesLoading
                      ? 'Loading…'
                      : debouncedSearch
                        ? `No companies match “${debouncedSearch}”.`
                        : 'No companies yet. Click “Add company”.'}
                  </td>
                </tr>
              )}
              {companies.map((c) => (
                <tr key={c.slug} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <div className="text-[0.7rem] text-muted-foreground">
                      {c.slug}
                      {c.careersUrl && (
                        <>
                          {' · '}
                          <a href={c.careersUrl} target="_blank" rel="noreferrer" className="underline">
                            careers
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-[0.76rem] text-muted-foreground">{c.ats}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{fmtNumber(c.jobCount || 0)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{fmtNumber(c.indiaJobCount || 0)}</td>
                  <td className="px-2 py-2.5">
                    <div className="text-foreground">{fmtRelative(c.lastSyncAt)}</div>
                    {c.lastError && (
                      <div className="text-[0.7rem] text-[rgb(220,38,38)]" title={c.lastError}>
                        {c.lastError.length > 36 ? c.lastError.slice(0, 36) + '…' : c.lastError}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    {c.active ? <AdminBadge tone="green">active</AdminBadge> : <AdminBadge tone="gray">inactive</AdminBadge>}
                    {c.syncFailures > 0 && (
                      <span className="ml-1"><AdminBadge tone="red">{c.syncFailures} fail</AdminBadge></span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => { setModalInitial(c); setModalOpen(true) }}
                        title="Edit"
                      >
                        <AppIcon name="pencil-simple" className="size-3.5" />
                      </Button>
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => onDelete(c.slug)}
                        title="Delete"
                      >
                        <AppIcon name="x" className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {(companies.length > 0 || pageIdx > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[0.78rem] text-muted-foreground sm:px-5">
            <div className="flex items-center gap-2">
              {companies.length > 0 ? (
                <span>
                  Showing <b className="text-foreground">{rangeFrom}</b>–
                  <b className="text-foreground">{rangeTo}</b>
                  {debouncedSearch && (
                    <span className="ml-1 text-muted-foreground">
                      matching “{debouncedSearch}”
                    </span>
                  )}
                </span>
              ) : (
                <span>No results on this page.</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs">
                Rows:
                <Select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 w-auto text-xs"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </label>
              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={onPrevPage}
                  disabled={pageIdx === 0 || companiesLoading}
                  title="Previous"
                >‹ Prev</Button>
                <span className="px-2 text-foreground tabular-nums">
                  Page {pageIdx + 1}
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={onNextPage}
                  disabled={!hasMore || companiesLoading || !!debouncedSearch}
                  title={debouncedSearch ? 'Pagination disabled while searching' : 'Next'}
                >Next ›</Button>
              </div>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* ---------- Recent sync runs ---------- */}
      <DashboardCard
        className="mb-6"
        title="Recent sync runs"
        action={
          <Button size="xs" variant="ghost" onClick={loadRuns}>↻ Refresh</Button>
        }
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[0.82rem]">
            <thead>
              <tr className="border-b border-border text-[0.66rem] uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-4 py-2 font-bold">Provider</th>
                <th className="px-2 py-2 font-bold">Finished</th>
                <th className="px-2 py-2 font-bold text-right">Scanned</th>
                <th className="px-2 py-2 font-bold text-right">Skipped</th>
                <th className="px-2 py-2 font-bold text-right">+ / ~ / −</th>
                <th className="px-4 py-2 font-bold text-right">Errors</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No sync runs recorded yet.
                  </td>
                </tr>
              )}
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-[0.76rem] text-foreground">{r.provider}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">
                    {fmtDateTime(r.finishedAt)}
                    {r.elapsedMs ? (
                      <span className="ml-1 text-[0.7rem]">· {(r.elapsedMs / 1000).toFixed(1)}s</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{r.companiesScanned ?? 0}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{r.companiesSkipped ?? 0}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">
                    <span className="text-[rgb(22,163,74)]">+{r.jobsAdded || 0}</span>{' '}
                    <span className="text-muted-foreground">~{r.jobsUpdated || 0}</span>{' '}
                    <span className="text-[rgb(220,38,38)]">−{r.jobsExpired || 0}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {Array.isArray(r.errors) && r.errors.length > 0 ? (
                      <AdminBadge tone="red">{r.errors.length}</AdminBadge>
                    ) : (
                      <AdminBadge tone="green">0</AdminBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <CompanyModal
        open={modalOpen}
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSave={onCreateOrUpdate}
      />

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onUpload={onBulkUpload}
      />
    </div>
  )
}
