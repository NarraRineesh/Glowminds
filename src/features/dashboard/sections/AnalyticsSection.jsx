import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import useTrackerStore from '@/store/trackerStore'
import useJobStore from '@/store/jobStore'
import useInterviewStore from '@/store/interviewStore'
import useProfileStore from '@/store/profileStore'
import useAppStore from '@/store/authStore'
import { APPLICATION_STATUS, getPreferredRole } from '@/constants/schema'
import { getSkillGap, getSkillTrends } from '@/services/skillsApi'
import { loadScoreHistory } from '@/services/gamification'
import { loadActivity } from '@/services/activityLog'
import { buildCareerScores } from '@/utils/v2Scores'
import { skillLabel } from '@/utils/skillLabel'
import { auth } from '@/services/firebase'
import {
  DenseTable,
  FilterBar,
  ScoreSparkCard,
  SectionCard,
  SplitRail,
  StatStrip,
  Toolbar,
} from '@/features/dashboard/components/v2'
import { Button, Progress } from '@/components/ui'
import styles from '@/features/dashboard/styles/AnalyticsCharts.module.scss'

const PIE_COLORS = ['var(--primary)', '#22c55e', '#f59e0b', '#a855f7', '#ef4444']
const RANGES = [
  { id: '7', label: '7d' },
  { id: '30', label: '30d' },
  { id: '90', label: '90d' },
]

function toDate(ts) {
  if (!ts) return null
  const d = ts?.toDate?.() ? ts.toDate() : new Date(ts)
  return Number.isNaN(d?.getTime?.()) ? null : d
}

function dayKey(d) {
  return d.toISOString().slice(0, 10)
}

