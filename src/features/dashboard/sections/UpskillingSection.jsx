import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import {
  AppDialog,
  Badge,
  Button,
  Checkbox,
  DashboardCard,
  Input,
  Progress,
  Select,
  cn,
} from '@/components/ui'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useEntitlements from '@/hooks/useEntitlements'
import { DEFAULT_PRICING_CONFIG } from '@/constants/pricingDefaults'
import { getPreferredRole } from '@/constants/schema'
import {
  deleteLearningPath,
  generateLearningPath,
  getLearningPath,
  getLearningPathHistory,
  getSkillGap,
  resumeLearningPath,
  updateLearningPathProgress,
} from '@/services/skillsApi'
import Loader from '@/components/Loader'

const LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

const SUGGESTED_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Mobile Developer',
]

function pathProgress(path) {
  if (path?.progress) return path.progress
  const items = (path?.weeks || []).flatMap((week) => week.items || [])
  const total = items.length
  const completed = items.filter((item) => item.done).length
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 }
}

function formatDate(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function SkillChip({ skill, selected, onToggle, selectable }) {
  return (
    <button
      type="button"
      disabled={!selectable}
      aria-pressed={selectable ? Boolean(selected) : undefined}
      onClick={() => selectable && onToggle?.(skill.name)}
      className={cn(
        'inline-flex min-h-11 max-w-full flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        selectable ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/40' : 'cursor-default',
        selected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-muted/30',
      )}
    >
      <span className="text-sm font-medium text-foreground">{skill.name}</span>
      <span className="text-[11px] text-muted-foreground">
        {skill.category}
        {skill.jobCount ? ` · ${skill.jobCount} jobs` : ''}
        {skill.growth && skill.growth !== '+—' ? ` · ${skill.growth}` : ''}
      </span>
    </button>
  )
}

function LearningPlan({ path, progress, togglingId, onToggle }) {
  const firstIncompleteWeek = Math.max(
    0,
    (path.weeks || []).findIndex((week) => (week.items || []).some((item) => !item.done)),
  )
  const [openWeeks, setOpenWeeks] = useState(() => new Set([firstIncompleteWeek]))

  useEffect(() => {
    setOpenWeeks(new Set([firstIncompleteWeek]))
  }, [path.pathId, firstIncompleteWeek])

  return (
    <DashboardCard className="overflow-hidden">
      <div className="space-y-5">
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Active path</Badge>
                <span className="text-xs text-muted-foreground">
                  Updated {formatDate(path.updatedAt)}
                </span>
              </div>
              <h2 className="text-xl font-bold sm:text-2xl">{path.targetRole}</h2>
              {path.summary && (
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {path.summary}
                </p>
              )}
            </div>
            <div className="shrink-0 rounded-xl border border-primary/15 bg-background/80 px-4 py-3 text-center backdrop-blur">
              <div className="text-2xl font-bold text-primary">{progress.percent}%</div>
              <div className="text-[11px] text-muted-foreground">complete</div>
            </div>
          </div>
          <Progress value={progress.percent} className="mt-5 h-2.5" />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{progress.completed}/{progress.total} activities</span>
            <span>{path.hoursPerWeek || 8} hrs/week</span>
            <span className="capitalize">{path.level}</span>
            <span>{(path.weeks || []).length} weeks</span>
          </div>
        </div>

        <div className="space-y-3">
          {(path.weeks || []).map((week, index) => {
            const weekProgress = pathProgress({ weeks: [week] })
            return (
              <details
                key={`${path.pathId || 'active'}-${week.week}`}
                open={openWeeks.has(index)}
                onToggle={(event) => {
                  const isOpen = event.currentTarget.open
                  setOpenWeeks((current) => {
                    const next = new Set(current)
                    if (isOpen) next.add(index)
                    else next.delete(index)
                    return next
                  })
                }}
                className="group rounded-2xl border border-border bg-card open:shadow-sm"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60 sm:px-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">Week {week.week}</span>
                      {week.title && <span className="truncate text-sm">· {week.title}</span>}
                      {weekProgress.percent === 100 && (
                        <Badge variant="secondary">Complete</Badge>
                      )}
                    </div>
                    {week.focus && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{week.focus}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {weekProgress.completed}/{weekProgress.total}
                    </span>
                    <AppIcon
                      name="caret-down"
                      className="size-4 transition-transform group-open:rotate-180"
                    />
                  </div>
                </summary>
                <div className="space-y-3 border-t border-border px-4 py-4 sm:px-5">
                  {(week.items || []).map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-xl border border-border/80 bg-muted/20 p-3 transition-opacity sm:p-4',
                        item.done && 'opacity-70',
                      )}
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          checked={Boolean(item.done)}
                          disabled={togglingId === item.id}
                          onCheckedChange={(value) => onToggle(item.id, Boolean(value))}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn('font-medium', item.done && 'line-through')}>
                              {item.skill}
                            </span>
                            {item.done && <Badge variant="secondary">Done</Badge>}
                          </div>
                          {!!item.topics?.length && (
                            <p className="text-xs text-muted-foreground">
                              {item.topics.join(' · ')}
                            </p>
                          )}
                          {item.miniProject && (
                            <p className="text-sm">
                              <span className="font-medium">Mini-project: </span>
                              {item.miniProject}
                            </p>
                          )}
                          {!!item.resources?.length && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {item.resources.map((resource) => (
                                <a
                                  key={resource.url}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex min-h-9 items-center rounded-lg border border-border bg-background px-2.5 text-xs text-primary transition-colors hover:bg-muted"
                                >
                                  {resource.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </details>
            )
          })}
        </div>
      </div>
    </DashboardCard>
  )
}

function HistoryCard({ item, active, busy, onResume, onDelete }) {
  const progress = pathProgress(item)
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {active ? <Badge>Active</Badge> : <Badge variant="secondary">Saved</Badge>}
            <span className="text-[11px] text-muted-foreground">{formatDate(item.createdAt)}</span>
          </div>
          <h3 className="truncate font-semibold">{item.targetRole || 'Learning path'}</h3>
        </div>
        <button
          type="button"
          aria-label={`Delete ${item.targetRole || 'learning path'}`}
          disabled={busy}
          onClick={() => onDelete(item)}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
        >
          <AppIcon name="trash" className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(item.focusSkills || []).slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
            {skill}
          </span>
        ))}
        {(item.focusSkills || []).length > 4 && (
          <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
            +{item.focusSkills.length - 4}
          </span>
        )}
      </div>
      <div className="mt-auto pt-5">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>{progress.completed}/{progress.total} activities</span>
          <span>{progress.percent}%</span>
        </div>
        <Progress value={progress.percent} className="h-1.5" />
        <Button
          className="mt-4 w-full"
          variant={active ? 'secondary' : 'default'}
          disabled={busy}
          onClick={() => onResume(item)}
        >
          {active ? 'Continue learning' : 'Resume this path'}
        </Button>
      </div>
    </div>
  )
}

export default function UpskillingSection() {
  const addToast = useAppStore((state) => state.addToast)
  const profile = useProfileStore((state) => state.profile)
  const loadProfile = useProfileStore((state) => state.load)
  const { credits, creditCosts, loading: entLoading, refresh } = useEntitlements()

  const pathCost = creditCosts?.learningPath ?? DEFAULT_PRICING_CONFIG.creditCosts.learningPath ?? 3
  const balance = credits?.balance
  const canGenerate = typeof balance !== 'number' || balance >= pathCost
  const defaultRole = getPreferredRole(profile, '')

  const [role, setRole] = useState(defaultRole)
  const [level, setLevel] = useState('beginner')
  const [hours, setHours] = useState(8)
  const [gapLoading, setGapLoading] = useState(false)
  const [gap, setGap] = useState(null)
  const [selectedSkills, setSelectedSkills] = useState([])
  const [pathLoading, setPathLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [path, setPath] = useState(null)
  const [history, setHistory] = useState([])
  const [view, setView] = useState('plan')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [busyPathId, setBusyPathId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const progress = useMemo(() => pathProgress(path), [path])

  const loadWorkspace = useCallback(async () => {
    setPathLoading(true)
    setLoadError('')
    const [activeResult, historyResult] = await Promise.allSettled([
      getLearningPath(),
      getLearningPathHistory({ limit: 30 }),
    ])
    const active = activeResult.status === 'fulfilled' ? activeResult.value?.path || null : null
    const saved = historyResult.status === 'fulfilled' ? historyResult.value?.paths || [] : []
    setPath(active)
    setHistory(saved)
    setBuilderOpen(!active)
    if (activeResult.status === 'rejected' || historyResult.status === 'rejected') {
      setLoadError('Some learning-path data could not be loaded.')
    }
    setPathLoading(false)
  }, [])

  useEffect(() => {
    loadProfile({ force: false }).catch(() => {})
    loadWorkspace()
  }, [loadProfile, loadWorkspace])

  useEffect(() => {
    if (!role && defaultRole) setRole(defaultRole)
  }, [defaultRole, role])

  const refreshHistory = useCallback(() => {
    getLearningPathHistory({ limit: 30 })
      .then((data) => setHistory(data?.paths || []))
      .catch(() => {})
  }, [])

  const toggleSkill = (name) => {
    setSelectedSkills((current) => {
      if (current.includes(name)) return current.filter((skill) => skill !== name)
      if (current.length >= 6) {
        addToast('error', 'Pick up to 6 skills for your learning path')
        return current
      }
      return [...current, name]
    })
  }

  const analyzeGap = async () => {
    const target = role.trim()
    if (!target) return addToast('error', 'Enter a target role first')
    setGapLoading(true)
    try {
      const data = await getSkillGap({ role: target })
      setGap(data)
      setSelectedSkills((data.missingSkills || []).slice(0, 4).map((skill) => skill.name))
    } catch (error) {
      addToast('error', error.message || 'Could not analyze skill gap')
    } finally {
      setGapLoading(false)
    }
  }

  const createPath = async () => {
    if (!selectedSkills.length) return addToast('error', 'Select at least one missing skill')
    if (!canGenerate) return addToast('error', `Not enough AI credits (needs ${pathCost})`)
    setGenerating(true)
    try {
      const data = await generateLearningPath({
        targetRole: role.trim() || gap?.targetRole,
        focusSkills: selectedSkills,
        hoursPerWeek: hours,
        level,
      })
      setPath(data?.path || null)
      setBuilderOpen(false)
      setView('plan')
      refresh({ force: true }).catch(() => {})
      refreshHistory()
      addToast('success', path ? 'New path created. Your previous path is in history.' : 'Learning path ready')
    } catch (error) {
      addToast('error', error.message || 'Could not generate learning path')
    } finally {
      setGenerating(false)
    }
  }

  const toggleItemDone = async (itemId, done) => {
    setTogglingId(itemId)
    try {
      const result = await updateLearningPathProgress({ itemId, done })
      setPath((current) => current ? { ...current, weeks: result.weeks, progress: result.progress } : current)
      setHistory((items) => items.map((item) => (
        item.pathId === path?.pathId ? { ...item, progress: result.progress } : item
      )))
    } catch (error) {
      addToast('error', error.message || 'Could not update progress')
    } finally {
      setTogglingId(null)
    }
  }

  const resumePath = async (item) => {
    if (item.pathId === path?.pathId) {
      setBuilderOpen(false)
      setView('plan')
      return
    }
    setBusyPathId(item.pathId)
    try {
      const data = await resumeLearningPath(item.pathId)
      setPath(data?.path || null)
      setBuilderOpen(false)
      setView('plan')
      refreshHistory()
      addToast('success', 'Learning path resumed')
    } catch (error) {
      addToast('error', error.message || 'Could not resume this path')
    } finally {
      setBusyPathId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.pathId) return
    setBusyPathId(deleteTarget.pathId)
    try {
      await deleteLearningPath(deleteTarget.pathId)
      const wasActive = deleteTarget.pathId === path?.pathId
      setHistory((items) => items.filter((item) => item.pathId !== deleteTarget.pathId))
      if (wasActive) {
        setPath(null)
        setBuilderOpen(true)
        setView('plan')
      }
      setDeleteTarget(null)
      addToast('success', 'Learning path deleted')
    } catch (error) {
      addToast('error', error.message || 'Could not delete learning path')
    } finally {
      setBusyPathId(null)
    }
  }

  const startNewPath = () => {
    setBuilderOpen(true)
    setGap(null)
    setSelectedSkills([])
    setView('plan')
  }

  const builderSidebar = (
    <div className="space-y-4">
      <DashboardCard titleIcon="target" title="Target role" contentClassName="space-y-3">
        <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. React Developer" />
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_ROLES.map((suggestedRole) => (
            <button
              key={suggestedRole}
              type="button"
              onClick={() => setRole(suggestedRole)}
              className="min-h-9 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              {suggestedRole}
            </button>
          ))}
        </div>
        <Button className="w-full" onClick={analyzeGap} disabled={gapLoading}>
          {gapLoading ? 'Analyzing…' : 'Analyze skill gap'}
        </Button>
        <p className="text-xs text-muted-foreground">Free · Based on your profile and role demand.</p>
      </DashboardCard>

      <DashboardCard titleIcon="calendar" title="Plan preferences" contentClassName="space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Level</span>
          <Select value={level} onChange={(event) => setLevel(event.target.value)}>
            {LEVELS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </Select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Hours per week</span>
          <Input
            type="number"
            min={2}
            max={40}
            value={hours}
            onChange={(event) => setHours(Number(event.target.value) || 8)}
          />
        </label>
        <Button
          className="w-full"
          variant="secondary"
          onClick={createPath}
          disabled={generating || gapLoading || entLoading || !selectedSkills.length}
        >
          {generating ? 'Building your path…' : `Generate path · ${pathCost} credits`}
        </Button>
        {!canGenerate && (
          <p className="text-xs text-amber-600">
            Not enough credits. <Link to="/dashboard/settings" className="underline">Check balance</Link>
          </p>
        )}
        {path && (
          <Button className="w-full" variant="ghost" onClick={() => setBuilderOpen(false)}>
            Cancel · keep current path
          </Button>
        )}
      </DashboardCard>
    </div>
  )

  const workspaceSidebar = (
    <div className="space-y-4">
      <DashboardCard titleIcon="book" title="Current journey" contentClassName="space-y-3">
        <div>
          <p className="font-semibold">{path?.targetRole}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {progress.completed}/{progress.total} activities · {progress.percent}% complete
          </p>
        </div>
        <Progress value={progress.percent} className="h-2" />
        <Button className="w-full" onClick={() => { setView('plan'); setBuilderOpen(false) }}>
          Continue learning
        </Button>
        <Button className="w-full" variant="secondary" onClick={startNewPath}>
          Create new path
        </Button>
      </DashboardCard>
      <DashboardCard titleIcon="clock" title="Saved paths" contentClassName="space-y-3">
        <p className="text-sm text-muted-foreground">
          {history.length} {history.length === 1 ? 'path' : 'paths'} saved. Resume any path without using credits.
        </p>
        <Button className="w-full" variant="ghost" onClick={() => setView('history')}>
          View history
        </Button>
      </DashboardCard>
    </div>
  )

  return (
    <ToolPage>
      {path && !builderOpen ? (
        <div className="mb-3 flex justify-end">
          <Button onClick={startNewPath}>
            <AppIcon name="sparkle" className="size-4" />
            New learning path
          </Button>
        </div>
      ) : null}

      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <span>{loadError}</span>
          <Button size="sm" variant="secondary" onClick={loadWorkspace}>Retry</Button>
        </div>
      )}

      <ToolSidebarLayout sidebar={builderOpen ? builderSidebar : workspaceSidebar}>
        {pathLoading ? (
          <DashboardCard><div className="flex justify-center py-16"><Loader /></div></DashboardCard>
        ) : builderOpen ? (
          <div className="space-y-4">
            {!gap && !gapLoading && (
              <DashboardCard>
                <div className="flex flex-col items-center gap-3 py-10 text-center sm:py-14">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                    <AppIcon name="graduation" className="size-7 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Design your next learning journey</h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Start with a free skill-gap analysis. Your current path stays safe and moves
                    to history only after the new plan is successfully created.
                  </p>
                </div>
              </DashboardCard>
            )}

            {gapLoading && (
              <DashboardCard><div className="flex justify-center py-12"><Loader /></div></DashboardCard>
            )}

            {gap && !gapLoading && (
              <DashboardCard
                titleIcon="sparkle"
                title={`Gap vs ${gap.targetRole}`}
                action={<Badge variant="secondary">{gap.coverage}% coverage</Badge>}
              >
                <Progress value={gap.coverage} className="mb-2 h-2" />
                <p className="mb-5 text-xs text-muted-foreground">
                  Select up to 6 missing skills. The AI plan will prioritize only your selection.
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-emerald-600">Skills you have</h3>
                    <div className="flex flex-wrap gap-2">
                      {(gap.haveSkills || []).length
                        ? gap.haveSkills.map((skill) => <SkillChip key={`have-${skill.name}`} skill={skill} />)
                        : <p className="text-sm text-muted-foreground">No strong overlaps detected yet.</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-amber-600">
                      Skills to build · {selectedSkills.length}/6 selected
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(gap.missingSkills || []).length
                        ? gap.missingSkills.map((skill) => (
                          <SkillChip
                            key={`missing-${skill.name}`}
                            skill={skill}
                            selectable
                            selected={selectedSkills.includes(skill.name)}
                            onToggle={toggleSkill}
                          />
                        ))
                        : <p className="text-sm text-muted-foreground">No major gaps detected.</p>}
                    </div>
                  </div>
                </div>
              </DashboardCard>
            )}

            {!path && history.length > 0 && !gapLoading && (
              <DashboardCard
                titleIcon="clock"
                title="Resume a saved path"
                action={<Badge variant="secondary">{history.length} saved</Badge>}
              >
                <p className="mb-4 text-sm text-muted-foreground">
                  Continue an earlier journey without spending credits, or create a fresh one.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {history.map((item) => (
                    <HistoryCard
                      key={item.pathId}
                      item={item}
                      active={false}
                      busy={busyPathId === item.pathId}
                      onResume={resumePath}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              </DashboardCard>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex w-full gap-1 rounded-xl bg-muted p-1 sm:w-fit">
              <button
                type="button"
                onClick={() => setView('plan')}
                className={cn(
                  'min-h-10 flex-1 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none',
                  view === 'plan' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
                )}
              >
                Active plan
              </button>
              <button
                type="button"
                onClick={() => setView('history')}
                className={cn(
                  'min-h-10 flex-1 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none',
                  view === 'history' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
                )}
              >
                History · {history.length}
              </button>
            </div>

            {view === 'plan' && path && (
              <LearningPlan
                path={path}
                progress={progress}
                togglingId={togglingId}
                onToggle={toggleItemDone}
              />
            )}

            {view === 'history' && (
              <DashboardCard
                titleIcon="clock"
                title="Learning path history"
                action={<Button size="sm" onClick={startNewPath}>Create new</Button>}
              >
                {history.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {history.map((item) => (
                      <HistoryCard
                        key={item.pathId}
                        item={item}
                        active={item.pathId === path?.pathId}
                        busy={busyPathId === item.pathId}
                        onResume={resumePath}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <AppIcon name="clock" className="mx-auto size-8 text-muted-foreground/50" />
                    <p className="mt-3 font-medium">No saved paths yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Create your first path to begin.</p>
                  </div>
                )}
              </DashboardCard>
            )}
          </div>
        )}
      </ToolSidebarLayout>

      {builderOpen && path && (
        <div className="sticky bottom-3 z-20 mx-auto flex w-full max-w-sm rounded-2xl border border-border bg-background/95 p-2 shadow-xl backdrop-blur lg:hidden">
          <Button className="w-full" variant="secondary" onClick={() => setBuilderOpen(false)}>
            Continue current path · {progress.percent}%
          </Button>
        </div>
      )}

      <AppDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this learning path?"
        description="Its plan and progress will be permanently removed. This cannot be undone."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={Boolean(busyPathId)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={Boolean(busyPathId)}>
              {busyPathId ? 'Deleting…' : 'Delete path'}
            </Button>
          </>
        )}
      >
        {deleteTarget && (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="font-medium">{deleteTarget.targetRole}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Created {formatDate(deleteTarget.createdAt)} · {pathProgress(deleteTarget).percent}% complete
            </p>
          </div>
        )}
      </AppDialog>
    </ToolPage>
  )
}
