import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useJobStore from '@/store/jobStore'
import useTrackerStore from '@/store/trackerStore'
import useProfileStore from '@/store/profileStore'
import useInterviewStore from '@/store/interviewStore'
import { profileReadyForJobMatches } from '@/utils/jobMatchProfile'
import { APPLICATION_STATUS, getPreferredRole, normalizeGamification } from '@/constants/schema'
import JobMiniRow from '@/features/dashboard/components/JobMiniRow'
import { getSkillGap } from '@/services/skillsApi'
import { loadActivity } from '@/services/activityLog'
import {
  loadScoreHistory,
  recordActivityDay,
  snapshotScores,
  xpToNextLevel,
} from '@/services/gamification'
import { auth } from '@/services/firebase'
import { buildActionPlan, buildCareerScores } from '@/utils/v2Scores'
import { skillLabel } from '@/utils/skillLabel'
import { v2Debug } from '@/utils/v2Debug'
import {
  ActionPlanList,
  MatchBar,
  ScoreSparkCard,
  SectionCard,
  StatStrip,
  StreakCard,
  TimelineList,
} from '@/features/dashboard/components/v2'
import { AppIcon, Button } from '@/components/ui'

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts?.toDate?.() ? ts.toDate() : new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function trendFromHistory(history, key, fallback) {
  const pts = (history || []).map((h) => Number(h[key])).filter((n) => n > 0)
  if (pts.length >= 2) return pts.slice(-6)
  if (fallback > 0) return [Math.max(0, fallback - 8), Math.max(0, fallback - 4), fallback]
  return []
}

