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
import AppIcon from '@/components/icons/AppIcon'
import {
  Button,
  ButtonGroup,
  Card,
  CardContent,
  FilterBar,
  Input,
  PageTitle,
  Progress,
  Select,
  StatusBadge,
  cn,
} from '@/components/ui'

const JF = ['All', 'Best Match', 'Full-time', 'Contract', 'New Today']
const PER_PAGE = 12

function buildFilters(activeF, typeFilter) {
  const filters = {}
  if (activeF === 'Best Match') filters.minMatch = 80
  else if (activeF === 'Full-time') filters.type = 'Full-time'
  else if (activeF === 'Contract') filters.type = 'Contract'
  else if (activeF === 'New Today') filters.newToday = true
  if (typeFilter) filters.type = typeFilter
  return filters
}

function matchTone(match) {
  if (match >= 90) return 'text-emerald-500'
  if (match >= 80) return 'text-primary'
  return 'text-amber-500'
}

export default function JobsSection() {
  const navigate = useNavigate()
  const { jobs, pagination, loading, error, fetchJobs, saveJob, unsaveJob, isJobSaved, loadSavedJobs, queryUsed } = useJobStore()
  const profile = useProfileStore((s) => s.profile)
  const loadProfile = useProfileStore((s) => s.load)
  const [activeF, setActiveF] = useState('All')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const readyForMatches = profileReadyForJobMatches(profile)
  const filters = useMemo(() => buildFilters(activeF, typeFilter), [activeF, typeFilter])
  const filterSig = useMemo(
    () => JSON.stringify({ search, filters }),
    [search, filters],
  )
  const prevFilterSig = useRef(filterSig)
  const bestMatchNeedsProfile = activeF === 'Best Match' && !readyForMatches

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
    fetchJobs({ search, page, pageSize: PER_PAGE, filters })
  }, [fetchJobs, search, page, filters, bestMatchNeedsProfile])

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
  const totalResults = pagination.total ?? jobs.length
  const canGoNext = pagination.hasMore && !loading
  const hasActiveSearch = Boolean(search.trim())
  const subtitleQuery = hasActiveSearch ? search.trim() : queryUsed

  const selectFilter = (f) => setActiveF(f)

  const openJob = (j) => navigate(`/dashboard/jobs/${encodeURIComponent(j.id)}`)

  const toggleSave = async (j, e) => {
    e?.stopPropagation?.()
    if (isJobSaved(j.id)) await unsaveJob(j.id)
    else await saveJob(j)
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <PageTitle
        title="Job Board"
        subtitle={
          <>
            <span className="inline-block size-2 shrink-0 rounded-full bg-emerald-500" />
            {isInitialLoad ? (
              <>Loading jobs{hasActiveSearch ? ` for "${search.trim()}"` : ''}…</>
            ) : subtitleQuery ? (
              <>
                Results for <strong>{subtitleQuery}</strong>
                {' · '}
              </>
            ) : (
              <>All active jobs · </>
            )}
            {!isInitialLoad && (
              <>
                {totalResults} {totalResults === 1 ? 'result' : 'results'}
                {pagination.from ? ` · showing ${pagination.from}–${pagination.to}` : ''}
              </>
            )}
          </>
        }
      />

      <FilterBar>
        <form onSubmit={handleSearch} className="flex min-w-0 flex-[1_1_260px] items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <AppIcon name="search" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 opacity-50" />
            <Input
              className={cn('h-9 pl-8 text-sm', searchInput && 'pr-9')}
              placeholder="Search jobs, skills, companies…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              aria-label="Search jobs"
            />
            {searchInput && (
              <Button type="button" variant="ghost" size="icon-sm" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={clearSearch} aria-label="Clear search">
                <AppIcon name="x" className="size-3" />
              </Button>
            )}
          </div>
          <Button type="submit" size="sm" disabled={loading} className="h-9 min-w-[72px] shrink-0">
            {loading ? <Loader variant="spinner" size={14} /> : 'Search'}
          </Button>
        </form>

        <div className="hidden h-6 w-px shrink-0 bg-border sm:block" />

        <Select className="h-9 min-w-[120px] text-sm" value={typeFilter} disabled={loading} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option><option>Full-time</option><option>Contract</option><option>Part-time</option>
        </Select>

        <ButtonGroup className="flex-wrap">
          {JF.map(f => (
            <Button key={f} type="button" variant={f === activeF ? 'default' : 'outline'} size="sm" disabled={loading} onClick={() => selectFilter(f)}>
              {f}
            </Button>
          ))}
        </ButtonGroup>
      </FilterBar>

      {isInitialLoad && <JobGridSkeleton count={PER_PAGE} />}

      {error && !loading && (
        isProUpgradeRequired({ message: error, code: 'permission-denied' }) || /pro/i.test(error) ? (
          <ProUpgradeInline message={error} />
        ) : (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={() => fetchJobs({ search, page: page, pageSize: PER_PAGE, filters, force: true })}>Retry</Button>
          </div>
        </div>
        )
      )}

      {!isInitialLoad && (
        <>
          {isRefreshing && (
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Updating results">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            </div>
          )}

          <div className={cn('transition-opacity duration-200', isRefreshing && 'pointer-events-none opacity-60')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {(bestMatchNeedsProfile || jobs.length === 0) && (
                <div className="col-span-full flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
                  <AppIcon name={bestMatchNeedsProfile ? 'user' : 'search'} className="mb-3 size-10 opacity-40" />
                  <h3 className="text-lg font-bold text-foreground">
                    {bestMatchNeedsProfile ? 'Update your profile' : 'No jobs found'}
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    {bestMatchNeedsProfile
                      ? 'Best matches appear after you update your profile with skills.'
                      : hasActiveSearch
                        ? `Nothing matched "${search.trim()}". Try a shorter keyword like "${search.trim().split(/\s+/)[0]}" or remove filters.`
                        : 'No jobs match your current filters. Try clearing filters or broadening your search.'}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {bestMatchNeedsProfile ? (
                      <Button size="sm" onClick={() => navigate('/dashboard/profile')}>Update profile</Button>
                    ) : (
                      <>
                        {hasActiveSearch && (
                          <Button variant="outline" size="sm" onClick={clearSearch}>Clear search</Button>
                        )}
                        {(activeF !== 'All' || typeFilter) && (
                          <Button variant="ghost" size="sm" onClick={() => { setActiveF('All'); setTypeFilter('') }}>Reset filters</Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
              {!bestMatchNeedsProfile && jobs.map(j => (
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
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                        {j.logo}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-foreground">{j.title}</div>
                        <JobMetaRow>
                          {(j.company || j.co) && <JobMetaItem icon="buildings">{j.company || j.co}</JobMetaItem>}
                          {(j.location || j.loc) && (
                            <JobMetaItem icon={j.remote ? 'globe' : 'map-pin'}>{j.location || j.loc}</JobMetaItem>
                          )}
                          {j.type && <JobMetaItem icon="jobs">{j.type}</JobMetaItem>}
                          {j.posted && <JobMetaItem icon="clock">{j.posted}</JobMetaItem>}
                        </JobMetaRow>
                      </div>
                    </div>

                    {readyForMatches && typeof j.match === 'number' && j.match > 0 && (
                      <>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <AppIcon name="target" className="size-3.5" />
                          Match: <strong className={matchTone(j.match)}>{j.match}%</strong>
                        </div>
                        <Progress value={j.match} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
                      </>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {j.tags.slice(0, 3).map(t => (
                        <StatusBadge key={t} tone="default" className="text-xs">{t}</StatusBadge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <JobMetaItem
                        icon="salary"
                        className={!(j.salary || j.sal) ? 'opacity-60' : 'font-semibold text-foreground'}
                      >
                        {j.salary || j.sal || 'Not listed'}
                      </JobMetaItem>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={(e) => toggleSave(j, e)} aria-label={isJobSaved(j.id) ? 'Unsave job' : 'Save job'}>
                          {isJobSaved(j.id) ? <AppIcon name="heart" className="size-3.5" weight="fill" /> : <AppIcon name="heart-outline" className="size-3.5" />}
                        </Button>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); openJob(j) }}>View</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {totalResults > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button variant="ghost" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</Button>

              <Button variant="ghost" size="sm" disabled={!canGoNext} onClick={() => setPage(p => p + 1)}>Next →</Button>

              <span className="w-full text-center text-xs text-muted-foreground sm:w-auto">
                Page {page}{pagination.totalPages ? ` of ${pagination.totalPages}` : ''} · {totalResults} jobs
                {pagination.from ? ` · showing ${pagination.from}–${pagination.to}` : ''}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
