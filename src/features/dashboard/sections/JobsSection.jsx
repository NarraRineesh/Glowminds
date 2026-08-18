import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useJobStore from '@/store/jobStore'
import useAppStore from '@/store/authStore'
import useTrackerStore from '@/store/trackerStore'
import useProfileStore from '@/store/profileStore'
import useEntitlements from '@/hooks/useEntitlements'
import useIsPro from '@/hooks/useIsPro'
import { getQueryHeader } from '@/services/jobSearch'
import {
  getTopCompanies,
  getTrendingSkills,
} from '@/services/jobsApi'
import { APPLICATION_STATUS } from '@/constants/schema'
import { buildJobMatchAnalysis, canShowJobMatch, HIGH_MATCH_THRESHOLD, matchScoreTone } from '@/utils/jobMatchAnalysis'
import { cleanTargetRole } from '@/utils/targetRole'
import {
  filterJobTags,
  inferCountryFromProfile,
  jobMatchesCountry,
  JOB_COUNTRY_OPTIONS,
  persistJobCountry,
  readStoredJobCountry,
} from '@/utils/jobFilters'
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
  Select,
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
  if (logo && /^https?:\/\//.test(logo)) {
    return (
      <img src={logo} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
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
  const { addToast } = useAppStore()
  const { jobs, pagination, loading, error, fetchJobs, saveJob, unsaveJob, isJobSaved, loadSavedJobs, savedJobs } = useJobStore()
  const profile = useProfileStore((s) => s.profile)
  const loadProfile = useProfileStore((s) => s.load)
  const profileLoaded = useProfileStore((s) => s.loaded)
  const jobMatchAlerts = useProfileStore((s) => s.user?.settings?.jobMatchAlerts !== false)
  const { addApp, loadApps, apps } = useTrackerStore()
  const { entitlements } = useEntitlements()
  const isPro = useIsPro()

  const initialQ = searchParams.get('q') || ''
  const [boardTab, setBoardTab] = useState('browse')
  const [search, setSearch] = useState(initialQ)
  const [searchInput, setSearchInput] = useState(initialQ)
  const [page, setPage] = useState(1)
  const [headerReady, setHeaderReady] = useState(Boolean(initialQ))
  const [companies, setCompanies] = useState([])
  const [skills, setSkills] = useState([])
  const [country, setCountry] = useState(() => readStoredJobCountry() ?? 'India')
  const [bestMatchOnly, setBestMatchOnly] = useState(false)
  const [applyingId, setApplyingId] = useState(null)
  const seeded = useRef(Boolean(initialQ))
  const seededCountry = useRef(readStoredJobCountry() != null)
  const seededMatchFilter = useRef(false)

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
    if (!profileLoaded || seededMatchFilter.current) return
    seededMatchFilter.current = true
    if (jobMatchAlerts) setBestMatchOnly(true)
  }, [profileLoaded, jobMatchAlerts])

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
    syncQ(role)
  }, [profile])

  useEffect(() => {
    if (seededCountry.current || !profileLoaded) return
    seededCountry.current = true
    const inferred = inferCountryFromProfile(profile)
    setCountry(inferred)
    persistJobCountry(inferred)
  }, [profile, profileLoaded])

  useEffect(() => {
    const urlQ = (new URLSearchParams(window.location.search).get('q') || '').trim()
    if (urlQ) {
      seeded.current = true
      setHeaderReady(true)
      return
    }
    let cancelled = false
    getQueryHeader()
      .then((header) => {
        if (cancelled) return
        const q = String(header?.q || '').trim()
        if (q) {
          seeded.current = true
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

  const canShowMatch = canShowJobMatch(profile)
  const scoredJobs = useMemo(() => {
    const source = boardTab === 'saved' ? (savedJobs || []) : jobs
    return source
      .filter((j) => jobMatchesCountry(j, country))
      .map((j) => ({ job: j, analysis: buildJobMatchAnalysis(j, profile) }))
  }, [boardTab, savedJobs, jobs, country, profile])

  const visibleJobs = useMemo(() => {
    if (!bestMatchOnly || !canShowMatch) return scoredJobs
    return scoredJobs
      .filter(({ analysis }) => analysis.available && analysis.score >= HIGH_MATCH_THRESHOLD)
      .sort((a, b) => (b.analysis.score ?? 0) - (a.analysis.score ?? 0))
  }, [scoredJobs, bestMatchOnly, canShowMatch])

  const isSavedBoard = boardTab === 'saved'

  const applySearch = (next) => {
    const q = String(next || '').trim()
    seeded.current = true
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

  const handleCountryChange = (next) => {
    setCountry(next)
    persistJobCountry(next)
    setPage(1)
  }

  const handleApply = async (j, e) => {
    e?.stopPropagation?.()
    if (applyingId || alreadyApplied(j)) {
      if (j.url) window.open(j.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (!canTrackMore) {
      addToast('info', `Free plan allows ${freeAppLimit} tracked applications. Upgrade for unlimited tracking.`)
      navigate('/dashboard/plans')
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

  const alreadyApplied = (j) => apps.some((a) => a.jobId === j.id)
  const freeAppLimit = entitlements?.freeLimits?.applications ?? 10
  const canTrackMore = isPro || apps.length < freeAppLimit

  const toggleSave = async (j, e) => {
    e?.stopPropagation?.()
    if (isJobSaved(j.id)) await unsaveJob(j.id)
    else await saveJob(j)
  }

  const isInitialLoad = (!headerReady || loading) && jobs.length === 0 && !isSavedBoard
  const isRefreshing = loading && jobs.length > 0
  const totalResults = pagination.total ?? jobs.length
  const canGoNext = pagination.hasMore && !loading
  const hasActiveSearch = Boolean(search.trim())
  const pageCount = pagination.totalPages || (totalResults ? Math.max(1, Math.ceil(totalResults / PER_PAGE)) : 1)
  const openJob = (j) => navigate(`/dashboard/jobs/${encodeURIComponent(j.id)}`)

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
          <form onSubmit={handleSearch} className="flex min-w-0 flex-1 flex-wrap gap-2">
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
            <Select
              className="h-9 w-[158px] shrink-0 text-sm"
              value={country}
              disabled={loading}
              onChange={(e) => handleCountryChange(e.target.value)}
              aria-label="Country"
            >
              {JOB_COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Button type="submit" size="sm" className="h-9 shrink-0">
              Search
            </Button>
            <Button
              type="button"
              size="sm"
              variant={bestMatchOnly ? 'default' : 'outline'}
              className="h-9 shrink-0"
              onClick={() => setBestMatchOnly((v) => !v)}
            >
              Best Match
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
                {visibleJobs.length === 0 ? (
                  <div className="flex flex-col items-center px-2 py-8 text-center sm:px-4 sm:py-12">
                    <AppIcon name="search" className="mb-3 size-8 opacity-40 sm:size-10" />
                    <h3 className="text-base font-bold text-foreground sm:text-lg">
                      {isSavedBoard ? 'No saved jobs' : 'No jobs found'}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      {isSavedBoard
                        ? 'Save jobs from Browse to revisit them here.'
                        : bestMatchOnly
                          ? 'No roles hit 85% match on this page. Turn off Best Match or add skills.'
                          : hasActiveSearch
                            ? `Nothing matched “${search.trim()}”. Try a shorter keyword.`
                            : 'Try a role, skill, or company name.'}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {isSavedBoard ? (
                        <Button size="sm" onClick={() => setBoardTab('browse')}>Browse jobs</Button>
                      ) : bestMatchOnly ? (
                        <Button variant="outline" size="sm" onClick={() => setBestMatchOnly(false)}>Show all</Button>
                      ) : hasActiveSearch ? (
                        <Button variant="outline" size="sm" onClick={clearSearch}>Clear search</Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                    {visibleJobs.map(({ job: j, analysis }, idx) => {
                      const companyName = j.company || j.co || ''
                      const location = j.location || j.loc || ''
                      const tags = filterJobTags(j.tags).slice(0, 2)
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
                                {analysis.available ? (
                                  <p className={cn('mt-1 mb-0 text-xs font-semibold', matchScoreTone(analysis.score))}>
                                    {analysis.score}% match
                                  </p>
                                ) : (
                                  <p className="mt-1 mb-0 text-xs text-muted-foreground">Add skills to see match</p>
                                )}
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
                                <div className="mt-2 flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    className="h-7 px-2.5 text-xs"
                                    disabled={applyingId === j.id}
                                    onClick={(e) => handleApply(j, e)}
                                  >
                                    {alreadyApplied(j) ? 'Applied' : applyingId === j.id ? 'Applying…' : 'Apply'}
                                  </Button>
                                </div>
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
                    {country ? ` · ${country}` : ''}
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
