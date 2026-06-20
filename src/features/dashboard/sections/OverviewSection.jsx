import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useJobStore from '@/store/jobStore'
import useTrackerStore from '@/store/trackerStore'
import useProfileStore from '@/store/profileStore'
import { profileHasEducation } from '@/utils/educationEntries'
import { auth } from '@/services/firebase'
import Loader from '@/components/Loader'
import { APPLICATION_STATUS, APPLICATION_STATUS_LABEL } from '@/constants/schema'
import JobMiniRow from '@/features/dashboard/components/JobMiniRow'
import {
  AppIcon,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  ButtonGroup,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DashboardCard,
  KpiCard,
  Progress,
  StatusBadge,
  cn,
} from '@/components/ui'

const NBA_TONE = {
  blu: { card: 'border-primary/25 bg-primary/10', icon: 'border-primary/25 bg-card', text: 'text-primary' },
  grn: { card: 'border-emerald-500/25 bg-emerald-500/10', icon: 'border-emerald-500/25 bg-card', text: 'text-emerald-500' },
  gold: { card: 'border-amber-500/25 bg-amber-500/10', icon: 'border-amber-500/25 bg-card', text: 'text-amber-500' },
  prp: { card: 'border-purple-500/25 bg-purple-500/10', icon: 'border-purple-500/25 bg-card', text: 'text-purple-500' },
}

const STATUS_PROGRESS = {
  [APPLICATION_STATUS.APPLIED]: '[&_[data-slot=progress-indicator]]:bg-primary',
  [APPLICATION_STATUS.IN_REVIEW]: '[&_[data-slot=progress-indicator]]:bg-amber-500',
  [APPLICATION_STATUS.INTERVIEW]: '[&_[data-slot=progress-indicator]]:bg-purple-500',
  [APPLICATION_STATUS.OFFER]: '[&_[data-slot=progress-indicator]]:bg-emerald-500',
  [APPLICATION_STATUS.REJECTED]: '[&_[data-slot=progress-indicator]]:bg-destructive',
}

const STATUS_TEXT = {
  [APPLICATION_STATUS.APPLIED]: 'text-primary',
  [APPLICATION_STATUS.IN_REVIEW]: 'text-amber-500',
  [APPLICATION_STATUS.INTERVIEW]: 'text-purple-500',
  [APPLICATION_STATUS.OFFER]: 'text-emerald-500',
  [APPLICATION_STATUS.REJECTED]: 'text-destructive',
}

const SKILL_DOT = {
  React: 'bg-sky-400',
  TypeScript: 'bg-blue-600',
  Python: 'bg-blue-500',
  AWS: 'bg-amber-500',
  Docker: 'bg-sky-500',
  'Next.js': 'bg-foreground',
}

function bucketBarHeight(count, max) {
  if (!count) return 'h-1'
  const p = count / max
  if (p >= 0.85) return 'h-20'
  if (p >= 0.65) return 'h-16'
  if (p >= 0.45) return 'h-12'
  if (p >= 0.25) return 'h-8'
  return 'h-4'
}

