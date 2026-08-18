import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useJobStore from '@/store/jobStore'
import { getQueryHeader } from '@/services/jobSearch'
import {
  getTopCompanies,
  getTrendingSkills,
} from '@/services/jobsApi'
import Loader from '@/components/Loader'
import { JobGridSkeleton } from '@/features/dashboard/components/JobCardSkeleton'
import {
  SplitRail,
  SectionCard,
} from '@/features/dashboard/components/v2'
import AppIcon from '@/components/icons/AppIcon'
import {
  Button,
  Card,
  CardContent,
  Input,
  StatusBadge,
  cn,
} from '@/components/ui'

const BOARD_TABS = [
  { id: 'browse', label: 'Browse' },
  { id: 'saved', label: 'Saved' },
]

const PER_PAGE = 12
const CO_HUES = [210, 190, 250, 30, 160, 340]

function formatCount(n) {
  const num = Number(n) || 0
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`
  return String(num)
}

function capitalizeLabel(value) {
  const raw = String(
    typeof value === 'string' ? value : value?.skill_name || value?.name || '',
  ).trim()
  if (!raw) return ''
  return raw
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function CompanyMark({ name, logo, tone = 0 }) {
  if (logo && String(logo).length <= 2) {
    return (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
        {logo}
      </div>
    )
  }
  const letter = (name || '?').slice(0, 1).toUpperCase()
  const h = CO_HUES[tone % CO_HUES.length]
  return (
    <div
      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
      style={{
        background: `hsl(${h} 30% 18%)`,
        color: `hsl(${h} 70% 72%)`,
      }}
      aria-hidden
    >
      {letter}
    </div>
  )
}

export default function JobsSection() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { jobs, pagination, loading, error, fetchJobs, saveJob, unsaveJob, isJobSaved, loadSavedJobs, savedJobs } = useJobStore()

  const initialQ = searchParams.get('q') || ''
  const [boardTab, setBoardTab] = useState('browse')
  const [search, setSearch] = useState(initialQ)
  const [searchInput, setSearchInput] = useState(initialQ)
  const [page, setPage] = useState(1)
  const [headerReady, setHeaderReady] = useState(Boolean(initialQ))
  const [companies, setCompanies] = useState([])
  const [skills, setSkills] = useState([])

  const syncQ = (next) => {
    const trimmed = (next || '').trim()
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      if (trimmed) p.set('q', trimmed)
      else p.delete('q')
      return p
    }, { replace: true })
  }

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setSearch((prev) => (prev === q ? prev : q))
    setSearchInput((prev) => (prev === q ? prev : q))
  }, [searchParams])

  useEffect(() => {
    loadSavedJobs()
    loadApps()
    loadProfile().catch(() => {})
  }, [loadSavedJobs, loadApps, loadProfile])

  useEffect(() => {
    if (seeded.current) return
    if (!profile) return
    const role = cleanTargetRole(profile)
    if (!role) return
    seeded.current = true
    setSearchInput(role)
    setSearch(role)
  }, [profile])

  useEffect(() => {
    const urlQ = (new URLSearchParams(window.location.search).get('q') || '').trim()
    if (urlQ) {
      setHeaderReady(true)
      return
    }
    let cancelled = false
    getQueryHeader()
      .then((header) => {
        if (cancelled) return
        const q = String(header?.q || '').trim()
        if (q) {
          setSearch(q)
          setSearchInput(q)
          syncQ(q)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHeaderReady(true)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    Promise.all([
      getTopCompanies({ limit: 8 }).catch(() => []),
      getTrendingSkills({ limit: 10 }).catch(() => []),
    ]).then(([nextCompanies, nextSkills]) => {
      setCompanies(nextCompanies || [])
      setSkills(
        (nextSkills || []).map((row) => {
          const skillName = String(row?.skill_name || row?.name || row || '').trim()
          return {
            ...row,
            skill_name: skillName,
            label: capitalizeLabel(skillName),
          }
        }),
      )
    })
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  useEffect(() => {
    if (!headerReady) return
    if (boardTab === 'saved') return
    fetchJobs({ search, page, pageSize: PER_PAGE })
  }, [fetchJobs, search, page, boardTab, headerReady])

  const displayJobs = boardTab === 'saved' ? (savedJobs || []) : jobs
  const isSavedBoard = boardTab === 'saved'

  const applySearch = (next) => {
    const q = String(next || '').trim()
    setSearchInput(q)
    setSearch(q)
    syncQ(q)
    setPage(1)
    setBoardTab('browse')
  }

  const handleSearch = (e) => {
    e?.preventDefault?.()
    applySearch(searchInput)
  }

  const clearSearch = () => applySearch('')

  const isInitialLoad = (!headerReady || loading) && jobs.length === 0 && !isSavedBoard
  const isRefreshing = loading && jobs.length > 0
  const totalResults = pagination.total ?? jobs.length
  const canGoNext = pagination.hasMore && !loading
  const hasActiveSearch = Boolean(search.trim())

  const openJob = (j) => navigate(`/dashboard/jobs/${encodeURIComponent(j.id)}`)
  const canUseProfileMatch = hasUsableProfile(profile)
  const jobMatch = (j) => (canUseProfileMatch ? buildJobMatchAnalysis(j, profile).score : j.match)
  const alreadyApplied = (j) => apps.some((a) => a.jobId === j.id)
  const freeAppLimit = entitlements?.freeLimits?.applications ?? 10
  const canTrackMore = isPro || apps.length < freeAppLimit

  const handleApply = async (j, e) => {
    e?.stopPropagation?.()
    if (applyingId || alreadyApplied(j)) {
      if (j.url) window.open(j.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (!canTrackMore) {
      addToast('info', `Free plan allows ${freeAppLimit} tracked applications. Upgrade for unlimited tracking.`)
      navigate('/pricing')
      return
    }
    setApplyingId(j.id)
    try {
      const company = j.company || j.co || ''
      const application = await addApp({
        company,
        role: j.title,
        status: APPLICATION_STATUS.APPLIED,
        appliedDate: new Date().toISOString().split('T')[0],
        salary: j.salary || j.sal || '',
        notes: 'Applied via Glowminds',
        logo: j.logo,
        source: j.source || 'ats',
        jobUrl: j.url,
        jobId: j.id,
      })
      if (application) {
        addToast('success', `Applied to ${j.title}${company ? ` at ${company}` : ''}. Added to your tracker.`)
        if (j.url) window.open(j.url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      addToast('error', 'Could not track application — you may have reached the free limit.')
    } finally {
      setApplyingId(null)
    }
  }

  const toggleSave = async (j, e) => {
    e?.stopPropagation?.()
    if (isJobSaved(j.id)) await unsaveJob(j.id)
    else await saveJob(j)
  }

  const pageCount = pagination.totalPages || (totalResults ? Math.max(1, Math.ceil(totalResults / PER_PAGE)) : 1)

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex shrink-0 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Job boards">
          {BOARD_TABS.map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={boardTab === t.id ? 'default' : 'ghost'}
              className="h-8 px-3"
              role="tab"
              aria-selected={boardTab === t.id}
              onClick={() => {
                setBoardTab(t.id)
                setPage(1)
              }}
            >
              {t.label}
              {t.id === 'saved' && savedJobs?.length ? ` (${savedJobs.length})` : ''}
            </Button>
          ))}
        </div>
        {!isSavedBoard && (
          <form onSubmit={handleSearch} className="flex min-w-0 flex-1 gap-2">
            <div className="relative min-w-0 flex-1">
              <AppIcon name="search" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 opacity-50" />
              <Input
                className="h-9 w-full pl-8 text-sm"
                placeholder="Role, skill, or company"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search jobs"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 shrink-0">
              Search
            </Button>
            {hasActiveSearch ? (
              <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0" onClick={clearSearch}>
                Clear
              </Button>
            ) : null}
          </form>
        )}
      </div>

      {error && !loading && !isSavedBoard && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchJobs({ search, page, pageSize: PER_PAGE, force: true })}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {isInitialLoad ? (
        <JobGridSkeleton count={PER_PAGE} />
      ) : (
        <SplitRail
          sticky={false}
          main={(
            <SectionCard title={isSavedBoard ? 'Saved roles' : 'Roles'}>
              {isRefreshing && !isSavedBoard && (
                <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Updating results">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
                </div>
              )}

              <div className={cn('transition-opacity duration-200', isRefreshing && !isSavedBoard && 'pointer-events-none opacity-60')}>
                {displayJobs.length === 0 ? (
                  <div className="flex flex-col items-center px-2 py-8 text-center sm:px-4 sm:py-12">
                    <AppIcon name="search" className="mb-3 size-8 opacity-40 sm:size-10" />
                    <h3 className="text-base font-bold text-foreground sm:text-lg">
                      {isSavedBoard ? 'No saved jobs' : 'No jobs found'}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      {isSavedBoard
                        ? 'Save jobs from Browse to revisit them here.'
                        : hasActiveSearch
                          ? `Nothing matched “${search.trim()}”. Try a shorter keyword.`
                          : 'Try a role, skill, or company name.'}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {isSavedBoard ? (
                        <Button size="sm" onClick={() => setBoardTab('browse')}>Browse jobs</Button>
                      ) : hasActiveSearch ? (
                        <Button variant="outline" size="sm" onClick={clearSearch}>Clear search</Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                    {displayJobs.map((j, idx) => {
                      const companyName = j.company || j.co || ''
                      const location = j.location || j.loc || ''
                      const tags = (j.tags || []).filter((t) => String(t).trim().length > 1).slice(0, 2)
                      return (
                        <Card
                          key={j.id}
                          className={cn(
                            'cursor-pointer gap-0 py-0 transition-colors hover:bg-muted/40',
                            j.isNew && 'ring-1 ring-primary/25',
                          )}
                          onClick={() => openJob(j)}
                        >
                          <CardContent className="p-3.5">
                            <div className="flex gap-3">
                              <CompanyMark name={companyName} logo={j.logo} tone={idx} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-2">
                                  <p className="m-0 line-clamp-2 min-w-0 flex-1 text-[0.9rem] font-semibold leading-snug text-foreground">
                                    {j.title}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="mt-[-2px] shrink-0"
                                    onClick={(e) => toggleSave(j, e)}
                                    aria-label={isJobSaved(j.id) ? 'Unsave job' : 'Save job'}
                                  >
                                    {isJobSaved(j.id)
                                      ? <AppIcon name="heart" className="size-3.5 text-primary" weight="fill" />
                                      : <AppIcon name="heart-outline" className="size-3.5" />}
                                  </Button>
                                </div>
                                <p className="mt-0.5 mb-0 truncate text-xs text-muted-foreground">
                                  {[companyName, location, j.posted].filter(Boolean).join(' · ')}
                                </p>
                                {(j.type || tags.length > 0) && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {j.type && (
                                      <StatusBadge tone="default" className="text-[0.65rem]">{j.type}</StatusBadge>
                                    )}
                                    {tags.map((t) => (
                                      <StatusBadge key={t} tone="default" className="text-[0.65rem]">{capitalizeLabel(t)}</StatusBadge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {!isSavedBoard && totalResults > 0 && (
                <div className="mt-4 flex flex-col items-center gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
                  <p className="m-0 text-xs text-muted-foreground">
                    {pagination.from
                      ? `${pagination.from}–${pagination.to} of ${totalResults.toLocaleString()}`
                      : `${totalResults.toLocaleString()} roles`}
                    {` · page ${page} of ${pageCount}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      ← Prev
                    </Button>
                    <Button variant="ghost" size="sm" disabled={!canGoNext} onClick={() => setPage((p) => p + 1)}>
                      Next →
                    </Button>
                    {loading && <Loader variant="spinner" size={14} />}
                  </div>
                </div>
              )}
            </SectionCard>
          )}
          rail={(
            <>
              <SectionCard title="Top hiring companies">
                {companies.length ? (
                  <ul className="space-y-0.5">
                    {companies.map((c) => (
                      <li key={c.company_slug || c.company_name}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-muted"
                          onClick={() => applySearch(c.company_name)}
                        >
                          <span className="truncate font-medium text-foreground">{capitalizeLabel(c.company_name)}</span>
                          <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                            {formatCount(c.job_count)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No company trends yet.</p>
                )}
              </SectionCard>
              <SectionCard title="Trending skills">
                {skills.length ? (
                  <ul className="space-y-0.5">
                    {skills.map((s) => (
                      <li key={s.skill_name}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-muted"
                          onClick={() => applySearch(s.skill_name)}
                        >
                          <span className="truncate font-medium capitalize text-foreground">{s.label || capitalizeLabel(s.skill_name || s.name)}</span>
                          {s.active_job_count != null && (
                            <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                              {formatCount(s.active_job_count)}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No skill trends yet.</p>
                )}
              </SectionCard>
            </>
          )}
        />
      )}
    </div>
  )
}
