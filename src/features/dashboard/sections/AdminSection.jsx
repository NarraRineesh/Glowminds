import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import useAppStore from '@/store/authStore'
import {
  bulkCreateCompanies,
  createCompany,
  deleteCompany,
  getAdminOverview,
  getSyncStatus,
  getUsageAggregate,
  listCompanies,
  listSyncRuns,
  syncAll,
  updateCompany,
} from '@/services/adminApi'
import '@/styles/dashboard.css'
import '@/styles/cards.css'

const ATS_OPTIONS = ['greenhouse', 'lever', 'ashby', 'bamboohr', 'workday']

// How often to poll /admin/sync/status while a sync is in progress. Was
// previously left as an undefined identifier — `setInterval(fn, undefined)`
// clamps to the browser minimum (~4ms), which fired ~250 polls/sec and
// chewed through the Firestore daily read quota in seconds.
const SYNC_STATUS_POLL_MS = 5000

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

function Pill({ children, tone = 'gray' }) {
  const palette = {
    gray: { bg: 'var(--color-bg3)', fg: 'var(--color-txt2)' },
    green: { bg: 'rgba(34,197,94,.12)', fg: 'rgb(22,163,74)' },
    red: { bg: 'rgba(239,68,68,.12)', fg: 'rgb(220,38,38)' },
    blue: { bg: 'var(--color-blu3)', fg: 'var(--color-blu2)' },
    amber: { bg: 'rgba(245,158,11,.12)', fg: 'rgb(217,119,6)' },
  }[tone] || { bg: 'var(--color-bg3)', fg: 'var(--color-txt2)' }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em]"
      style={{ background: palette.bg, color: palette.fg }}
    >
      {children}
    </span>
  )
}

function Card({ title, action, children, padding = true }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6 rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-bg)]"
    >
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-bdr)] px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-[0.98rem] font-bold tracking-tight text-[var(--color-txt)]">
            {title}
          </h2>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={padding ? 'px-4 py-4 sm:px-5 sm:py-5' : ''}>{children}</div>
    </motion.section>
  )
}

