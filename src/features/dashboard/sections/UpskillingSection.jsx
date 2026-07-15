import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeader from '@/components/dashboard/SectionHeader'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import {
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
import {
  generateLearningPath,
  getLearningPath,
  getSkillGap,
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
  const items = (path?.weeks || []).flatMap((w) => w.items || [])
  const total = items.length
  const completed = items.filter((i) => i.done).length
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  }
}

function SkillChip({ skill, selected, onToggle, selectable }) {
  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={() => selectable && onToggle?.(skill.name)}
      className={cn(
        'inline-flex max-w-full flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors',
        selectable ? 'cursor-pointer hover:border-primary/40' : 'cursor-default',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-muted/30',
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

export default function UpskillingSection() {
  const addToast = useAppStore((s) => s.addToast)
  const profile = useProfileStore((s) => s.profile)
  const loadProfile = useProfileStore((s) => s.load)
  const { credits, creditCosts, loading: entLoading, refresh } = useEntitlements()

  const pathCost = creditCosts?.learningPath ?? DEFAULT_PRICING_CONFIG.creditCosts.learningPath ?? 3
  const balance = credits?.balance
  const canGenerate = typeof balance !== 'number' || balance >= pathCost

  const defaultRole = profile?.headline || profile?.preferences?.preferredRoles?.[0] || ''
  const [role, setRole] = useState(defaultRole)
  const [level, setLevel] = useState('beginner')
  const [hours, setHours] = useState(8)

  const [gapLoading, setGapLoading] = useState(false)
  const [gap, setGap] = useState(null)
  const [selectedSkills, setSelectedSkills] = useState([])

  const [pathLoading, setPathLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [path, setPath] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => {
    loadProfile({ force: false }).catch(() => {})
  }, [loadProfile])

  useEffect(() => {
    if (!role && defaultRole) setRole(defaultRole)
  }, [defaultRole, role])

  useEffect(() => {
    let cancelled = false
    setPathLoading(true)
    getLearningPath()
      .then((data) => {
        if (!cancelled) setPath(data?.path || null)
      })
      .catch(() => {
        if (!cancelled) setPath(null)
      })
      .finally(() => {
        if (!cancelled) setPathLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const progress = useMemo(() => pathProgress(path), [path])

  const toggleSkill = (name) => {
    setSelectedSkills((prev) => {
      if (prev.includes(name)) return prev.filter((s) => s !== name)
      if (prev.length >= 6) {
        addToast('error', 'Pick up to 6 skills for your learning path')
        return prev
      }
      return [...prev, name]
    })
  }

  const analyzeGap = async () => {
    const target = role.trim()
    if (!target) {
      addToast('error', 'Enter a target role first')
      return
    }
    setGapLoading(true)
    try {
      const data = await getSkillGap({ role: target })
      setGap(data)
      setSelectedSkills((data.missingSkills || []).slice(0, 4).map((s) => s.name))
    } catch (err) {
      console.error('skill gap:', err)
      addToast('error', err.message || 'Could not analyze skill gap')
    } finally {
      setGapLoading(false)
    }
  }

  const createPath = async () => {
    if (!selectedSkills.length) {
      addToast('error', 'Select at least one missing skill')
      return
    }
    if (!canGenerate) {
      addToast('error', `Not enough AI credits (needs ${pathCost})`)
      return
    }
    setGenerating(true)
    try {
      const data = await generateLearningPath({
        targetRole: role.trim() || gap?.targetRole,
        focusSkills: selectedSkills,
        hoursPerWeek: hours,
        level,
      })
      setPath(data?.path || null)
      refresh({ force: true }).catch(() => {})
      addToast('success', 'Learning path ready')
    } catch (err) {
      console.error('learning path:', err)
      addToast('error', err.message || 'Could not generate learning path')
    } finally {
      setGenerating(false)
    }
  }

  const toggleItemDone = async (itemId, done) => {
    setTogglingId(itemId)
    try {
      const result = await updateLearningPathProgress({ itemId, done })
      setPath((prev) => (prev ? { ...prev, weeks: result.weeks } : prev))
    } catch (err) {
      addToast('error', err.message || 'Could not update progress')
    } finally {
      setTogglingId(null)
    }
  }

  const sidebar = (
    <div className="space-y-4">
      <DashboardCard titleIcon="target" title="Target role" contentClassName="space-y-3">
        <Input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. React Developer"
        />
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              {r}
            </button>
          ))}
        </div>
        <Button className="w-full" onClick={analyzeGap} disabled={gapLoading}>
          {gapLoading ? 'Analyzing…' : 'Analyze skill gap'}
        </Button>
        <p className="text-xs text-muted-foreground">Free — uses your profile skills vs role demand.</p>
      </DashboardCard>

      <DashboardCard titleIcon="calendar" title="Learning path options" contentClassName="space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Level</span>
          <Select value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Hours / week</span>
          <Input
            type="number"
            min={2}
            max={40}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value) || 8)}
          />
        </label>
        <Button
          className="w-full"
          variant="secondary"
          onClick={createPath}
          disabled={generating || gapLoading || entLoading || !selectedSkills.length}
        >
          {generating ? 'Building path…' : `Generate path · ${pathCost} credits`}
        </Button>
        {!canGenerate && (
          <p className="text-xs text-amber-600">
            Not enough credits.{' '}
            <Link to="/dashboard/settings" className="underline">Upgrade / check balance</Link>
          </p>
        )}
      </DashboardCard>
    </div>
  )

  return (
    <ToolPage>
      <SectionHeader
        title="Upskilling"
        subtitle="See where you stand for a role, then get a week-by-week learning path."
      />

      <ToolSidebarLayout sidebar={sidebar}>
        {!gap && !path && !pathLoading && (
          <DashboardCard>
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AppIcon name="graduation" className="size-10 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">Close the gap to your next role</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Analyze free skill gaps against a target role, pick what to learn next,
                then generate an AI study plan you can track week by week.
              </p>
            </div>
          </DashboardCard>
        )}

        {gapLoading && (
          <DashboardCard>
            <div className="flex justify-center py-12"><Loader /></div>
          </DashboardCard>
        )}

        {gap && !gapLoading && (
          <div className="space-y-4">
            <DashboardCard
              titleIcon="sparkle"
              title={`Gap vs ${gap.targetRole}`}
              action={
                <Badge variant="secondary">
                  {gap.coverage}% coverage
                  {gap.domain?.label ? ` · ${gap.domain.label}` : ''}
                </Badge>
              }
            >
              <div className="mb-4">
                <Progress value={gap.coverage} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  You have {gap.haveSkills?.length || 0} of the top demanded skills for this role.
                  Select missing skills (up to 6) to feed your learning path.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-emerald-600">You have</h4>
                  <div className="flex flex-wrap gap-2">
                    {(gap.haveSkills || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No strong overlaps yet — add skills to your profile.</p>
                    ) : (
                      gap.haveSkills.map((s) => (
                        <SkillChip key={`have-${s.name}`} skill={s} />
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-amber-600">
                    Missing · selected {selectedSkills.length}/6
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(gap.missingSkills || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nice — no major gaps detected.</p>
                    ) : (
                      gap.missingSkills.map((s) => (
                        <SkillChip
                          key={`miss-${s.name}`}
                          skill={s}
                          selectable
                          selected={selectedSkills.includes(s.name)}
                          onToggle={toggleSkill}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </DashboardCard>
          </div>
        )}

        {(pathLoading || path) && (
          <DashboardCard
            titleIcon="book"
            title={path ? `Learning path · ${path.targetRole}` : 'Your learning path'}
            action={
              path ? (
                <Badge variant="secondary">{progress.percent}% complete</Badge>
              ) : null
            }
          >
            {pathLoading ? (
              <div className="flex justify-center py-10"><Loader /></div>
            ) : !path ? null : (
              <div className="space-y-4">
                {path.summary && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{path.summary}</p>
                )}
                <div>
                  <Progress value={progress.percent} className="h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {progress.completed}/{progress.total} items · {path.hoursPerWeek || 8} hrs/week · {path.level}
                  </p>
                </div>

                <div className="space-y-4">
                  {(path.weeks || []).map((week) => (
                    <div key={week.week} className="rounded-xl border border-border p-4">
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="font-semibold">
                          Week {week.week}
                          {week.title ? ` · ${week.title}` : ''}
                        </h4>
                        {week.focus && (
                          <span className="text-xs text-muted-foreground">{week.focus}</span>
                        )}
                      </div>
                      <div className="space-y-3">
                        {(week.items || []).map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              'rounded-lg border border-border/80 bg-muted/20 p-3',
                              item.done && 'opacity-70',
                            )}
                          >
                            <label className="flex cursor-pointer items-start gap-3">
                              <Checkbox
                                checked={!!item.done}
                                disabled={togglingId === item.id}
                                onCheckedChange={(v) => toggleItemDone(item.id, Boolean(v))}
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">{item.skill}</span>
                                  {item.done && <Badge variant="secondary">Done</Badge>}
                                </div>
                                {!!item.topics?.length && (
                                  <p className="text-xs text-muted-foreground">
                                    Topics: {item.topics.join(' · ')}
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
                                    {item.resources.map((r) => (
                                      <a
                                        key={r.url}
                                        href={r.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-primary underline-offset-2 hover:underline"
                                      >
                                        {r.label}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DashboardCard>
        )}
      </ToolSidebarLayout>
    </ToolPage>
  )
}
