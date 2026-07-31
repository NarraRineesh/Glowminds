import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import { loadActivity } from '@/services/activityLog'
import { auth } from '@/services/firebase'
import { normalizeGamification } from '@/constants/schema'
import {
  AiRail,
  FilterBar,
  SectionCard,
  SplitRail,
  StatStrip,
  Toolbar,
} from '@/features/dashboard/components/v2'
import { Button, cn } from '@/components/ui'

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'app', label: 'Apps' },
  { id: 'ats', label: 'ATS' },
  { id: 'learn', label: 'Learning' },
  { id: 'interview', label: 'Interviews' },
  { id: 'linkedin', label: 'LinkedIn' },
]

const RANGES = [
  { id: '7', label: '7d' },
  { id: '30', label: '30d' },
  { id: 'all', label: 'All' },
]

function dayLabel(ts) {
  const d = ts?.toDate?.() ? ts.toDate() : new Date(ts)
  if (Number.isNaN(d.getTime())) return 'Earlier'
  const today = new Date()
  const yday = new Date()
  yday.setDate(today.getDate() - 1)
  const key = d.toDateString()
  if (key === today.toDateString()) return 'Today'
  if (key === yday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
}

function eventTime(a) {
  const t = a.createdAt || a.ts || a.at
  const d = t?.toDate?.() ? t.toDate() : new Date(t)
  return Number.isNaN(d.getTime()) ? 0 : d.getTime()
}

function jumpFor(type) {
  const t = String(type || '').toLowerCase()
  if (t.includes('ats')) return { label: 'ATS Report', to: '/dashboard/resume?tab=ats' }
  if (t.includes('linkedin')) return { label: 'LinkedIn Hub', to: '/dashboard/linkedin' }
  if (t.includes('vault')) return { label: 'Vault', to: '/dashboard/vault' }
  if (t.includes('interview')) return { label: 'Interview', to: '/dashboard/interview' }
  if (t.includes('learn')) return { label: 'Learning', to: '/dashboard/learning' }
  if (t.includes('app') || t.includes('apply') || t.includes('application')) {
    return { label: 'Applications', to: '/dashboard/applications' }
  }
  if (t.includes('job') || t.includes('match') || t.includes('save')) {
    return { label: 'Jobs', to: '/dashboard/jobs' }
  }
  return { label: 'Dashboard', to: '/dashboard' }
}

function typeTone(type) {
  const t = String(type || '').toLowerCase()
  if (t.includes('ats')) return 'bg-success'
  if (t.includes('interview')) return 'bg-ai'
  if (t.includes('learn')) return 'bg-primary'
  if (t.includes('linkedin')) return 'bg-sky-500'
  return 'bg-border'
}

export default function TimelineSection() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const profile = useProfileStore((s) => s.profile)
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [range, setRange] = useState('30')
  const [loading, setLoading] = useState(true)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    const uid = auth.currentUser?.uid || user?.uid
    if (!uid) return
    setLoading(true)
    loadActivity(uid, 80)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [user?.uid])

  const ranged = useMemo(() => {
    if (range === 'all') return items
    const days = Number(range) || 30
    const cutoff = now - days * 86400000
    return items.filter((a) => eventTime(a) >= cutoff)
  }, [items, range, now])

  const filtered = useMemo(() => {
    if (filter === 'all') return ranged
    return ranged.filter((a) => String(a.type || '').toLowerCase().includes(filter))
  }, [ranged, filter])

  const groups = useMemo(() => {
    const map = new Map()
    for (const a of filtered) {
      const label = dayLabel(a.createdAt || a.ts)
      if (!map.has(label)) map.set(label, [])
      map.get(label).push(a)
    }
    return [...map.entries()]
  }, [filtered])

  const stats = useMemo(() => {
    const ats = ranged.filter((a) => String(a.type || '').toLowerCase().includes('ats'))
    const apps = ranged.filter((a) => {
      const t = String(a.type || '').toLowerCase()
      return t.includes('app') || t.includes('apply')
    })
    const learn = ranged.filter((a) => String(a.type || '').toLowerCase().includes('learn'))
    const lifts = ats.filter((a) => /improv|\+|lift|score/i.test(String(a.title || a.message || ''))).length
    const g = normalizeGamification(profile?.gamification)
    return [
      ['Events', String(ranged.length), range === 'all' ? 'All time' : `Last ${range}d`],
      ['ATS lifts', lifts ? `+${lifts}` : String(ats.length), ats.length ? `${ats.length} runs` : '—'],
      ['Apps', String(apps.length)],
      ['Learning', String(learn.length), g.streak ? `Streak ${g.streak}` : '—'],
    ]
  }, [ranged, range, profile])

  const milestones = useMemo(() => {
    const g = normalizeGamification(profile?.gamification)
    const list = []
    if ((g.badges || []).length) {
      list.push(...(g.badges || []).slice(0, 3).map((b) => b.title || b.id))
    }
    if (g.streak >= 4) list.push(`${g.streak}-day learning streak`)
    if (!list.length) {
      list.push('Keep logging ATS runs and applies — milestones unlock here')
    }
    return list.slice(0, 4)
  }, [profile])

  const patternBody = useMemo(() => {
    const types = filtered.map((a) => String(a.type || '').toLowerCase())
    const hasLi = types.some((t) => t.includes('linkedin'))
    const hasAts = types.some((t) => t.includes('ats'))
    if (hasLi && hasAts) {
      return 'Score improvements often follow LinkedIn sync + ATS loops. Keep that cadence before your next interview.'
    }
    if (hasAts) return 'ATS runs are showing up — pair them with targeted applies for faster pipeline movement.'
    if (filtered.length) return 'Steady activity this period. Jump into the next incomplete action to keep momentum.'
    return 'Your chronology will fill as you run ATS, apply, learn, and prep interviews.'
  }, [filtered])

  return (
    <div className="space-y-4">
      <Toolbar
        left={<FilterBar options={TYPE_FILTERS} value={filter} onChange={setFilter} />}
        right={<FilterBar options={RANGES} value={range} onChange={setRange} />}
      />

      <StatStrip stats={stats} />

      <SplitRail
        main={(
          <SectionCard
            title="Chronology"
            action={<span className="text-xs text-muted-foreground">{filtered.length} events</span>}
          >
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading timeline…</p>
            ) : groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet — ATS runs, applies, and LinkedIn syncs will show here.
              </p>
            ) : (
              <div className="space-y-5">
                {groups.map(([day, rows]) => (
                  <div key={day}>
                    <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">{day}</div>
                    <ul className="space-y-0 divide-y divide-border">
                      {rows.map((a) => {
                        const jump = jumpFor(a.type)
                        return (
                          <li key={a.id} className="flex items-center gap-2.5 py-2.5">
                            <span className={cn('size-2.5 shrink-0 rounded-full', typeTone(a.type))} />
                            <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                              {a.type || 'event'}
                            </span>
                            <strong className="min-w-0 flex-1 truncate text-sm">{a.title}</strong>
                            <Button type="button" size="sm" variant="outline" onClick={() => navigate(jump.to)}>
                              {jump.label}
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}
        rail={(
          <>
            <AiRail
              title="Pattern"
              body={patternBody}
              cta="Open Dashboard"
              onCta={() => navigate('/dashboard')}
            />
            <SectionCard title="Milestones">
              <ul className="space-y-2">
                {milestones.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </>
        )}
      />
    </div>
  )
}
