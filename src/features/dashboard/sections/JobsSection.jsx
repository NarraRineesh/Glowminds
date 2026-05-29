import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useJobStore from '@/store/jobStore'
import useProfileStore from '@/store/profileStore'
import Loader from '@/components/Loader'
import { JobGridSkeleton } from '@/features/dashboard/components/JobCardSkeleton'
import { JobMetaItem, JobMetaRow } from '@/features/dashboard/components/JobMeta'
import '@/styles/dashboard.css'
import '@/styles/jobs.css'
import '@/styles/cards.css'
import '@/styles/forms.css'

const JF = ['All', 'Best Match', 'Full-time', 'Contract', 'New Today']
const PER_PAGE = 10

function buildFilters(activeF, typeFilter) {
  const filters = {}
  if (activeF === 'Best Match') filters.minMatch = 80
  else if (activeF === 'Full-time') filters.type = 'Full-time'
  else if (activeF === 'Contract') filters.type = 'Contract'
  else if (activeF === 'New Today') filters.newToday = true
  if (typeFilter) filters.type = typeFilter
  return filters
}

export default function JobsSection() {
  const navigate = useNavigate()
  const { jobs, pagination, loading, error, fetchJobs, saveJob, unsaveJob, isJobSaved, loadSavedJobs, queryUsed, skillTerms } = useJobStore()
  const loadProfile = useProfileStore((s) => s.load)
  const [activeF, setActiveF] = useState('All')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const filters = useMemo(() => buildFilters(activeF, typeFilter), [activeF, typeFilter])
  const filterSig = useMemo(
    () => JSON.stringify({ search, filters }),
    [search, filters],
  )
  const prevFilterSig = useRef(filterSig)

  useEffect(() => {
    if (prevFilterSig.current === filterSig) return
    prevFilterSig.current = filterSig
    setPage(1)
  }, [filterSig])

  useEffect(() => {
    loadProfile({ force: false }).then(() => {
      fetchJobs({ search, page, pageSize: PER_PAGE, filters })
      loadSavedJobs()
    })
  }, [fetchJobs, loadSavedJobs, loadProfile, search, page, filters])

  const handleSearch = (e) => {
    e?.preventDefault?.()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const isInitialLoad = loading && jobs.length === 0
  const isRefreshing = loading && jobs.length > 0
  const totalPages = pagination.totalPages || 1
  const totalResults = pagination.total ?? jobs.length
  const hasActiveSearch = Boolean(search.trim())
  const subtitleQuery = hasActiveSearch ? search.trim() : queryUsed

  const openJob = (j) => navigate(`/dashboard/jobs/${encodeURIComponent(j.id)}`)

  const toggleSave = async (j, e) => {
    e?.stopPropagation?.()
    if (isJobSaved(j.id)) await unsaveJob(j.id)
    else await saveJob(j)
  }

  return (
    <div className="jobs-section">
      <div className="mb-4">
        <div className="dsh-title">Job Board 💼</div>
        <div className="dsh-sub">
          <span className="pulse" />
          {isInitialLoad ? (
            <>Finding jobs{hasActiveSearch ? ` for "${search.trim()}"` : ' matched to your profile'}…</>
          ) : subtitleQuery ? (
            <>
              {hasActiveSearch ? 'Results for' : 'Matched to'}{' '}
              <strong>{subtitleQuery}</strong>
              {skillTerms.length > 0 && !hasActiveSearch ? ` · ${skillTerms.slice(0, 4).join(', ')}` : ''}
              {' · '}
            </>
          ) : (
            <>Live jobs from top company career sites · </>
          )}
          {!isInitialLoad && (
            <>
              {totalResults} {totalResults === 1 ? 'result' : 'results'}
              {pagination.from ? ` · showing ${pagination.from}–${pagination.to}` : ''}
            </>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="fbar">
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 260px', minWidth: 0 }}>
          <div className="jobs-search-wrap">
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '.82rem', opacity: .5, pointerEvents: 'none' }}>🔍</span>
            <input
              className="fi"
              style={{ paddingLeft: 32, paddingRight: searchInput ? 36 : 10, height: 36, fontSize: '.82rem', width: '100%' }}
              placeholder="Search jobs, skills, companies…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              aria-label="Search jobs"
            />
            {searchInput && (
              <button type="button" className="jobs-search-clear" onClick={clearSearch} aria-label="Clear search">✕</button>
            )}
          </div>
          <button type="submit" className="btn btn-p" disabled={loading} style={{ height: 36, padding: '0 16px', fontSize: '.78rem', whiteSpace: 'nowrap', minWidth: 72, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {loading ? <Loader variant="spinner" size={14} /> : 'Search'}
          </button>
        </form>

        <div style={{ width: 1, height: 24, background: 'var(--color-bdr)', flexShrink: 0 }} className="hidden sm:block" />

        <select className="fsl" style={{ height: 36, padding: '0 28px 0 10px', fontSize: '.78rem', minWidth: 120, background: 'var(--color-bg3)', border: '1px solid var(--color-bdr)', borderRadius: 8, opacity: loading ? .6 : 1 }} value={typeFilter} disabled={loading} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option><option>Full-time</option><option>Contract</option><option>Part-time</option>
        </select>

        <div className="fbar-pills" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {JF.map(f => (
            <button key={f} type="button" disabled={loading} onClick={() => setActiveF(f)}
              style={{ padding: '5px 12px', fontSize: '.74rem', fontWeight: 600, borderRadius: 8, border: '1px solid', cursor: loading ? 'not-allowed' : 'pointer', transition: '.15s', opacity: loading ? .55 : 1,
                background: f === activeF ? 'rgba(56,139,253,.18)' : 'transparent',
                borderColor: f === activeF ? 'rgba(56,139,253,.35)' : 'var(--color-bdr)',
                color: f === activeF ? 'var(--color-blu2)' : 'var(--color-txt2)',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isInitialLoad && <JobGridSkeleton count={PER_PAGE} />}

      {error && !loading && (
        <div className="jobs-error-banner">
          ⚠️ {error}
          <div><button type="button" className="btn btn-o btn-sm" onClick={() => fetchJobs({ search, page: page, pageSize: PER_PAGE, filters, force: true })}>Retry</button></div>
        </div>
      )}

      {!isInitialLoad && (
        <>
          {isRefreshing && (
            <div className="jobs-loading-bar" role="progressbar" aria-label="Updating results">
              <div className="jobs-loading-bar__fill" />
            </div>
          )}

          <div className={`jobs-grid-wrap${isRefreshing ? ' is-refreshing' : ''}`}>
          <div className="rg-j">
            {jobs.length === 0 && (
              <div className="jobs-empty">
                <div className="jobs-empty-icon">🔍</div>
                <h3>No jobs found</h3>
                <p>
                  {hasActiveSearch
                    ? `Nothing matched "${search.trim()}". Try a shorter keyword like "${search.trim().split(/\s+/)[0]}" or remove filters.`
                    : 'No jobs match your current filters. Try clearing filters or updating your profile skills.'}
                </p>
                <div className="jobs-empty-actions">
                  {hasActiveSearch && (
                    <button type="button" className="btn btn-o btn-sm" onClick={clearSearch}>Clear search</button>
                  )}
                  {(activeF !== 'All' || typeFilter) && (
                    <button type="button" className="btn btn-gh btn-sm" onClick={() => { setActiveF('All'); setTypeFilter('') }}>Reset filters</button>
                  )}
                </div>
              </div>
            )}
            {jobs.map(j => (
              <div key={j.id} className={`jc${j.isNew ? ' new-j' : ''}`} onClick={() => openJob(j)}>
                <div className="jch">
                  <div className="jc-logo">{j.logo}</div>
                  <div className="jch-body">
                    <div className="jc-title">{j.title}</div>
                    <JobMetaRow>
                      {(j.company || j.co) && <JobMetaItem icon="🏢">{j.company || j.co}</JobMetaItem>}
                      {(j.location || j.loc) && (
                        <JobMetaItem icon={j.remote ? '🌐' : '📍'}>{j.location || j.loc}</JobMetaItem>
                      )}
                      {j.type && <JobMetaItem icon="💼">{j.type}</JobMetaItem>}
                      {j.posted && <JobMetaItem icon="🕒">{j.posted}</JobMetaItem>}
                    </JobMetaRow>
                  </div>
                </div>
                <div className="jc-match-row">
                  <span className="jc-meta-ico" aria-hidden>🎯</span>
                  Match: <strong className={j.match >= 90 ? 'text-[--color-grn]' : j.match >= 80 ? 'text-[--color-blu2]' : 'text-[--color-gold]'}>{j.match}%</strong>
                </div>
                <div className="match-bar"><div className="match-fill" style={{ width: `${j.match}%` }} /></div>
                <div className="jc-tags">
                  {j.tags.slice(0, 3).map(t => <span key={t} className="tag tb">{t}</span>)}
                </div>
                <div className="jc-footer">
                  <JobMetaItem
                    icon="💰"
                    className={`jc-meta--salary${!(j.salary || j.sal) ? ' is-muted' : ''}`}
                  >
                    {j.salary || j.sal || 'Not listed'}
                  </JobMetaItem>
                  <div className="jc-footer-actions">
                    <button type="button" className="btn btn-gh btn-xs" onClick={(e) => toggleSave(j, e)}>{isJobSaved(j.id) ? '❤️' : '🤍'}</button>
                    <button type="button" className="btn btn-p btn-xs" onClick={(e) => { e.stopPropagation(); openJob(j) }}>View</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>

          {/* Pagination */}
          {totalResults > 0 && (
            <div className="jobs-pagination">
              <button type="button" className="btn btn-gh btn-sm" disabled={page <= 1 || loading}
                style={{ opacity: page <= 1 ? .4 : 1 }}
                onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`d${i}`} style={{ color: 'var(--color-muted)', fontSize: '.78rem', padding: '0 2px' }}>…</span>
                  ) : (
                    <button key={p} type="button" disabled={loading} onClick={() => setPage(p)}
                      className={`jobs-pagination-btn${p === page ? ' is-active' : ''}`}>
                      {p}
                    </button>
                  )
                )}

              <button type="button" className="btn btn-gh btn-sm" disabled={page >= totalPages || loading}
                style={{ opacity: page >= totalPages ? .4 : 1 }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next →</button>

              <span className="jobs-pagination-meta">
                Page {page} of {totalPages} · {totalResults} jobs
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