function Btn({ children, onClick, variant = 'default', size = 'sm', disabled, title }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'
  const sizing = size === 'xs' ? 'px-2 py-1 text-[0.72rem]' : 'px-3 py-1.5 text-[0.78rem]'
  const variants = {
    default:
      'border border-[var(--color-bdr)] bg-[var(--color-bg2)] text-[var(--color-txt)] hover:bg-[var(--color-bg3)]',
    primary:
      'bg-[var(--color-blu)] text-white hover:brightness-110',
    danger:
      'border border-[rgba(239,68,68,.4)] bg-[rgba(239,68,68,.08)] text-[rgb(220,38,38)] hover:bg-[rgba(239,68,68,.16)]',
    ghost:
      'text-[var(--color-txt2)] hover:bg-[var(--color-bg3)]',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${sizing} ${variants[variant] || variants.default}`}
    >
      {children}
    </button>
  )
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

  if (!open) return null

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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-bg)] shadow-xl"
      >
        <header className="border-b border-[var(--color-bdr)] px-5 py-4">
          <h3 className="text-[1.02rem] font-bold text-[var(--color-txt)]">
            {isEdit ? `Edit ${initial?.name || 'company'}` : 'Add company'}
          </h3>
          <p className="mt-1 text-[0.78rem] text-[var(--color-txt2)]">
            {isEdit
              ? 'Slug and ATS are immutable. Update name, website, or active state.'
              : `jobsApi + careersUrl are auto-derived from the ATS.`}
          </p>
        </header>
        <div className="space-y-3 px-5 py-4">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="admin-input"
              placeholder="Codalinc"
            />
          </Field>
          <Field label="Slug" hint={form.ats === 'workday' ? 'workday: company|wdN|siteId' : 'lowercase, hyphens ok'}>
            <input
              value={form.slug}
              disabled={isEdit}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
              className="admin-input disabled:opacity-50"
              placeholder="codalinc"
            />
          </Field>
          <Field label="ATS">
            <select
              value={form.ats}
              disabled={isEdit}
              onChange={(e) => setForm((f) => ({ ...f, ats: e.target.value }))}
              className="admin-input disabled:opacity-50"
            >
              {ATS_OPTIONS.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </Field>
          <Field label="Website (optional)">
            <input
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className="admin-input"
              placeholder="https://codal.com"
            />
          </Field>
          <label className="flex items-center gap-2 text-[0.84rem] text-[var(--color-txt)]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active — included in scheduled syncs
          </label>
          {err && (
            <div className="rounded-lg border border-[rgba(239,68,68,.3)] bg-[rgba(239,68,68,.08)] px-3 py-2 text-[0.78rem] text-[rgb(220,38,38)]">
              {err}
            </div>
          )}
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-[var(--color-bdr)] px-5 py-3">
          <Btn onClick={onClose} variant="ghost">Cancel</Btn>
          <Btn onClick={submit} variant="primary" disabled={busy || !form.name || !form.slug}>
            {busy ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Btn>
        </footer>
      </div>
      <style>{`
        .admin-input {
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--color-bdr);
          background: var(--color-bg2);
          color: var(--color-txt);
          font-size: 0.86rem;
          outline: none;
        }
        .admin-input:focus {
          border-color: var(--color-blu);
          box-shadow: 0 0 0 3px rgba(59,130,246,.18);
        }
      `}</style>
    </div>
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

  if (!open) return null

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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-bg)] shadow-xl"
      >
        <header className="border-b border-[var(--color-bdr)] px-5 py-4">
          <h3 className="text-[1.02rem] font-bold text-[var(--color-txt)]">
            Bulk upload companies
          </h3>
          <p className="mt-1 text-[0.78rem] text-[var(--color-txt2)]">
            Drop a JSON file or paste an array of company objects.{' '}
            <code className="rounded bg-[var(--color-bg2)] px-1 py-0.5 text-[0.72rem]">
              {`{ name, slug, ats, website?, active? }`}
            </code>
            . Extra fields (jobsApi, jobCount, …) are ignored.
          </p>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {!result ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg2)] px-3 py-1.5 text-[0.78rem] font-semibold text-[var(--color-txt)] hover:bg-[var(--color-bg3)]">
                  📁 Choose JSON file
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </label>
                {filename && (
                  <span className="text-[0.78rem] text-[var(--color-txt2)]">
                    {filename}
                  </span>
                )}
                {text && (
                  <Btn size="xs" variant="ghost" onClick={reset}>Clear</Btn>
                )}
              </div>

              <Field label="Or paste JSON">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={12}
                  className="admin-input font-mono text-[0.78rem]"
                  placeholder={`[\n  {\n    "name": "Codalinc",\n    "slug": "codalinc",\n    "ats": "greenhouse",\n    "website": "https://codal.com",\n    "active": true\n  }\n]`}
                />
              </Field>

              {parsed && !progress && (
                <div className="rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg2)] px-3 py-2 text-[0.78rem] text-[var(--color-txt)]">
                  Parsed <b>{parsed.length}</b> compan{parsed.length === 1 ? 'y' : 'ies'} — ready to upload.
                  {parsed.length > 250 && (
                    <span className="ml-1 text-[var(--color-txt2)]">
                      (will upload in {Math.ceil(parsed.length / 250)} batches of 250)
                    </span>
                  )}
                </div>
              )}
              {progress && (
                <div className="rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg2)] px-3 py-2">
                  <div className="mb-1.5 flex items-center justify-between text-[0.78rem]">
                    <span className="text-[var(--color-txt)]">
                      Uploading batch {progress.batch || 1}
                      {progress.totalBatches ? ` / ${progress.totalBatches}` : ''}…
                    </span>
                    <span className="font-mono tabular-nums text-[var(--color-txt2)]">
                      {progress.processed}/{progress.total}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bdr)]">
                    <div
                      className="h-full bg-[var(--color-blu)] transition-all"
                      style={{
                        width: `${progress.total ? Math.round((progress.processed / progress.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              {parseError && (
                <div className="rounded-lg border border-[rgba(245,158,11,.3)] bg-[rgba(245,158,11,.08)] px-3 py-2 text-[0.78rem] text-[rgb(180,83,9)]">
                  Could not parse JSON. Expected an array or {`{ companies: [...] }`}.
                </div>
              )}
              {err && (
                <div className="rounded-lg border border-[rgba(239,68,68,.3)] bg-[rgba(239,68,68,.08)] px-3 py-2 text-[0.78rem] text-[rgb(220,38,38)]">
                  {err}
                </div>
              )}
            </>
          ) : (
            <BulkResultView result={result} />
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-[var(--color-bdr)] px-5 py-3">
          <Btn onClick={close} variant="ghost" disabled={busy}>
            {result ? 'Close' : 'Cancel'}
          </Btn>
          {!result && (
            <Btn onClick={submit} variant="primary" disabled={busy || !parsed}>
              {busy ? 'Uploading…' : `Upload ${parsed ? parsed.length : 0}`}
            </Btn>
          )}
          {result && (
            <Btn onClick={reset} variant="primary">Upload more</Btn>
          )}
        </footer>
      </div>
      <style>{`
        .admin-input {
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--color-bdr);
          background: var(--color-bg2);
          color: var(--color-txt);
          font-size: 0.86rem;
          outline: none;
        }
        .admin-input:focus {
          border-color: var(--color-blu);
          box-shadow: 0 0 0 3px rgba(59,130,246,.18);
        }
      `}</style>
    </div>
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
    gray: 'var(--color-txt)',
    green: 'rgb(22,163,74)',
    amber: 'rgb(217,119,6)',
    red: 'rgb(220,38,38)',
  }[tone] || 'var(--color-txt)'
  return (
    <div className="rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg2)] py-2">
      <div className="text-[1.2rem] font-extrabold tabular-nums" style={{ color: palette }}>
        {value ?? 0}
      </div>
      <div className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[var(--color-txt2)]">
        {label}
      </div>
    </div>
  )
}

function DetailList({ title, tone, rows }) {
  return (
    <details className="rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg2)]" open>
      <summary className="cursor-pointer px-3 py-2 text-[0.8rem] font-bold text-[var(--color-txt)]">
        {title}
      </summary>
      <ul className="max-h-48 space-y-1 overflow-y-auto px-3 pb-3 text-[0.76rem]">
        {rows.map((r) => (
          <li key={`${r.index}-${r.slug || 'x'}`} className="flex justify-between gap-2">
            <span className="font-mono text-[var(--color-txt)]">
              [{r.index}] {r.slug || '—'}
            </span>
            <span
              className="truncate text-right"
              style={{ color: tone === 'red' ? 'rgb(220,38,38)' : 'rgb(180,83,9)' }}
            >
              {r.reason || '—'}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[0.74rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-txt2)]">
          {label}
        </span>
        {hint && <span className="text-[0.7rem] text-[var(--color-txt2)]">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

// ----------------------------------------------------------------------
// Main page
// ----------------------------------------------------------------------

export default function AdminSection() {
  const { user, addToast } = useAppStore()

  // Hooks must run before any early returns — admin gate uses Navigate below.

  const [overview, setOverview] = useState(null)
  const [usage, setUsage] = useState(null)
  const [companies, setCompanies] = useState([])
  const [runs, setRuns] = useState([])
  const [syncStatus, setSyncStatus] = useState({ running: false, activeRun: null })

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

  const loadUsage = useCallback(async ({ fresh = false } = {}) => {
    try {
      const r = await getUsageAggregate({ fresh })
      setUsage(r)
    } catch (e) {
      console.warn('admin usage:', e)
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
        addToast?.('error', '⚠️ Failed to load companies')
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

  const loadSyncStatus = useCallback(async () => {
    try {
      const r = await getSyncStatus()
      setSyncStatus(r)
    } catch (e) { /* status is best-effort */ void e }
  }, [])

  // initial fan-out (companies loads via the filter/cursor effect below)
  useEffect(() => {
    if (!user?.isAdmin) return
    setLoading(true)
    Promise.all([loadOverview(), loadUsage(), loadRuns(), loadSyncStatus()])
      .finally(() => setLoading(false))
  }, [user?.isAdmin, loadOverview, loadUsage, loadRuns, loadSyncStatus])

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

  // Track which page/cursor is currently shown so the polling tick can read
  // the latest value without restarting the interval every time the user
  // pages through the table.
  const cursorRef = useRef(null)
  const pageIdxRef = useRef(0)
  useEffect(() => { cursorRef.current = cursors[pageIdx] || null }, [cursors, pageIdx])
  useEffect(() => { pageIdxRef.current = pageIdx }, [pageIdx])

  // While a background sync is running we only poll the status endpoint
  // (cheap — one in-memory check on the backend). Companies/runs/overview
  // are refreshed exactly once when the sync transitions running → idle,
  // not on every tick. Previously this fan-out fired ~250×/sec because the
  // interval delay constant was undefined.
  const wasRunningRef = useRef(false)
  useEffect(() => {
    const wasRunning = wasRunningRef.current
    wasRunningRef.current = syncStatus.running

    if (syncStatus.running) {
      const id = setInterval(() => { loadSyncStatus() }, SYNC_STATUS_POLL_MS)
      return () => clearInterval(id)
    }

    // Just finished — pull fresh counts + runs + the current company page
    // exactly once so the UI reflects the new state.
    if (wasRunning) {
      loadRuns()
      loadOverview({ fresh: true })
      loadCompanies({ cursor: cursorRef.current, pageIndex: pageIdxRef.current })
    }
    return undefined
  }, [syncStatus.running, loadSyncStatus, loadRuns, loadOverview, loadCompanies])

  // ----- actions -----
  const onCreateOrUpdate = async (form, isEdit) => {
    if (isEdit) {
      const { name, website, active } = form
      const res = await updateCompany(form.slug, { name, website, active })
      setCompanies((list) =>
        list.map((c) => (c.slug === form.slug ? { ...c, ...res.company } : c)),
      )
      addToast?.('success', `✅ Updated ${form.name}`)
    } else {
      const res = await createCompany(form)
      setCompanies((list) => [res.company, ...list])
      addToast?.('success', `✅ Added ${form.name}`)
      loadOverview({ fresh: true })
    }
  }

  const onDelete = async (slug) => {
    if (!window.confirm(`Delete company "${slug}"? Existing jobs won't be removed.`)) return
    try {
      await deleteCompany(slug)
      setCompanies((list) => list.filter((c) => c.slug !== slug))
      addToast?.('success', '✅ Company deleted')
      loadOverview({ fresh: true })
    } catch (e) {
      addToast?.('error', `⚠️ ${e?.message || 'Delete failed'}`)
    }
  }

  const onBulkUpload = async (companies, onProgress) => {
    const r = await bulkCreateCompanies(companies, { onProgress })
    const { summary } = r
    if (summary.created > 0) {
      addToast?.(
        'success',
        `✅ Created ${summary.created} compan${summary.created === 1 ? 'y' : 'ies'}`,
      )
      loadCompanies()
      loadOverview({ fresh: true })
    } else if (summary.failed > 0) {
      addToast?.('error', `⚠️ ${summary.failed} failed`)
    } else if (summary.skipped > 0) {
      addToast?.('info', `ℹ️ ${summary.skipped} skipped (already exist)`)
    }
    return r
  }

  const onSyncAll = async () => {
    try {
      await syncAll({})
      addToast?.('info', '⏳ Sync started in the background')
      loadSyncStatus()
    } catch (e) {
      addToast?.('error', `⚠️ ${e?.message || 'Could not start sync'}`)
    }
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

  const sortedUsage = useMemo(() => {
    const tools = usage?.tools || {}
    return Object.entries(tools).sort((a, b) => b[1] - a[1])
  }, [usage])

  // Gate the whole page on the admin claim AFTER hooks have run.
  if (!user) return null
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div>
      <SectionHeader
        badge="ADMIN"
        badgeColor="white"
        badgeBg="var(--color-prp)"
        title="Admin Console"
        subtitle="Manage companies that feed the job board, trigger syncs, and watch usage."
        actions={
          <Btn onClick={onSyncAll} variant="primary" disabled={syncStatus.running}>
            {syncStatus.running ? '⏳ Sync running…' : '⟳ Sync All'}
          </Btn>
        }
      />

      {/* ---------- KPIs ---------- */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { ic: '👥', lbl: 'Users', val: overview?.users?.total, sub: 'Signed up' },
          { ic: '🏢', lbl: 'Companies', val: overview?.companies?.total, sub: `${overview?.companies?.active || 0} active` },
          { ic: '💼', lbl: 'Active Jobs', val: overview?.jobs?.active, sub: 'Across all companies' },
          {
            ic: '⟳',
            lbl: 'Last Sync',
            val: overview?.latestRun?.finishedAt ? fmtRelative(overview.latestRun.finishedAt) : '—',
            sub: overview?.latestRun
              ? `+${overview.latestRun.jobsAdded} ~${overview.latestRun.jobsUpdated} −${overview.latestRun.jobsExpired}`
              : 'No syncs yet',
            isText: true,
          },
          {
            ic: '🧪',
            lbl: 'Tool Calls',
            val: usage?.total,
            sub: `${usage?.userCount || 0} users tracked`,
          },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.lbl}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.04 }}
            className="rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-bg)] px-4 py-3"
          >
            <div className="mb-1 text-[1.1rem]">{kpi.ic}</div>
            <div className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[var(--color-txt2)]">
              {kpi.lbl}
            </div>
            <div className={`mt-0.5 ${kpi.isText ? 'text-[0.98rem]' : 'text-[1.4rem]'} font-extrabold leading-tight text-[var(--color-txt)]`}>
              {kpi.isText ? (kpi.val ?? '—') : fmtNumber(kpi.val)}
            </div>
            <div className="mt-0.5 text-[0.72rem] text-[var(--color-txt2)]">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ---------- Tool usage ---------- */}
      <Card
        title="Tool usage — all users"
        action={
          <Btn onClick={() => loadUsage({ fresh: true })} size="xs" variant="ghost">↻ Refresh</Btn>
        }
      >
        {sortedUsage.length === 0 ? (
          <p className="text-[0.84rem] text-[var(--color-txt2)]">No usage tracked yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {sortedUsage.map(([key, count]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg2)] px-3 py-2"
              >
                <span className="truncate font-mono text-[0.78rem] text-[var(--color-txt)]">{key}</span>
                <span className="ml-2 font-extrabold tabular-nums text-[var(--color-blu)]">
                  {fmtNumber(count)}
                </span>
              </div>
            ))}
          </div>
        )}
        {usage?.computedAt && (
          <p className="mt-3 text-[0.7rem] text-[var(--color-txt2)]">
            Computed {fmtRelative(usage.computedAt)} {usage.cached ? '(cached)' : ''}
          </p>
        )}
      </Card>

      {/* ---------- Companies ---------- */}
      <Card
        title={
          overview?.companies?.total != null
            ? `Companies (${fmtNumber(overview.companies.total)})`
            : 'Companies'
        }
        action={
          <>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or slug…"
              className="w-44 rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg2)] px-3 py-1.5 text-[0.78rem] text-[var(--color-txt)]"
            />
            <select
              value={filterAts}
              onChange={(e) => setFilterAts(e.target.value)}
              className="rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg2)] px-2 py-1.5 text-[0.78rem]"
            >
              <option value="">All ATS</option>
              {ATS_OPTIONS.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg2)] px-2 py-1.5 text-[0.78rem]"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Btn onClick={() => setBulkOpen(true)}>📥 Bulk upload</Btn>
            <Btn variant="primary" onClick={() => { setModalInitial(null); setModalOpen(true) }}>
              + Add company
            </Btn>
          </>
        }
        padding={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[0.82rem]">
            <thead>
              <tr className="border-b border-[var(--color-bdr)] text-[0.66rem] uppercase tracking-[0.08em] text-[var(--color-txt2)]">
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
                  <td colSpan={7} className="px-4 py-6 text-center text-[var(--color-txt2)]">
                    {loading || companiesLoading
                      ? 'Loading…'
                      : debouncedSearch
                        ? `No companies match “${debouncedSearch}”.`
                        : 'No companies yet. Click “Add company”.'}
                  </td>
                </tr>
              )}
              {companies.map((c) => (
                <tr key={c.slug} className="border-b border-[var(--color-bdr)] last:border-b-0">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-[var(--color-txt)]">{c.name}</div>
                    <div className="text-[0.7rem] text-[var(--color-txt2)]">
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
                  <td className="px-2 py-2.5 font-mono text-[0.76rem] text-[var(--color-txt2)]">{c.ats}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{fmtNumber(c.jobCount || 0)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{fmtNumber(c.indiaJobCount || 0)}</td>
                  <td className="px-2 py-2.5">
                    <div className="text-[var(--color-txt)]">{fmtRelative(c.lastSyncAt)}</div>
                    {c.lastError && (
                      <div className="text-[0.7rem] text-[rgb(220,38,38)]" title={c.lastError}>
                        {c.lastError.length > 36 ? c.lastError.slice(0, 36) + '…' : c.lastError}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    {c.active ? <Pill tone="green">active</Pill> : <Pill tone="gray">inactive</Pill>}
                    {c.syncFailures > 0 && (
                      <span className="ml-1"><Pill tone="red">{c.syncFailures} fail</Pill></span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Btn
                        size="xs"
                        variant="ghost"
                        onClick={() => { setModalInitial(c); setModalOpen(true) }}
                        title="Edit"
                      >
                        ✎
                      </Btn>
                      <Btn
                        size="xs"
                        variant="danger"
                        onClick={() => onDelete(c.slug)}
                        title="Delete"
                      >
                        ✕
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {(companies.length > 0 || pageIdx > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-bdr)] px-4 py-3 text-[0.78rem] text-[var(--color-txt2)] sm:px-5">
            <div className="flex items-center gap-2">
              {companies.length > 0 ? (
                <span>
                  Showing <b className="text-[var(--color-txt)]">{rangeFrom}</b>–
                  <b className="text-[var(--color-txt)]">{rangeTo}</b>
                  {debouncedSearch && (
                    <span className="ml-1 text-[var(--color-txt2)]">
                      matching “{debouncedSearch}”
                    </span>
                  )}
                </span>
              ) : (
                <span>No results on this page.</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[0.74rem]">
                Rows:
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-md border border-[var(--color-bdr)] bg-[var(--color-bg2)] px-2 py-1 text-[0.78rem] text-[var(--color-txt)]"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-1">
                <Btn
                  size="xs"
                  onClick={onPrevPage}
                  disabled={pageIdx === 0 || companiesLoading}
                  title="Previous"
                >‹ Prev</Btn>
                <span className="px-2 text-[var(--color-txt)] tabular-nums">
                  Page {pageIdx + 1}
                </span>
                <Btn
                  size="xs"
                  onClick={onNextPage}
                  disabled={!hasMore || companiesLoading || !!debouncedSearch}
                  title={debouncedSearch ? 'Pagination disabled while searching' : 'Next'}
                >Next ›</Btn>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ---------- Recent sync runs ---------- */}
      <Card
        title="Recent sync runs"
        action={
          <Btn size="xs" variant="ghost" onClick={loadRuns}>↻ Refresh</Btn>
        }
        padding={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[0.82rem]">
            <thead>
              <tr className="border-b border-[var(--color-bdr)] text-[0.66rem] uppercase tracking-[0.08em] text-[var(--color-txt2)]">
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
                  <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-txt2)]">
                    No sync runs recorded yet.
                  </td>
                </tr>
              )}
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-bdr)] last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-[0.76rem] text-[var(--color-txt)]">{r.provider}</td>
                  <td className="px-2 py-2.5 text-[var(--color-txt2)]">
                    {fmtDateTime(r.finishedAt)}
                    {r.elapsedMs ? (
                      <span className="ml-1 text-[0.7rem]">· {(r.elapsedMs / 1000).toFixed(1)}s</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{r.companiesScanned ?? 0}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{r.companiesSkipped ?? 0}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">
                    <span className="text-[rgb(22,163,74)]">+{r.jobsAdded || 0}</span>{' '}
                    <span className="text-[var(--color-txt2)]">~{r.jobsUpdated || 0}</span>{' '}
                    <span className="text-[rgb(220,38,38)]">−{r.jobsExpired || 0}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {Array.isArray(r.errors) && r.errors.length > 0 ? (
                      <Pill tone="red">{r.errors.length}</Pill>
                    ) : (
                      <Pill tone="green">0</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
