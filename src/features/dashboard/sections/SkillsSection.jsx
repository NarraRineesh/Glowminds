import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useProfileStore from '@/store/profileStore'
import { getPreferredRole } from '@/constants/schema'
import { getSkillGap, getSkillTrends } from '@/services/skillsApi'
import { skillKey, skillLabel } from '@/utils/skillLabel'
import {
  AiRail,
  DenseTable,
  SectionCard,
  SplitRail,
} from '@/features/dashboard/components/v2'
import { Badge, Button, Input, Progress, cn } from '@/components/ui'

function asSkillList(raw) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.skills)) return raw.skills
  if (Array.isArray(raw?.trends)) return raw.trends
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

function parseGrowth(raw) {
  const s = String(raw || '').trim()
  if (!s || s === '+—' || s === '—' || s === '-') return null
  const n = Number(s.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

function formatGrowth(raw) {
  const n = parseGrowth(raw)
  if (n == null) return null
  if (n > 0) return `+${n}%`
  if (n < 0) return `${n}%`
  return '0%'
}

function importanceLabel(skill) {
  const score = Number(skill?.importanceScore)
  if (Number.isFinite(score)) {
    if (score >= 45) return 'High'
    if (score >= 30) return 'Med'
    return 'Low'
  }
  const jobs = Number(skill?.jobCount) || 0
  if (jobs >= 20) return 'High'
  if (jobs >= 8) return 'Med'
  return 'Low'
}

function signalFor(skill) {
  const jobs = Number(skill?.jobCount)
  const growth = formatGrowth(skill?.growth)
  const parts = []
  if (Number.isFinite(jobs) && jobs > 0) parts.push(`${jobs} roles`)
  if (growth) parts.push(growth)
  return parts.length ? parts.join(' · ') : 'JD keyword'
}

function demandTone(row) {
  const jobs = Number(row.jobCount) || 0
  const growth = parseGrowth(row.growth)
  if (jobs >= 25 || (growth != null && growth >= 80)) return 'hot'
  if (jobs >= 12 || (growth != null && growth >= 40)) return 'rising'
  return 'watch'
}

/** [v2:skills] Skill gap + data-rich market demand */
export default function SkillsSection() {
  const navigate = useNavigate()
  const profile = useProfileStore((s) => s.profile)
  const load = useProfileStore((s) => s.load)
  const [role, setRole] = useState(() => getPreferredRole(profile))
  const [gap, setGap] = useState(null)
  const [trends, setTrends] = useState([])
  const [domain, setDomain] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    load({ force: false }).catch(() => {})
  }, [load])

  useEffect(() => {
    const next = getPreferredRole(profile)
    if (next) setRole(next)
  }, [profile?.preferences?.preferredRole, profile?.headline, profile])

  const analyze = async (targetRole = role) => {
    setBusy(true)
    try {
      const data = await getSkillGap({ role: targetRole })
      setGap(data)
    } catch {
      setGap(null)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const preferred = getPreferredRole(profile)
    ;(async () => {
      setBusy(true)
      try {
        const data = await getSkillGap({ role: preferred })
        if (!cancelled) setGap(data)
      } catch {
        if (!cancelled) setGap(null)
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()
    getSkillTrends({ limit: 12, mode: 'demand' })
      .then((d) => {
        if (cancelled) return
        setTrends(asSkillList(d))
        setDomain(d?.domain || null)
      })
      .catch(() => {
        if (cancelled) return
        setTrends([])
        setDomain(null)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const gapRows = useMemo(() => {
    const missing = gap?.missingSkills || []
    return missing.map((s, i) => {
      const label = skillLabel(s)
      const imp = importanceLabel(s)
      return [
        <div key={`s-${i}`} className="min-w-0">
          <span className="font-medium">{label}</span>
          {s.category && s.category !== 'Other' ? (
            <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">{s.category}</span>
          ) : null}
        </div>,
        <Badge
          key={`i-${i}`}
          variant="outline"
          className={cn(
            'text-[0.65rem]',
            imp === 'High' && 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
            imp === 'Med' && 'text-muted-foreground',
            imp === 'Low' && 'text-muted-foreground/70',
          )}
        >
          {imp}
          {Number.isFinite(Number(s.importanceScore)) ? ` · ${Math.round(s.importanceScore)}` : ''}
        </Badge>,
        <span key={`sig-${i}`} className="max-w-[6.5rem] truncate text-muted-foreground sm:max-w-none">{signalFor(s)}</span>,
        <Link
          key={`a-${i}`}
          to="/dashboard/learning"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Learn
        </Link>,
      ]
    })
  }, [gap])

  const demandList = useMemo(() => {
    const list = asSkillList(trends)
      .map((t, i) => ({
        key: skillKey(t, i),
        label: skillLabel(t),
        category: t.category || 'Other',
        jobCount: Number(t.jobCount) || 0,
        growth: t.growth,
        growthLabel: formatGrowth(t.growth),
        tone: demandTone(t),
      }))
      .filter((x) => x.label)
      .sort((a, b) => b.jobCount - a.jobCount || (parseGrowth(b.growth) || 0) - (parseGrowth(a.growth) || 0))
    return list.slice(0, 12)
  }, [trends])

  const maxJobs = useMemo(
    () => Math.max(1, ...demandList.map((d) => d.jobCount)),
    [demandList],
  )

  const mySkills = useMemo(() => {
    const technical = profile?.skills?.technical || []
    const soft = profile?.skills?.soft || []
    const fromProfile = [...technical, ...soft].map((s) => skillLabel(s)).filter(Boolean)
    if (fromProfile.length) return [...new Set(fromProfile)]
    return (gap?.haveSkills || []).map((s) => skillLabel(s)).filter(Boolean)
  }, [profile?.skills, gap?.haveSkills])

  const domainLabel = domain?.label || gap?.domain?.label || null

  return (
    <div className="space-y-4">
      <SplitRail
        main={(
          <SectionCard
            title={gap?.targetRole ? `Gap for ${gap.targetRole}` : 'Skill gap'}
            action={<span className="text-xs text-muted-foreground">{gap ? `${gap.coverage || 0}% coverage` : '—'}</span>}
          >
            <form
              className="mb-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                analyze()
              }}
            >
              <Input
                className="h-9"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Target role"
                aria-label="Target role"
              />
              <Button type="submit" size="sm" className="h-9" disabled={busy}>
                {busy ? '…' : 'Analyze'}
              </Button>
            </form>

            {gap ? (
              <>
                <Progress value={gap.coverage || 0} className="mb-3" />
                {/* Mobile: stacked cards (no clipped table columns) */}
                <div className="space-y-2 sm:hidden">
                  {(gap.missingSkills || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No gaps detected for this role.</p>
                  ) : (
                    (gap.missingSkills || []).map((s, i) => {
                      const label = skillLabel(s)
                      const imp = importanceLabel(s)
                      return (
                        <div key={`m-${i}`} className="rounded-xl border border-border bg-muted/30 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="m-0 font-semibold">{label}</p>
                              {s.category && s.category !== 'Other' ? (
                                <p className="m-0 mt-0.5 text-[0.65rem] text-muted-foreground">{s.category}</p>
                              ) : null}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'shrink-0 text-[0.65rem]',
                                imp === 'High' && 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
                              )}
                            >
                              {imp}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{signalFor(s)}</span>
                            <Link to="/dashboard/learning" className="shrink-0 font-medium text-primary underline-offset-4 hover:underline">
                              Learn
                            </Link>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="hidden sm:block">
                  <DenseTable
                    columns={['Skill', 'Importance', 'Demand', '']}
                    rows={gapRows}
                    empty={<p className="text-sm text-muted-foreground">No gaps detected for this role.</p>}
                  />
                </div>
                {mySkills.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="m-0 text-sm font-semibold">You already have</h3>
                      <span className="text-xs text-muted-foreground">{mySkills.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mySkills.map((label) => (
                        <Badge key={label} variant="secondary">{label}</Badge>
                      ))}
                    </div>
                    <p className="mt-2 mb-0 text-xs text-muted-foreground">
                      From your profile ·{' '}
                      <Link to="/dashboard/profile" className="font-medium text-primary underline-offset-4 hover:underline">
                        Edit skills
                      </Link>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Enter a target role and analyze to see your skill gap.</p>
            )}
          </SectionCard>
        )}
        rail={(
          <>
            <AiRail
              title="Close the gap"
              body={
                gap?.missingSkills?.length
                  ? `A focused path on ${(gap.missingSkills || []).slice(0, 2).map(skillLabel).join(' + ')} maps to roles in your target set.`
                  : 'Analyze your gap to unlock a tailored learning path.'
              }
              cta="Open Learning"
              onCta={() => navigate('/dashboard/learning')}
            />
            <SectionCard
              title="Market demand"
              action={domainLabel ? <span className="max-w-[9rem] truncate text-[0.65rem] text-muted-foreground">{domainLabel}</span> : null}
            >
              {demandList.length ? (
                <ul className="space-y-3">
                  {demandList.map((d) => (
                    <li key={d.key} className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="m-0 truncate text-sm font-medium">{d.label}</p>
                          <p className="m-0 text-[0.65rem] text-muted-foreground">
                            {d.category !== 'Other' ? d.category : 'Skill'}
                            {d.jobCount > 0 ? ` · ${d.jobCount} open roles` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[0.6rem] uppercase',
                              d.tone === 'hot' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
                              d.tone === 'rising' && 'border-amber-500/30 bg-amber-500/10 text-amber-600',
                            )}
                          >
                            {d.tone === 'hot' ? 'Hot' : d.tone === 'rising' ? 'Rising' : 'Watch'}
                          </Badge>
                          {d.growthLabel ? (
                            <span className={cn(
                              'font-mono text-[0.65rem] tabular-nums',
                              parseGrowth(d.growth) > 0 ? 'text-emerald-600' : 'text-muted-foreground',
                            )}
                            >
                              {d.growthLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            d.tone === 'hot' ? 'bg-emerald-500' : d.tone === 'rising' ? 'bg-amber-500' : 'bg-muted-foreground/40',
                          )}
                          style={{ width: `${Math.max(8, Math.round((d.jobCount / maxJobs) * 100))}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No demand signals yet.</p>
              )}
            </SectionCard>
          </>
        )}
      />
    </div>
  )
}
