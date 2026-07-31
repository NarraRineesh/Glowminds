import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useJobStore from '@/store/jobStore'
import useProfileStore from '@/store/profileStore'
import ProUpgradeInline from '@/components/ProUpgradeInline'
import { isProUpgradeRequired } from '@/utils/proErrors'
import { profileReadyForJobMatches } from '@/utils/jobMatchProfile'
import Loader from '@/components/Loader'
import { JobGridSkeleton } from '@/features/dashboard/components/JobCardSkeleton'
import { JobMetaItem, JobMetaRow } from '@/features/dashboard/components/JobMeta'
import {
  Toolbar,
  FilterBar,
  StatStrip,
  SplitRail,
  SectionCard,
  AiRail,
} from '@/features/dashboard/components/v2'
import AppIcon from '@/components/icons/AppIcon'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Progress,
  Select,
  StatusBadge,
  cn,
} from '@/components/ui'

const BOARD_TABS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'browse', label: 'Browse' },
  { id: 'saved', label: 'Saved' },
]

const QUICK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'remote', label: 'Remote' },
  { id: 'match', label: '≥85% match' },
  { id: 'new', label: 'New today' },
]

const PER_PAGE = 12

const COUNTRY_OPTIONS = [
  { value: '', label: 'All countries' },
  { value: 'india', label: 'India' },
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'canada', label: 'Canada' },
  { value: 'germany', label: 'Germany' },
  { value: 'singapore', label: 'Singapore' },
  { value: 'australia', label: 'Australia' },
  { value: 'remote', label: 'Remote' },
]

const SORT_OPTIONS = [
  { value: '', label: 'Sort: Relevance' },
  { value: 'publishedDesc', label: 'Sort: Newest' },
  { value: 'publishedAsc', label: 'Sort: Oldest' },
]

const CO_HUES = [210, 190, 250, 30, 160, 340]

function buildFilters(quick, typeFilter, { company = '', country = '', sort = '' } = {}) {
  const filters = {}
  if (quick === 'match') filters.minMatch = 85
  else if (quick === 'new') filters.newToday = true
  else if (quick === 'remote') filters.country = 'remote'

  if (typeFilter) filters.type = typeFilter
  if (company.trim()) filters.company = company.trim()
  if (country && quick !== 'remote') filters.country = country
  if (sort === 'publishedAsc' || sort === 'publishedDesc') filters.sort = sort
  return filters
}