const DAILY_TIPS = [
  { ico: 'lightbulb', tip: 'Tailor your resume for each job — ATS systems rank keyword-matched resumes 60% higher.' },
  { ico: 'target', tip: 'Apply within 48 hours of a job posting — early applicants are 3x more likely to get interviews.' },
  { ico: 'pencil', tip: 'Use STAR format (Situation, Task, Action, Result) in your resume bullet points.' },
  { ico: 'handshake', tip: 'Follow up with recruiters 5–7 days after applying — persistence pays off.' },
  { ico: 'link', tip: 'Add a LinkedIn URL to your resume — 87% of recruiters use LinkedIn to vet candidates.' },
  { ico: 'chart', tip: 'Quantify your achievements — "Increased sales by 25%" beats "Improved sales performance".' },
  { ico: 'graduation', tip: 'List relevant certifications prominently — they can compensate for less experience.' },
  { ico: 'lightning', tip: 'Lead with your strongest projects on your resume — recruiters spend ~7 seconds on the first screen.' },
  { ico: 'brain', tip: 'Prepare 3 stories for behavioral rounds: conflict, failure, and leadership — reuse them across questions.' },
  { ico: 'jobs', tip: 'Keep your resume to one page if you have under 3 years of experience — clarity beats length.' },
  { ico: 'globe', tip: 'Mirror keywords from the job description in your skills and summary — without keyword stuffing.' },
  { ico: 'envelope', tip: 'Use a professional email (firstname.lastname@) — avoid nicknames and numbers when possible.' },
  { ico: 'buildings', tip: 'Research the company’s product and recent news before interviews — it shows genuine interest.' },
  { ico: 'chat', tip: 'End interviews with one thoughtful question — "What does success look like in the first 90 days?" works well.' },
  { ico: 'rocket', tip: 'Freshers: highlight internships and academic projects with tech stack and measurable outcomes.' },
  { ico: 'search', tip: 'Set job alerts on 2–3 platforms and batch-apply weekly — consistency beats one marathon session.' },
  { ico: 'mobile', tip: 'Optimize your LinkedIn headline for the role you want, not just your current title.' },
  { ico: 'timer', tip: 'Block 30 minutes daily for applications or skill practice — small habits compound.' },
  { ico: 'wrench', tip: 'List tools you have actually used in projects — "familiar with" skills get tested in interviews.' },
  { ico: 'resume', tip: 'Export your resume as PDF with embedded fonts — avoids layout breaks on recruiter screens.' },
  { ico: 'microphone', tip: 'Practice answers out loud, not just in your head — it reduces filler words under pressure.' },
  { ico: 'salary', tip: 'Research salary ranges before HR calls — use levels.fyi, AmbitionBox, or peer networks.' },
  { ico: 'puzzle', tip: 'For coding rounds, talk through your approach before typing — communication matters as much as code.' },
  { ico: 'cover-letters', tip: 'Personalize the first line of outreach emails — mention a specific post or product, not "Dear Sir/Madam".' },
  { ico: 'paraphrase', tip: 'Track every application in one place — follow-ups are easier when you know dates and contacts.' },
  { ico: 'star', tip: 'Ask teammates or professors for a one-line recommendation you can quote on LinkedIn or your resume.' },
  { ico: 'calendar', tip: 'Schedule interviews when you are alert — morning slots often beat back-to-back evening slots.' },
  { ico: 'leaf', tip: 'After a rejection, request brief feedback — many recruiters will share one actionable improvement.' },
  { ico: 'trophy', tip: 'Put hackathons, open source, or club leadership in a dedicated section — they signal initiative.' },
  { ico: 'lock', tip: 'Remove "References available upon request" — it wastes space; offer references only when asked.' },
]