export default function OverviewSection() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const { topMatches, fetchTopMatches, loadSavedJobs } = useJobStore()
  const { apps, loadApps } = useTrackerStore()
  const profile = useProfileStore((s) => s.profile)
  const loadProfile = useProfileStore((s) => s.load)
  const patchUserDoc = useProfileStore((s) => s.patchUserDoc)
  const sessions = useInterviewStore((s) => s.sessions) || []

  const [gap, setGap] = useState(null)
  const [activity, setActivity] = useState([])
  const [scoreHistory, setScoreHistory] = useState([])
  const [focusDismissed, setFocusDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('gm_focus_dismissed') === '1'
    } catch {
      return false
    }
  })

  const interviewAvg = useMemo(() => {
    const scored = sessions.filter((s) => typeof s.totalScore === 'number' || s.percent != null)
    if (!scored.length) return 0
    const sum = scored.reduce((a, s) => a + (s.percent ?? s.totalScore ?? 0), 0)
    return Math.round(sum / scored.length)
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

  const gamification = useMemo(
    () => normalizeGamification(profile?.gamification),
    [profile?.gamification],
  )
  const xpMeta = xpToNextLevel(gamification)

  const readyForMatches = profileReadyForJobMatches(profile)
  const actionPlan = useMemo(
    () => buildActionPlan({ profile, apps, scores, readyForMatches }),
    [profile, apps, scores, readyForMatches],
  )
  const focus = actionPlan[0]

  const upcomingInterviews = useMemo(
    () => apps.filter((a) => a.status === APPLICATION_STATUS.INTERVIEW).slice(0, 4),
    [apps],
  )

  const suggestion = useMemo(() => {
    const tip = profile?.aiReview?.suggestions?.[0] || profile?.aiReview?.tips?.[0]
    if (typeof tip === 'string' && tip.trim()) return tip
    if (tip?.text) return tip.text
    if (gap?.missingSkills?.[0]) {
      return `Prioritize learning ${skillLabel(gap.missingSkills[0])} to close your top skill gap.`
    }
    if (scores.resumeScore > 0 && scores.resumeScore < 85) {
      return 'Raise your ATS score toward 85+ before your next interview.'
    }
    return 'Lead with measurable outcomes in your summary for Staff-level roles.'
  }, [profile, gap, scores.resumeScore])

  const appStats = useMemo(() => {
    const c = { applied: 0, review: 0, interview: 0, rejected: 0 }
    for (const a of apps || []) {
      if (a.status === APPLICATION_STATUS.INTERVIEW || a.status === APPLICATION_STATUS.OFFER) c.interview += 1
      else if (a.status === APPLICATION_STATUS.IN_REVIEW) c.review += 1
      else if (a.status === APPLICATION_STATUS.REJECTED) c.rejected += 1
      else c.applied += 1
    }
    return c
  }, [apps])

  const atsScore = scores.resumeScore || 0

  useEffect(() => {
    loadProfile({ force: false }).catch(() => {})
    loadApps().catch(() => {})
    loadSavedJobs().catch(() => {})
    fetchTopMatches({ limit: 6 }).catch(() => {})
    useInterviewStore.getState().loadHistory({ force: false }).catch(() => {})
  }, [loadProfile, loadApps, loadSavedJobs, fetchTopMatches])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    loadActivity(uid, 12).then(setActivity)
    loadScoreHistory(uid, 12).then(setScoreHistory)
    recordActivityDay(uid).then((g) => {
      if (g) loadProfile({ force: true }).catch(() => {})
    })
  }, [user?.uid, loadProfile])

  useEffect(() => {
    getSkillGap({ role: getPreferredRole(profile) })
      .then((data) => {
        setGap(data)
        v2Debug('dashboard', 'skill gap', data?.coverage)
      })
      .catch(() => setGap(null))
  }, [profile?.headline, profile?.preferences?.preferredRole, profile])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid || !scores.careerScore) return
    const t = setTimeout(() => {
      snapshotScores(uid, {
        career: scores.careerScore,
        resume: scores.resumeScore,
        linkedin: scores.linkedInScore,
        interview: scores.interviewReady,
        profile: scores.profileReview || scores.careerScore,
      })
    }, 800)
    return () => clearTimeout(t)
  }, [scores.careerScore, scores.resumeScore, scores.linkedInScore, scores.interviewReady, scores.profileReview])

  const activityItems = activity.map((a) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    when: timeAgo(a.createdAt),
  }))

  const unlockedBadges = (gamification.badges || []).map((b) => ({
    id: b.id,
    title: b.title || b.id,
    subtitle: 'Unlocked',
  }))
  const badgeDisplay = [
    ...unlockedBadges,
    { id: 'offers', title: '5 offers', locked: true },
    { id: 'streak30', title: '30-day streak', locked: true },
  ].slice(0, 3)

  const showStreak = gamification.prefs?.showStreakOnDashboard !== false
  const firstName = user?.firstName || user?.displayName?.split?.(' ')?.[0] || ''

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 sm:gap-4">
      {firstName ? (
        <p className="m-0 text-sm text-muted-foreground">
          Hi, <span className="font-medium text-foreground">{firstName}</span>
        </p>
      ) : null}

      {/* 1. Focus */}
      {!focusDismissed && focus && (
        <div className="flex items-center gap-2 rounded-xl border border-border border-l-[3px] border-l-warning bg-card px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
          <div className="min-w-0 flex-1">
            <span className="text-[0.65rem] text-muted-foreground sm:text-xs">Today’s focus</span>
            <p className="m-0 truncate text-sm font-semibold tracking-tight sm:text-[15px]">{focus.title}</p>
            {focus.hint ? (
              <p className="mt-0.5 mb-0 truncate text-[0.7rem] text-muted-foreground sm:text-xs">{focus.hint}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Dismiss focus"
              title="Dismiss"
              onClick={() => {
                try {
                  sessionStorage.setItem('gm_focus_dismissed', '1')
                } catch { /* */ }
                setFocusDismissed(true)
                patchUserDoc({ settings: { dismissedFocusId: focus.id } }).catch(() => {})
              }}
            >
              <AppIcon name="x" className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              className="size-8"
              aria-label="Open focus"
              title="Open"
              onClick={() => focus.to && navigate(focus.to)}
            >
              <AppIcon name="arrow-right" className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 2. Score sparklines */}
      <div className="grid min-w-0 grid-cols-2 gap-2.5 lg:grid-cols-4 [&>*]:min-w-0">
        <ScoreSparkCard
          label="Career"
          value={scores.careerScore || '—'}
          color="primary"
          trend={trendFromHistory(scoreHistory, 'career', scores.careerScore)}
        />
        <ScoreSparkCard
          label="Resume"
          value={scores.resumeScore || '—'}
          color="ai"
          trend={trendFromHistory(scoreHistory, 'resume', scores.resumeScore)}
        />
        <ScoreSparkCard
          label="LinkedIn"
          value={scores.linkedInScore || '—'}
          color="success"
          trend={trendFromHistory(scoreHistory, 'linkedin', scores.linkedInScore)}
        />
        <ScoreSparkCard
          label="Interview"
          value={scores.interviewReady || '—'}
          color="warning"
          trend={trendFromHistory(scoreHistory, 'interview', scores.interviewReady)}
        />
      </div>

      {/* Application pipeline stats */}
      <StatStrip
        stats={[
          ['Applied', String(appStats.applied)],
          ['In review', String(appStats.review)],
          ['Interview', String(appStats.interview)],
          ['Rejected', String(appStats.rejected)],
        ]}
      />

      {/* 3. Work cards — flat list so mobile order can lift Suggested after Action plan */}
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1.35fr_1fr] lg:items-start lg:gap-3">
        <SectionCard
          className="order-1 min-w-0 lg:col-start-1 lg:row-start-1"
          title="Action plan"
          action={<span className="text-xs text-muted-foreground">{actionPlan.filter((i) => i.done).length} / {actionPlan.length || 0}</span>}
        >
          <ActionPlanList items={actionPlan} onItemClick={(item) => item.to && navigate(item.to)} />
        </SectionCard>

        <SectionCard
          className="order-2 min-w-0 lg:col-start-2 lg:row-start-1"
          title="Suggested"
          action={<span className="rounded-md bg-ai/15 px-1.5 py-0.5 text-[10px] font-medium text-ai">AI</span>}
        >
          <p className="mt-0 mb-3 text-sm leading-relaxed font-medium">{suggestion}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="bg-ai text-background hover:bg-ai/90" onClick={() => navigate('/dashboard/resume')}>
              Apply to resume
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => navigate('/dashboard/ai')}>
              Why this?
            </Button>
          </div>
        </SectionCard>

        <SectionCard
          className="order-3 min-w-0 lg:col-start-1 lg:row-start-2"
          title="Upcoming interviews"
          action={<Link to="/dashboard/applications" className="text-xs font-medium text-primary">CRM</Link>}
        >
          {upcomingInterviews.length === 0 ? (
            <div className="space-y-3">
              <p className="m-0 text-sm text-muted-foreground">No interviews scheduled yet.</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => navigate('/dashboard/applications')}>
                  Open applications
                </Button>
                <Button type="button" size="sm" onClick={() => navigate('/dashboard/interview')}>
                  Start prep
                </Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {upcomingInterviews.map((a) => (
                <li key={a.id} className="flex items-center gap-2.5 rounded-lg border border-border px-2.5 py-2">
                  <AppIcon name="buildings" className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8rem] font-semibold">{a.role} · {a.company}</p>
                    <p className="truncate text-[0.68rem] text-muted-foreground">
                      {a.nextStep || a.interviewDate || 'In pipeline'}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => navigate('/dashboard/interview')}>
                    Prep
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          className="order-4 min-w-0 lg:col-start-2 lg:row-start-2"
          title="Job matches"
          action={<Link to="/dashboard/jobs" className="text-xs font-medium text-primary">See all</Link>}
        >
          {!readyForMatches ? (
            <div className="space-y-3">
              <p className="m-0 text-sm text-muted-foreground">Add skills on your profile to unlock matches.</p>
              <Button type="button" size="sm" onClick={() => navigate('/dashboard/profile')}>
                Add skills
              </Button>
            </div>
          ) : topMatches?.length ? (
            <div className="space-y-1">
              {topMatches.slice(0, 3).map((j) => (
                <div key={j.id}>
                  <JobMiniRow job={j} onClick={() => navigate(`/dashboard/jobs/${encodeURIComponent(j.id)}`)} />
                  {j.matchScore != null && <MatchBar value={j.matchScore} />}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="m-0 text-sm text-muted-foreground">No matches yet.</p>
              <Button type="button" size="sm" variant="outline" onClick={() => navigate('/dashboard/jobs')}>
                Browse jobs
              </Button>
            </div>
          )}
        </SectionCard>

        <SectionCard className="order-5 min-w-0 lg:col-start-1 lg:row-start-3" title="Goals & activity">
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <strong className="text-sm">ATS ≥ 85</strong>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, atsScore)}%` }} />
                </div>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{atsScore || '—'}</span>
            </div>
          </div>
          <TimelineList items={activityItems.slice(0, 3)} />
        </SectionCard>

        <SectionCard
          className="order-6 min-w-0 lg:col-start-2 lg:row-start-3"
          title="Learning"
          action={(
            <Button type="button" size="sm" variant="outline" onClick={() => navigate('/dashboard/learning')}>
              Continue
            </Button>
          )}
        >
          {gap ? (
            <>
              <strong className="text-sm">{gap.targetRole || 'Skill path'}</strong>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
                <div className="h-full rounded-full bg-primary" style={{ width: `${gap.coverage || 0}%` }} />
              </div>
              <p className="mt-2 mb-0 text-xs text-muted-foreground">
                Coverage {gap.coverage || 0}%
                {gap.missingSkills?.[0] ? ` · next: ${skillLabel(gap.missingSkills[0])}` : ''}
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <p className="m-0 text-sm text-muted-foreground">Start a learning path to close skill gaps for your target role.</p>
              <Button type="button" size="sm" onClick={() => navigate('/dashboard/learning')}>
                Open Learning
              </Button>
            </div>
          )}
        </SectionCard>

        {showStreak && (
          <SectionCard
            className="order-7 min-w-0 lg:col-start-2 lg:row-start-4"
            title="Streak & rewards"
            action={<span className="rounded-md border border-border px-1.5 py-0.5 text-[10px]">Level {gamification.level}</span>}
          >
            <StreakCard
              streak={gamification.streak}
              bestStreak={gamification.bestStreak}
              level={gamification.level}
              xp={gamification.xpWeek || xpMeta.xpInLevel}
              xpToNext={xpMeta.xpToNext}
              weekActive={gamification.weekActive}
              badges={badgeDisplay}
            />
          </SectionCard>
        )}
      </div>

    </div>
  )
}