function matchTone(match) {
  if (match >= 90) return 'text-emerald-500'
  if (match >= 80) return 'text-primary'
  return 'text-amber-500'
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
  const { jobs, pagination, loading, error, fetchJobs, saveJob, unsaveJob, isJobSaved, loadSavedJobs, savedJobs } = useJobStore()
  const profile = useProfileStore((s) => s.profile)
  const loadProfile = useProfileStore((s) => s.load)

  const [boardTab, setBoardTab] = useState('browse')
  const [quick, setQuick] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [companyInput, setCompanyInput] = useState('')
  const [company, setCompany] = useState('')
  const [country, setCountry] = useState('')
  const [sort, setSort] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)

  const readyForMatches = profileReadyForJobMatches(profile)
  const filters = useMemo(
    () => buildFilters(quick, typeFilter, { company, country, sort }),
    [quick, typeFilter, company, country, sort],
  )
  const filterSig = useMemo(
    () => JSON.stringify({ search, filters }),
    [search, filters],
  )
  const prevFilterSig = useRef(filterSig)
  const bestMatchNeedsProfile = (quick === 'match' || boardTab === 'recommended') && !readyForMatches

  useEffect(() => {
    if (prevFilterSig.current === filterSig) return
    prevFilterSig.current = filterSig
    setPage(1)
  }, [filterSig])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  useEffect(() => {
    loadSavedJobs()
    loadProfile({ force: false }).catch(() => {})
  }, [loadSavedJobs, loadProfile])

  useEffect(() => {
    if (bestMatchNeedsProfile) return
    if (boardTab === 'saved') return
    const nextFilters = boardTab === 'recommended'
      ? { ...filters, minMatch: Math.max(filters.minMatch || 0, 70) }
      : filters
    fetchJobs({ search, page, pageSize: PER_PAGE, filters: nextFilters })
  }, [fetchJobs, search, page, filters, bestMatchNeedsProfile, boardTab])

  const displayJobs = boardTab === 'saved' ? (savedJobs || []) : jobs
  const isSavedBoard = boardTab === 'saved'

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

  const resetFilters = () => {
    setQuick('all')
    setTypeFilter('')
    setCompanyInput('')
    setCompany('')
    setCountry('')
    setSort('')
    setPage(1)
  }

  const isInitialLoad = loading && jobs.length === 0 && !isSavedBoard
  const isRefreshing = loading && jobs.length > 0
  const totalResults = pagination.total ?? jobs.length
  const totalExact = pagination.totalExact !== false && pagination.total != null
  const totalLabel =
    totalExact
      ? `${totalResults}`
      : pagination.hasMore
        ? `${Math.max(jobs.length, pagination.to || 0)}+`
        : `${jobs.length}`
  const canGoNext = pagination.hasMore && !loading
  const hasActiveSearch = Boolean(search.trim())
  const hasExtraFilters = Boolean(
    company || country || sort || typeFilter || quick !== 'all' || hasActiveSearch,
  )

  const avgMatch = useMemo(() => {
    const scored = displayJobs.filter((j) => typeof j.match === 'number' && j.match > 0)
    if (!scored.length) return null
    return Math.round(scored.reduce((a, j) => a + j.match, 0) / scored.length)
  }, [displayJobs])

  const activeFilterTags = useMemo(() => {
    const tags = []
    if (hasActiveSearch) tags.push(`“${search.trim()}”`)
    if (quick === 'remote') tags.push('Remote')
    if (quick === 'match') tags.push('Match ≥85%')
    if (quick === 'new') tags.push('New today')
    if (typeFilter) tags.push(typeFilter)
    if (country && quick !== 'remote') {
      tags.push(COUNTRY_OPTIONS.find((o) => o.value === country)?.label || country)
    }
    if (company) tags.push(company)
    if (sort === 'publishedDesc') tags.push('Newest')
    if (sort === 'publishedAsc') tags.push('Oldest')
    if (boardTab === 'recommended') tags.push('Recommended')
    return tags
  }, [hasActiveSearch, search, quick, typeFilter, country, company, sort, boardTab])

  const openJob = (j) => navigate(`/dashboard/jobs/${encodeURIComponent(j.id)}`)

  const toggleSave = async (j, e) => {
    e?.stopPropagation?.()
    if (isJobSaved(j.id)) await unsaveJob(j.id)
    else await saveJob(j)
  }

  const onQuickChange = (id) => {
    setQuick(id)
    if (id === 'remote') setCountry('')
    if (id === 'match' && boardTab === 'browse') {
      // keep browse; recommended tab is separate
    }
    setPage(1)
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      {!isSavedBoard && (
        <Toolbar
          left={(
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <form onSubmit={handleSearch} className="relative min-w-0 flex-1 sm:max-w-xs">
                <AppIcon name="search" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 opacity-50" />
                <Input
                  className={cn('h-8 pl-8 text-sm', searchInput && 'pr-8')}
                  placeholder="Search roles, companies…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search jobs"
                />
                {searchInput ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-0.5 top-1/2 -translate-y-1/2"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    <AppIcon name="x" className="size-3" />
                  </Button>
                ) : null}
              </form>
              <FilterBar
                options={QUICK_FILTERS}
                value={quick}
                onChange={onQuickChange}
                className="shrink-0"
              />
            </div>
          )}
          right={(
            <>
              <Select
                className="h-8 w-[140px] text-xs"
                value={sort}
                disabled={loading}
                onChange={(e) => { setSort(e.target.value); setPage(1) }}
                aria-label="Sort jobs"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value || 'relevance'} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Button
                type="button"
                size="sm"
                variant={filtersOpen ? 'default' : 'outline'}
                className="h-8"
                onClick={() => setFiltersOpen((v) => !v)}
              >
                Filters
                {(typeFilter || country || company) ? ' ·' : ''}
              </Button>
            </>
          )}
        />
      )}

      {!isSavedBoard && filtersOpen && (
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-3">
          <Select
            className="h-9 w-full text-sm"
            value={typeFilter}
            disabled={loading}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Job type"
          >
            <option value="">All types</option>
            <option>Full-time</option>
            <option>Contract</option>
            <option>Part-time</option>
          </Select>
          <Select
            className="h-9 w-full text-sm"
            value={country}
            disabled={loading || quick === 'remote'}
            onChange={(e) => { setCountry(e.target.value); setPage(1) }}
            aria-label="Filter by country"
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
          <Input
            className="h-9 w-full text-sm"
            placeholder="Company…"
            value={companyInput}
            disabled={loading}
            onChange={(e) => setCompanyInput(e.target.value)}
            onBlur={() => {
              const next = companyInput.trim()
              if (next !== company) {
                setCompany(next)
                setPage(1)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                setCompany(companyInput.trim())
                setPage(1)
              }
            }}
            aria-label="Filter by company"
          />
        </div>
      )}

      <StatStrip
        stats={[
          [
            isSavedBoard ? 'Saved' : boardTab === 'recommended' ? 'Recommended' : 'Results',
            isSavedBoard ? String(displayJobs.length) : totalLabel,
            isSavedBoard
              ? 'Your shortlist'
              : pagination.from
                ? `Showing ${pagination.from}–${pagination.to}`
                : 'Based on filters',
          ],
          [
            'Avg match',
            avgMatch != null ? `${avgMatch}%` : '—',
            readyForMatches ? 'This page' : 'Add skills for match',
          ],
          [
            'Saved',
            String(savedJobs?.length || 0),
            savedJobs?.length ? 'Open Saved tab' : 'None yet',
          ],
          [
            'Page',
            String(page),
            pagination.totalPages ? `of ${pagination.totalPages}` : canGoNext ? 'More available' : 'End of list',
          ],
        ]}
      />

      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {BOARD_TABS.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={boardTab === t.id ? 'default' : 'ghost'}
            className="h-8"
            onClick={() => {
              setBoardTab(t.id)
              if (t.id === 'recommended') setQuick('match')
              else if (t.id === 'browse' && quick === 'match') setQuick('all')
              setPage(1)
            }}
          >
            {t.label}
            {t.id === 'saved' && savedJobs?.length ? ` (${savedJobs.length})` : ''}
          </Button>
        ))}
      </div>

      {error && !loading && !isSavedBoard && (
        isProUpgradeRequired({ message: error, code: 'permission-denied' }) || /pro/i.test(error) ? (
          <ProUpgradeInline message={error} />
        ) : (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchJobs({ search, page, pageSize: PER_PAGE, filters, force: true })}
              >
                Retry
              </Button>
            </div>
          </div>
        )
      )}

      {isInitialLoad ? (
        <JobGridSkeleton count={PER_PAGE} />
      ) : (
        <SplitRail
          main={(
            <SectionCard
              title={isSavedBoard ? 'Saved roles' : boardTab === 'recommended' ? 'Recommended roles' : 'Roles'}
              action={
                <span className="text-[0.68rem] text-muted-foreground">
                  {isSavedBoard
                    ? `${displayJobs.length} saved`
                    : pagination.from
                      ? `${pagination.from}–${pagination.to}${totalExact ? ` of ${totalResults}` : '+'}`
                      : `${displayJobs.length} shown`}
                </span>
              }
            >
              {isRefreshing && !isSavedBoard && (
                <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Updating results">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
                </div>
              )}

              <div className={cn('transition-opacity duration-200', isRefreshing && !isSavedBoard && 'pointer-events-none opacity-60')}>
                {((!isSavedBoard && bestMatchNeedsProfile) || displayJobs.length === 0) ? (
                  <div className="flex flex-col items-center px-4 py-12 text-center">
                    <AppIcon name={bestMatchNeedsProfile && !isSavedBoard ? 'user' : 'search'} className="mb-3 size-10 opacity-40" />
                    <h3 className="text-lg font-bold text-foreground">
                      {isSavedBoard
                        ? 'No saved jobs'
                        : bestMatchNeedsProfile
                          ? 'Update your profile'
                          : 'No jobs found'}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      {isSavedBoard
                        ? 'Save jobs from Browse to revisit them here.'
                        : bestMatchNeedsProfile
                          ? 'Recommended and ≥85% match need skills on your profile.'
                          : hasActiveSearch
                            ? `Nothing matched “${search.trim()}”. Try a shorter keyword or clear filters.`
                            : 'No jobs match your current filters.'}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {isSavedBoard ? (
                        <Button size="sm" onClick={() => setBoardTab('browse')}>Browse jobs</Button>
                      ) : bestMatchNeedsProfile ? (
                        <Button size="sm" onClick={() => navigate('/dashboard/profile')}>Update profile</Button>
                      ) : (
                        <>
                          {hasActiveSearch && (
                            <Button variant="outline" size="sm" onClick={clearSearch}>Clear search</Button>
                          )}
                          {hasExtraFilters && (
                            <Button variant="ghost" size="sm" onClick={resetFilters}>Clear filters</Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {displayJobs.map((j, idx) => {
                      const companyName = j.company || j.co || ''
                      const location = j.location || j.loc || ''
                      const salary = j.salary || j.sal || ''
                      const match = readyForMatches && typeof j.match === 'number' && j.match > 0 ? j.match : null
                      return (
                        <Card
                          key={j.id}
                          className={cn(
                            'cursor-pointer gap-0 py-0 transition-shadow hover:ring-foreground/15',
                            j.isNew && 'ring-1 ring-primary/30',
                          )}
                          onClick={() => openJob(j)}
                        >
                          <CardContent className="space-y-3 p-4">
                            <div className="flex gap-3">
                              <CompanyMark name={companyName} logo={j.logo} tone={idx} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 truncate text-sm font-bold text-foreground">{j.title}</div>
                                  {match != null && (
                                    <Badge
                                      variant="outline"
                                      className={cn('shrink-0 tabular-nums', matchTone(match))}
                                    >
                                      {match}%
                                    </Badge>
                                  )}
                                </div>
                                <JobMetaRow>
                                  {companyName && <JobMetaItem icon="buildings">{companyName}</JobMetaItem>}
                                  {location && (
                                    <JobMetaItem icon={j.remote || quick === 'remote' ? 'globe' : 'map-pin'}>
                                      {location}
                                    </JobMetaItem>
                                  )}
                                  {salary && <JobMetaItem icon="salary">{salary}</JobMetaItem>}
                                  {j.posted && <JobMetaItem icon="clock">{j.posted}</JobMetaItem>}
                                </JobMetaRow>
                              </div>
                            </div>

                            {match != null && (
                              <Progress value={match} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
                            )}

                            {(j.tags?.length > 0 || j.type) && (
                              <div className="flex flex-wrap gap-1.5">
                                {j.type && (
                                  <StatusBadge tone="default" className="text-xs">{j.type}</StatusBadge>
                                )}
                                {(j.tags || []).slice(0, 3).map((t) => (
                                  <StatusBadge key={t} tone="default" className="text-xs">{t}</StatusBadge>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-1 pt-0.5">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => toggleSave(j, e)}
                                aria-label={isJobSaved(j.id) ? 'Unsave job' : 'Save job'}
                              >
                                {isJobSaved(j.id)
                                  ? <AppIcon name="heart" className="size-3.5" weight="fill" />
                                  : <AppIcon name="heart-outline" className="size-3.5" />}
                              </Button>
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); openJob(j) }}>
                                View
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {!isSavedBoard && totalResults > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-border pt-4">
                  <Button variant="ghost" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ← Prev
                  </Button>
                  <Button variant="ghost" size="sm" disabled={!canGoNext} onClick={() => setPage((p) => p + 1)}>
                    Next →
                  </Button>
                  {loading && <Loader variant="spinner" size={14} />}
                </div>
              )}
            </SectionCard>
          )}
          rail={(
            <>
              <SectionCard title="Active filters">
                {activeFilterTags.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activeFilterTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[0.7rem]">{tag}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No filters applied.</p>
                )}
                {hasExtraFilters && (
                  <Button className="mt-3 w-full" variant="outline" size="sm" onClick={resetFilters}>
                    Clear all
                  </Button>
                )}
              </SectionCard>
              <AiRail
                title="Match tip"
                body={
                  readyForMatches
                    ? 'Use Recommended or ≥85% match to surface roles that fit your skills. Save ones worth applying to.'
                    : 'Add technical skills on your profile to unlock match % and Recommended roles.'
                }
                cta={readyForMatches ? 'Open profile' : 'Add skills'}
                onCta={() => navigate('/dashboard/profile')}
              />
            </>
          )}
        />
      )}
    </div>
  )
}