function relativeDay(ts, now = 0) {
  const d = toDate(ts)
  if (!d) return '—'
  const days = Math.round(((now || Date.now()) - d.getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function sessionPercent(s) {
  if (typeof s?.percent === 'number') return Math.round(s.percent)
  const total = Array.isArray(s?.questions) ? s.questions.length : 0
  if (total && typeof s?.totalScore === 'number') {
    return Math.round((s.totalScore / total) * 100)
  }
  return null
}

function companyMark(name) {
  const letter = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[0.65rem] font-bold">
      {letter}
    </span>
  )
}

/** [v2:analytics] Career Intelligence — cross-feature analytics across the whole app. */
export default function AnalyticsSection() {
  const apps = useTrackerStore((s) => s.apps) || []
  const loadApps = useTrackerStore((s) => s.loadApps)
  const savedJobs = useJobStore((s) => s.savedJobs) || []
  const loadSavedJobs = useJobStore((s) => s.loadSavedJobs)
  const sessions = useInterviewStore((s) => s.sessions) || []
  const loadHistory = useInterviewStore((s) => s.loadHistory)
  const profile = useProfileStore((s) => s.profile)
  const loadProfile = useProfileStore((s) => s.load)
  const user = useAppStore((s) => s.user)

  const [range, setRange] = useState('30')
  const [now] = useState(() => Date.now())
  const [gap, setGap] = useState(null)
  const [trends, setTrends] = useState([])
  const [scoreHistory, setScoreHistory] = useState([])
  const [activity, setActivity] = useState([])

  const days = Number(range) || 30

  // Pull data from every feature so the page reflects the full account.
  useEffect(() => {
    loadApps?.().catch(() => {})
    loadSavedJobs?.().catch(() => {})
    loadHistory?.({ force: false }).catch(() => {})
    loadProfile?.({ force: false }).catch(() => {})
  }, [loadApps, loadSavedJobs, loadHistory, loadProfile])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    loadScoreHistory(uid, 30).then(setScoreHistory).catch(() => {})
    loadActivity(uid, 20).then(setActivity).catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    getSkillGap({ role: getPreferredRole(profile) })
      .then(setGap)
      .catch(() => setGap(null))
    getSkillTrends({ limit: 8, mode: 'demand' })
      .then((d) => setTrends((d?.trends || d?.skills || []).slice(0, 8)))
      .catch(() => setTrends([]))
  }, [profile?.headline, profile?.preferences?.preferredRole])

  const recent = useMemo(() => {
    const since = now - days * 86400000
    return apps.filter((a) => {
      const d = toDate(a.appliedDate || a.createdAt || a.updatedAt)
      return d && d.getTime() >= since
    })
  }, [apps, days, now])

  const interviewAvg = useMemo(() => {
    const scored = sessions.map(sessionPercent).filter((n) => n != null)
    if (!scored.length) return 0
    return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
  }, [sessions])

  const scores = useMemo(
    () =>
      buildCareerScores({
        profile,
        resumeAnalysis: profile?.resumeAnalysis || null,
        interviewAvg,
        skillCoverage: gap?.coverage,
      }),
    [profile, interviewAvg, gap],
  )

  const scoreDelta = (key) => {
    const pts = (scoreHistory || []).map((h) => Number(h[key])).filter((n) => n > 0)
    if (pts.length < 2) return null
    return pts[pts.length - 1] - pts[0]
  }

  const scoreTrendPts = (key, fallback) => {
    const pts = (scoreHistory || []).map((h) => Number(h[key])).filter((n) => n > 0)
    if (pts.length >= 2) return pts.slice(-8)
    if (fallback > 0) return [Math.max(0, fallback - 6), fallback]
    return []
  }

  const timeline = useMemo(() => {
    const map = new Map()
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      map.set(dayKey(d), 0)
    }
    for (const a of recent) {
      const d = toDate(a.appliedDate || a.createdAt)
      if (!d) continue
      const k = dayKey(d)
      if (map.has(k)) map.set(k, map.get(k) + 1)
    }
    return [...map.entries()].map(([date, count]) => ({ date: date.slice(5), count }))
  }, [recent, days])

  const statusPie = useMemo(() => {
    const counts = {}
    for (const a of recent) {
      const s = a.status || 'applied'
      counts[s] = (counts[s] || 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({
      name: String(name).replace(/_/g, ' '),
      value,
    }))
  }, [recent])

  const scoresOverTime = useMemo(() => {
    return (scoreHistory || [])
      .map((h) => {
        const d = toDate(h.createdAt)
        return {
          date: d ? dayKey(d).slice(5) : '',
          career: Number(h.career) || null,
          resume: Number(h.resume) || null,
          linkedin: Number(h.linkedin) || null,
          interview: Number(h.interview) || null,
        }
      })
      .filter((r) => r.date)
  }, [scoreHistory])

  const interviewTrend = useMemo(() => {
    return (sessions || [])
      .map((s) => ({ d: toDate(s.updatedAt || s.createdAt), p: sessionPercent(s) }))
      .filter((r) => r.d && r.p != null)
      .sort((a, b) => a.d - b.d)
      .slice(-12)
      .map((r) => ({ date: dayKey(r.d).slice(5), score: r.p }))
  }, [sessions])

  const topCompanies = useMemo(() => {
    const byCo = {}
    for (const a of recent) {
      const c = a.company || 'Unknown'
      if (!byCo[c]) byCo[c] = { company: c, count: 0, stages: {}, last: null }
      const row = byCo[c]
      row.count += 1
      const st = a.status || 'applied'
      row.stages[st] = (row.stages[st] || 0) + 1
      const d = toDate(a.updatedAt || a.appliedDate || a.createdAt)
      if (d && (!row.last || d > row.last)) row.last = d
    }
    const stagePriority = [
      APPLICATION_STATUS.OFFER,
      APPLICATION_STATUS.INTERVIEW,
      APPLICATION_STATUS.IN_REVIEW,
      APPLICATION_STATUS.APPLIED,
      APPLICATION_STATUS.REJECTED,
    ]
    return Object.values(byCo)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((r) => {
        const stage = stagePriority.find((s) => r.stages[s]) || Object.keys(r.stages)[0] || '—'
        return {
          company: r.company,
          count: r.count,
          stage: String(stage).replace(/_/g, ' '),
          last: relativeDay(r.last, now),
        }
      })
  }, [recent, now])

  const funnel = useMemo(() => {
    const saved = savedJobs.length
    const applied = apps.length
    const screen = apps.filter((a) =>
      [APPLICATION_STATUS.IN_REVIEW, APPLICATION_STATUS.INTERVIEW, APPLICATION_STATUS.OFFER].includes(a.status),
    ).length
    const interview = apps.filter((a) =>
      [APPLICATION_STATUS.INTERVIEW, APPLICATION_STATUS.OFFER].includes(a.status),
    ).length
    const offer = apps.filter((a) => a.status === APPLICATION_STATUS.OFFER).length
    const pct = (num, den) => (den ? `${Math.round((num / den) * 100)}%` : '—')
    return [
      ['Saved → Applied', `${Math.min(applied, saved || applied)} / ${saved || applied || 0}`, pct(Math.min(applied, saved || applied), saved || applied || 1)],
      ['Applied → Screen', `${screen} / ${applied || 0}`, pct(screen, applied)],
      ['Screen → Interview', `${interview} / ${screen || 0}`, pct(interview, screen)],
      ['Interview → Offer', `${offer} / ${interview || 0}`, pct(offer, interview)],
    ]
  }, [apps, savedJobs])

  const interviews = recent.filter((a) => a.status === APPLICATION_STATUS.INTERVIEW).length
  const offers = recent.filter((a) => a.status === APPLICATION_STATUS.OFFER).length
  const responseRate = recent.length
    ? Math.round(((interviews + offers) / recent.length) * 100)
    : 0

  const skillRows = useMemo(() => {
    const have = new Set((gap?.haveSkills || []).map((s) => skillLabel(s)))
    return (trends || [])
      .map((t) => {
        const label = skillLabel(t)
        if (!label) return null
        const demand = Math.max(40, Math.min(100, Math.round(Number(t.importanceScore ?? t.demand ?? t.score ?? 70)) || 70))
        const you = have.has(label) ? Math.max(60, Math.min(95, demand)) : 30
        return { label, demand, you }
      })
      .filter(Boolean)
      .slice(0, 6)
  }, [trends, gap])

  const exportCsv = () => {
    const rows = [['Company', 'Role', 'Status', 'Applied'].join(',')]
    for (const a of apps) {
      rows.push([
        JSON.stringify(a.company || ''),
        JSON.stringify(a.role || ''),
        a.status || '',
        a.appliedDate || '',
      ].join(','))
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'glowminds-applications.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const shareReport = async () => {
    const text = `GlowMinds · last ${days}d — ${recent.length} apps, ${interviews} interviews, ${responseRate}% response rate`
    try {
      if (navigator.share) await navigator.share({ title: 'Career Intelligence', text })
      else await navigator.clipboard.writeText(text)
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="space-y-4">
      <Toolbar
        left={<FilterBar options={RANGES} value={range} onChange={setRange} />}
        right={(
          <>
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={exportCsv}>Export CSV</Button>
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={shareReport}>Share</Button>
          </>
        )}
      />

      {/* Career health across every feature */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        <ScoreSparkCard label="Career" value={scores.careerScore || '—'} color="primary" delta={scoreDelta('career')} trend={scoreTrendPts('career', scores.careerScore)} />
        <ScoreSparkCard label="Resume ATS" value={scores.resumeScore || '—'} color="ai" delta={scoreDelta('resume')} trend={scoreTrendPts('resume', scores.resumeScore)} />
        <ScoreSparkCard label="LinkedIn" value={scores.linkedInScore || '—'} color="success" delta={scoreDelta('linkedin')} trend={scoreTrendPts('linkedin', scores.linkedInScore)} />
        <ScoreSparkCard label="Interview" value={scores.interviewReady || '—'} color="warning" delta={scoreDelta('interview')} trend={scoreTrendPts('interview', scores.interviewReady)} />
        <ScoreSparkCard label="Skills" value={scores.skillScore || '—'} color="profile" trend={scoreTrendPts('skill', scores.skillScore)} />
      </div>

      <StatStrip
        stats={[
          ['Applications', String(recent.length)],
          ['Saved jobs', String(savedJobs.length)],
          ['Interviews', String(interviews)],
          ['Response rate', `${responseRate}%`],
          ['Offers', String(offers)],
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Applications over time" className={styles.chartCard}>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="var(--primary)" fill="color-mix(in oklab, var(--primary) 25%, transparent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Career scores over time" className={styles.chartCard}>
          <div className={styles.chartWrap}>
            {scoresOverTime.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoresOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="career" name="Career" stroke="var(--primary)" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="resume" name="Resume" stroke="var(--ai)" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="linkedin" name="LinkedIn" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="interview" name="Interview" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Score history builds as you use the dashboard. Check back after a few visits.
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Pipeline mix" className={styles.chartCard}>
          <div className={styles.chartWrap}>
            {statusPie.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {statusPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No applications yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Interview performance" className={styles.chartCard}>
          <div className={styles.chartWrap}>
            {interviewTrend.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={interviewTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" name="Score %" stroke="var(--warning)" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                {sessions.length
                  ? 'Complete a graded mock interview to see your score trend.'
                  : 'No mock interviews yet — run one from Interview practice.'}
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      <SplitRail
        main={(
          <SectionCard title="Skills · demand vs you">
            {skillRows.length ? (
              <ul className="space-y-2.5">
                {skillRows.map((s) => (
                  <li key={s.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">{s.label}</span>
                      <span className="font-mono text-muted-foreground">{s.you} / {s.demand}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-elevated">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-primary/40" style={{ width: `${s.demand}%` }} />
                      <div className="absolute inset-y-0 left-0 rounded-full bg-ai" style={{ width: `${s.you}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Skill demand appears once trends load for your role.</p>
            )}
            <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><i className="inline-block size-2 rounded-full bg-primary/40" /> Market demand</span>
              <span className="flex items-center gap-1"><i className="inline-block size-2 rounded-full bg-ai" /> You</span>
            </div>
          </SectionCard>
        )}
        rail={(
          <SectionCard title="Skill coverage" action={<span className="text-xs text-muted-foreground">{gap?.targetRole || 'Target role'}</span>}>
            <div className="mb-1 flex items-end justify-between">
              <span className="font-mono text-2xl font-bold">{gap?.coverage ?? 0}%</span>
              <span className="text-xs text-muted-foreground">covered</span>
            </div>
            <Progress value={gap?.coverage || 0} className="h-2" />
            {gap?.missingSkills?.length ? (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Top gaps to close</p>
                <div className="flex flex-wrap gap-1.5">
                  {gap.missingSkills.slice(0, 6).map((s) => (
                    <span key={skillLabel(s)} className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[0.7rem]">
                      {skillLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Add a target role to see skill gaps.</p>
            )}
          </SectionCard>
        )}
      />

      <SplitRail
        main={(
          <SectionCard title="Top companies" action={<span className="text-xs text-muted-foreground">Sort · apps</span>}>
            <DenseTable
              columns={['Company', 'Apps', 'Stage', 'Last update']}
              rows={topCompanies.map((c) => [
                <span key={c.company} className="inline-flex items-center gap-2">
                  {companyMark(c.company)}
                  <span className="truncate font-medium">{c.company}</span>
                </span>,
                String(c.count),
                <span key={`${c.company}-stage`} className="capitalize text-muted-foreground">{c.stage}</span>,
                c.last,
              ])}
              empty={<p className="text-sm text-muted-foreground">No applications in range.</p>}
            />
          </SectionCard>
        )}
        rail={(
          <SectionCard title="Conversion funnel">
            <DenseTable
              columns={['Step', 'Count', 'Conv.']}
              rows={funnel.map(([step, count, conv]) => [
                step,
                <span key={`${step}-c`} className="tabular-nums text-muted-foreground">{count}</span>,
                <span key={`${step}-p`} className="tabular-nums font-medium">{conv}</span>,
              ])}
            />
          </SectionCard>
        )}
      />

      <SectionCard title="Recent activity" action={<span className="text-xs text-muted-foreground">Across all tools</span>}>
        {activity.length ? (
          <ul className="divide-y divide-border">
            {activity.slice(0, 10).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <span className="truncate text-sm">{a.title || a.type}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{relativeDay(a.createdAt, now)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Your activity across resume, jobs, interviews and skills will appear here.</p>
        )}
      </SectionCard>
    </div>
  )
}