const TRENDING_SKILLS = [
  { name: 'React', growth: '+28%' },
  { name: 'TypeScript', growth: '+35%' },
  { name: 'Python', growth: '+22%' },
  { name: 'AWS', growth: '+18%' },
  { name: 'Docker', growth: '+24%' },
  { name: 'Next.js', growth: '+42%' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function OverviewSection() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const {
    topMatches,
    topMatchesLoading,
    topMatchesError,
    fetchTopMatches,
  } = useJobStore()
  const loadProfileForJobs = useProfileStore((s) => s.load)
  const { apps, loadApps } = useTrackerStore()
  const profileData = useProfileStore((s) => s.profile)
  const loadProfileStore = useProfileStore((s) => s.load)
  const savedJobs = useJobStore((s) => s.savedJobs)
  const loadSavedJobs = useJobStore((s) => s.loadSavedJobs)

  const loadProfileData = useCallback(async () => {
    if (!auth.currentUser?.uid) return
    try {
      await loadProfileStore({ force: false })
    } catch (e) { console.error('Load profile for overview:', e) }
  }, [loadProfileStore])

  useEffect(() => {
    // `jobs.length` is intentionally NOT in the deps array — it's only read
    // as a gate, not consumed. Re-including it caused the whole bootstrap
    // bundle to re-fire every time the jobs cache flipped from 0 → N.
    //
    // Every load below is cache-aware (see profileStore.loaded,
    // trackerStore.loaded, jobStore.savedJobsLoaded / lastFetched), so
    // revisiting the Overview tab stays light on Firestore reads.
    // Top matches for overview cards; job board loads on /dashboard/jobs only.
    const id = requestAnimationFrame(() => {
      loadProfileData()
      loadProfileForJobs({ force: false }).catch(() => {})
      if (useJobStore.getState().topMatches.length === 0) {
        fetchTopMatches({ limit: 5 }).catch(() => {})
      }
      loadApps()
      loadSavedJobs()
    })
    return () => cancelAnimationFrame(id)
  }, [fetchTopMatches, loadApps, loadProfileData, loadProfileForJobs, loadSavedJobs])

  const inReview = apps.filter(a => a.status === APPLICATION_STATUS.IN_REVIEW).length
  const interviews = apps.filter(a => a.status === APPLICATION_STATUS.INTERVIEW).length

  const pSkillsTechnical = profileData?.skills?.technical || []
  const pEduHas = profileHasEducation(profileData || {})
  const pExps = Array.isArray(profileData?.experience) ? profileData.experience : []
  const pPrefs = profileData?.preferences || {}
  const pLinks = profileData?.links || {}
  const pSummary = profileData?.summary || ''
  const isFresher = profileData?.isFresher || false

  const tips = [
    [!!user?.displayName, 'Complete your profile'],
    [pSkillsTechnical.length >= 3, 'Add your skills'],
    [pEduHas, 'Add education'],
    [isFresher || pExps.some((e) => e.company || e.role), 'Add experience'],
    [!!pPrefs.expectedCTC, 'Set salary expectations'],
    [!!pLinks.github || !!pLinks.linkedin, 'Add GitHub or LinkedIn'],
    [!!pSummary, 'Write a summary'],
    [!!user?.photoURL, 'Add profile photo'],
  ]
  const profileScore = Math.round((tips.filter(([d]) => d).length / tips.length) * 100)

  const [dailyTip] = useState(() => {
    const dayIdx = Math.floor(Date.now() / 86400000) % DAILY_TIPS.length
    return DAILY_TIPS[dayIdx]
  })

  const recentApps = apps.slice(0, 4)
  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Student'

  // ── Time-window filter (7d / 30d) — applied to all analytics ──
  const [windowDays, setWindowDays] = useState(30)
  const windowStart = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - windowDays)
    d.setHours(0, 0, 0, 0)
    return d
  }, [windowDays])

  const appsInWindow = useMemo(() => {
    return apps.filter((a) => {
      const ad = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.appliedDate)
      return ad >= windowStart
    })
  }, [apps, windowStart])

  // ── Analytics computations (driven by windowed apps) ──
  const trendBuckets = useMemo(() => {
    // 7d → 7 daily buckets, 30d → ~6 weekly-ish buckets (we use 5-day chunks for nicer chart)
    const isShort = windowDays <= 7
    const bucketCount = isShort ? 7 : 6
    const bucketSize = Math.max(1, Math.round(windowDays / bucketCount))

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const start = new Date()
      start.setDate(start.getDate() - (bucketCount - i) * bucketSize)
      start.setHours(0, 0, 0, 0)
      return { start, count: 0, label: '' }
    })

    buckets.forEach((b, i) => {
      const end = i < buckets.length - 1 ? buckets[i + 1].start : new Date()
      b.label = isShort
        ? b.start.toLocaleDateString('en-IN', { weekday: 'short' })
        : b.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      b.count = apps.filter((a) => {
        const ad = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.appliedDate)
        return ad >= b.start && ad < end
      }).length
    })
    return buckets
  }, [apps, windowDays])

  const maxBucket = Math.max(...trendBuckets.map((w) => w.count), 1)

  const responseRate = useMemo(() => {
    if (appsInWindow.length === 0) return { rate: 0, moved: 0, total: 0 }
    const moved = appsInWindow.filter((a) => a.status !== APPLICATION_STATUS.APPLIED && a.status !== APPLICATION_STATUS.REJECTED).length
    return { rate: Math.round((moved / appsInWindow.length) * 100), moved, total: appsInWindow.length }
  }, [appsInWindow])

  const avgDaysToResponse = useMemo(() => {
    const responded = appsInWindow.filter((a) => a.status !== APPLICATION_STATUS.APPLIED)
    if (responded.length === 0) return null
    const days = responded.map((a) => {
      const created = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.appliedDate)
      const updated = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || a.appliedDate)
      return Math.max(1, Math.round((updated - created) / 86400000))
    })
    return Math.round(days.reduce((s, d) => s + d, 0) / days.length)
  }, [appsInWindow])

  const statusBreakdown = useMemo(() => {
    const m = {}
    appsInWindow.forEach((a) => { m[a.status] = (m[a.status] || 0) + 1 })
    return m
  }, [appsInWindow])

  // Single highest-leverage next action, derived from the current user state.
  // The order matters: earlier branches win, so list them most-blocking first.
  const nextBestAction = useMemo(() => {
    if (interviews > 0) {
      return {
        icon: 'target',
        label: 'You have an interview lined up',
        body: 'Run a 10-question AI mock interview tailored to your role — practice beats nerves.',
        cta: 'Open Interview Prep',
        href: '/dashboard/interview',
        tone: 'prp',
      }
    }
    if (profileScore < 60) {
      return {
        icon: 'user',
        label: 'Finish your profile first',
        body: `You're at ${profileScore}% — every other tool gets sharper once we know your skills, experience and preferences.`,
        cta: 'Complete Profile',
        href: '/dashboard/profile',
        tone: 'blu',
      }
    }
    if (apps.length === 0) {
      return {
        icon: 'rocket',
        label: 'Apply to your first 3 roles',
        body: 'We pulled live matches based on your skills. Bookmark, apply, and we’ll track everything for you.',
        cta: 'Browse Job Board',
        href: '/dashboard/jobs',
        tone: 'grn',
      }
    }
    if (savedJobs.length > 0 && apps.length > 0) {
      const ratio = apps.length / Math.max(1, apps.length + savedJobs.length)
      if (ratio < 0.5) {
        return {
          icon: 'send',
          label: `You have ${savedJobs.length} saved jobs waiting`,
          body: 'Convert your shortlist into applications — generate a tailored cover letter with one click.',
          cta: 'See Saved Jobs',
          href: '/dashboard/jobs',
          tone: 'gold',
        }
      }
    }
    if (responseRate.total >= 5 && responseRate.rate < 25) {
      return {
        icon: 'sparkle',
        label: 'Boost your response rate',
        body: `${responseRate.rate}% reply rate over ${responseRate.total} apps — let AI polish your resume and cover letters before the next batch.`,
        cta: 'Run Profile Review',
        href: '/dashboard/profile',
        tone: 'gold',
      }
    }
    if (savedJobs.length === 0) {
      return {
        icon: 'bookmark',
        label: 'Save roles worth revisiting',
        body: 'Bookmark promising jobs as you browse so you can compare and apply in focused batches.',
        cta: 'Find roles',
        href: '/dashboard/jobs',
        tone: 'grn',
      }
    }
    return {
      icon: 'microphone',
      label: 'Practice for your next interview',
      body: 'Use Interview Prep to warm up with role-specific MCQs and review your weak areas.',
      cta: 'Start practice',
      href: '/dashboard/interview',
      tone: 'blu',
    }
  }, [apps.length, savedJobs.length, interviews, profileScore, responseRate])

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-emerald-500/10">
        <CardHeader className="relative">
          <AppIcon name="sparkle" className="pointer-events-none absolute right-4 top-4 size-16 text-primary opacity-10" />
          <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">
            {getGreeting()}, {firstName}
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
            Live job feed active ·{' '}
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard icon="jobs" label="Job Matches" value={topMatchesLoading ? '…' : topMatches.length} sub="Matched to your profile" accent={1} onClick={() => navigate('/dashboard/jobs')} />
        <KpiCard icon="applications" label="Applications" value={apps.length} sub={apps.length === 0 ? 'Start applying!' : inReview > 0 ? `${inReview} in review` : 'Track every apply'} accent={2} onClick={() => navigate('/dashboard/applications')} />
        <KpiCard icon="bookmark" label="Saved Jobs" value={savedJobs.length} sub={savedJobs.length > 0 ? 'Ready to apply' : 'Bookmark roles you like'} accent={4} onClick={() => navigate('/dashboard/jobs')} />
        <KpiCard icon="microphone" label="Interviews" value={interviews} sub={interviews > 0 ? `${interviews} scheduled · prep with AI` : 'None yet — keep applying!'} accent={1} onClick={() => navigate('/dashboard/applications')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardCard
          className="h-full lg:col-span-2"
          titleIcon="target"
          title="Top Job Matches"
          action={<Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/jobs')}>View all</Button>}
          contentClassName="p-2"
        >
          {topMatchesLoading ? (
            <Loader variant="block" label="Loading jobs…" />
          ) : topMatchesError ? (
            <div className="py-8 text-center text-sm">
              <p className="text-destructive">{topMatchesError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchTopMatches({ limit: 5, force: true })}>
                Retry
              </Button>
            </div>
          ) : topMatches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No jobs yet. Check back soon!</p>
          ) : (
            topMatches.slice(0, 5).map((j) => (
              <JobMiniRow key={j.id} job={j} onClick={() => navigate(`/dashboard/jobs/${encodeURIComponent(j.id)}`)} />
            ))
          )}
        </DashboardCard>

        <DashboardCard className="h-full" titleIcon="chart" title="Profile Strength" contentClassName="space-y-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar className="size-16 ring-2 ring-primary/30">
              {user?.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
              <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                {(user?.displayName?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="w-full space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className={cn('font-bold tabular-nums', profileScore >= 80 ? 'text-emerald-500' : 'text-primary')}>
                  {profileScore}%
                </span>
              </div>
              <Progress value={profileScore} className="gap-0 [&_[data-slot=progress-track]]:h-2" />
            </div>
          </div>
          <ul className="space-y-2">
            {tips.map(([done, text], i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <AppIcon
                  name="check-circle"
                  className={cn('size-4 shrink-0', done ? 'text-emerald-500' : 'text-muted-foreground/40')}
                  weight={done ? 'fill' : 'regular'}
                />
                <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{text}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/dashboard/profile')}>
            Complete profile
          </Button>
        </DashboardCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCard
          className="h-full"
          titleIcon="applications"
          title="Recent Applications"
          action={<Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/applications')}>View all</Button>}
          contentClassName="p-0"
        >
          {recentApps.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <AppIcon name="inbox" className="size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No applications tracked yet</p>
              <Button size="sm" onClick={() => navigate('/dashboard/jobs')}>Browse jobs</Button>
            </div>
          ) : (
            recentApps.map((a) => (
              <div key={a.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {a.logo && /^https?:\/\//.test(a.logo) ? (
                    <img src={a.logo} alt="" className="size-full rounded-lg object-cover" />
                  ) : (
                    <AppIcon name={a.logo || 'jobs'} className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.role}</p>
                  <p className="text-xs text-muted-foreground">{a.company} · {a.appliedDate}</p>
                </div>
                <StatusBadge
                  tone={
                    a.status === APPLICATION_STATUS.OFFER ? 'success'
                      : a.status === APPLICATION_STATUS.REJECTED ? 'destructive'
                        : a.status === APPLICATION_STATUS.IN_REVIEW ? 'warning'
                          : a.status === APPLICATION_STATUS.INTERVIEW ? 'purple'
                            : 'default'
                  }
                  className="shrink-0 text-xs"
                >
                  {APPLICATION_STATUS_LABEL[a.status] || a.status}
                </StatusBadge>
              </div>
            ))
          )}
        </DashboardCard>

        <DashboardCard className="h-full" titleIcon="lightbulb" title="Daily Career Tip" contentClassName="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <AppIcon name={dailyTip.ico} className="size-10 text-primary" />
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{dailyTip.tip}</p>
        </DashboardCard>
      </div>

      <DashboardCard
        titleIcon="ai"
        title="Next best action"
        className={NBA_TONE[nextBestAction.tone].card}
        contentClassName="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl border', NBA_TONE[nextBestAction.tone].icon)}>
            <AppIcon name={nextBestAction.icon} className={cn('size-5', NBA_TONE[nextBestAction.tone].text)} />
          </div>
          <div className="min-w-0">
            <p className={cn('font-semibold', NBA_TONE[nextBestAction.tone].text)}>{nextBestAction.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{nextBestAction.body}</p>
          </div>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => navigate(nextBestAction.href)}>
          {nextBestAction.cta}
        </Button>
      </DashboardCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AppIcon name="chart" className="size-4 text-primary" />
          Analytics
        </h2>
        <ButtonGroup>
          {[
            { id: 7, label: '7 days' },
            { id: 30, label: '30 days' },
          ].map((opt) => (
            <Button
              key={opt.id}
              type="button"
              size="sm"
              variant={windowDays === opt.id ? 'default' : 'outline'}
              onClick={() => setWindowDays(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCard
          className="h-full"
          titleIcon="trend-up"
          title="Application timeline"
          action={<span className="text-xs text-muted-foreground">Last {windowDays} days</span>}
          contentClassName="px-4 pb-4"
        >
          {appsInWindow.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No applications in this window — try {windowDays === 7 ? '30' : '7'} days or start applying.
            </p>
          ) : (
            <div className="flex h-28 items-end gap-2">
              {trendBuckets.map((w, i) => (
                <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className={cn('text-xs font-medium tabular-nums', w.count > 0 ? 'text-primary' : 'text-muted-foreground')}>
                    {w.count || ''}
                  </span>
                  <div className={cn('w-full max-w-8 rounded-t bg-primary', bucketBarHeight(w.count, maxBucket), !w.count && 'bg-muted')} />
                  <span className="truncate text-[10px] text-muted-foreground">{w.label}</span>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

        <DashboardCard className="h-full" titleIcon="chart" title="Response rate" contentClassName="flex flex-col items-center justify-center gap-3 py-4">
          {appsInWindow.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data in this window</p>
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums">{responseRate.rate}%</p>
              <Progress
                value={responseRate.rate}
                className={cn(
                  'w-full max-w-xs gap-0 [&_[data-slot=progress-track]]:h-2',
                  responseRate.rate >= 50
                    ? '[&_[data-slot=progress-indicator]]:bg-emerald-500'
                    : responseRate.rate >= 25
                      ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
                      : '[&_[data-slot=progress-indicator]]:bg-primary',
                )}
              />
              <p className="text-center text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{responseRate.moved}</span> of{' '}
                <span className="font-semibold text-foreground">{responseRate.total}</span> apps got responses
                {avgDaysToResponse ? (
                  <> · avg <span className="font-semibold text-primary">{avgDaysToResponse}d</span></>
                ) : null}
              </p>
            </>
          )}
        </DashboardCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCard className="h-full" titleIcon="tag" title="Status breakdown" contentClassName="space-y-3">
          {appsInWindow.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No applications in this window</p>
          ) : (
            [
              { status: APPLICATION_STATUS.APPLIED, ico: 'applied' },
              { status: APPLICATION_STATUS.IN_REVIEW, ico: 'review' },
              { status: APPLICATION_STATUS.INTERVIEW, ico: 'microphone' },
              { status: APPLICATION_STATUS.OFFER, ico: 'offer' },
              { status: APPLICATION_STATUS.REJECTED, ico: 'rejected' },
            ].map((s) => {
              const count = statusBreakdown[s.status] || 0
              const pct = appsInWindow.length > 0 ? Math.round((count / appsInWindow.length) * 100) : 0
              const label = APPLICATION_STATUS_LABEL[s.status] || s.status
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <AppIcon name={s.ico} className={cn('size-4 shrink-0', STATUS_TEXT[s.status])} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="font-medium">{label}</span>
                      <span className={cn('tabular-nums', STATUS_TEXT[s.status])}>{count} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className={cn('gap-0 [&_[data-slot=progress-track]]:h-1.5', STATUS_PROGRESS[s.status])} />
                  </div>
                </div>
              )
            })
          )}
        </DashboardCard>

        <DashboardCard className="h-full" titleIcon="fire" title="Trending skills" contentClassName="grid gap-2 sm:grid-cols-2">
          {TRENDING_SKILLS.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn('size-2 shrink-0 rounded-full', SKILL_DOT[s.name] || 'bg-primary')} />
                <span className="truncate text-sm font-medium">{s.name}</span>
              </div>
              <span className="shrink-0 text-xs font-semibold text-emerald-500">{s.growth}</span>
            </div>
          ))}
        </DashboardCard>
      </div>
    </div>
  )
}
