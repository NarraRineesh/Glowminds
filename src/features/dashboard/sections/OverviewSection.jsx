import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAppStore from '@/store/authStore'
import useJobStore from '@/store/jobStore'
import useTrackerStore from '@/store/trackerStore'
import useProfileStore from '@/store/profileStore'
import useGamificationStore from '@/store/gamificationStore'
import { computeXpProgress } from '@/utils/gamification'
import { profileHasEducation } from '@/utils/educationEntries'
import { auth } from '@/services/firebase'
import StreakCard from '@/components/dashboard/StreakCard'
import LevelProgress from '@/components/dashboard/LevelProgress'
import BadgesShowcase from '@/components/dashboard/BadgesShowcase'
import Loader from '@/components/Loader'
import { APPLICATION_STATUS, APPLICATION_STATUS_LABEL } from '@/constants/schema'
import '@/styles/dashboard.css'
import '@/styles/cards.css'
import '@/styles/jobs.css'

const DAILY_TIPS = [
  { ico: '💡', tip: 'Tailor your resume for each job — ATS systems rank keyword-matched resumes 60% higher.' },
  { ico: '🎯', tip: 'Apply within 48 hours of a job posting — early applicants are 3x more likely to get interviews.' },
  { ico: '📝', tip: 'Use STAR format (Situation, Task, Action, Result) in your resume bullet points.' },
  { ico: '🤝', tip: 'Follow up with recruiters 5–7 days after applying — persistence pays off.' },
  { ico: '🔗', tip: 'Add a LinkedIn URL to your resume — 87% of recruiters use LinkedIn to vet candidates.' },
  { ico: '📊', tip: 'Quantify your achievements — "Increased sales by 25%" beats "Improved sales performance".' },
  { ico: '🎓', tip: 'List relevant certifications prominently — they can compensate for less experience.' },
  { ico: '⚡', tip: 'Lead with your strongest projects on your resume — recruiters spend ~7 seconds on the first screen.' },
  { ico: '🧠', tip: 'Prepare 3 stories for behavioral rounds: conflict, failure, and leadership — reuse them across questions.' },
  { ico: '💼', tip: 'Keep your resume to one page if you have under 3 years of experience — clarity beats length.' },
  { ico: '🌐', tip: 'Mirror keywords from the job description in your skills and summary — without keyword stuffing.' },
  { ico: '📧', tip: 'Use a professional email (firstname.lastname@) — avoid nicknames and numbers when possible.' },
  { ico: '🏢', tip: 'Research the company’s product and recent news before interviews — it shows genuine interest.' },
  { ico: '💬', tip: 'End interviews with one thoughtful question — "What does success look like in the first 90 days?" works well.' },
  { ico: '🚀', tip: 'Freshers: highlight internships and academic projects with tech stack and measurable outcomes.' },
  { ico: '🔍', tip: 'Set job alerts on 2–3 platforms and batch-apply weekly — consistency beats one marathon session.' },
  { ico: '📱', tip: 'Optimize your LinkedIn headline for the role you want, not just your current title.' },
  { ico: '⏱️', tip: 'Block 30 minutes daily for applications or skill practice — small habits compound.' },
  { ico: '🛠️', tip: 'List tools you have actually used in projects — "familiar with" skills get tested in interviews.' },
  { ico: '📄', tip: 'Export your resume as PDF with embedded fonts — avoids layout breaks on recruiter screens.' },
  { ico: '🎤', tip: 'Practice answers out loud, not just in your head — it reduces filler words under pressure.' },
  { ico: '💰', tip: 'Research salary ranges before HR calls — use levels.fyi, AmbitionBox, or peer networks.' },
  { ico: '🧩', tip: 'For coding rounds, talk through your approach before typing — communication matters as much as code.' },
  { ico: '✉️', tip: 'Personalize the first line of outreach emails — mention a specific post or product, not "Dear Sir/Madam".' },
  { ico: '🔄', tip: 'Track every application in one place — follow-ups are easier when you know dates and contacts.' },
  { ico: '🌟', tip: 'Ask teammates or professors for a one-line recommendation you can quote on LinkedIn or your resume.' },
  { ico: '📅', tip: 'Schedule interviews when you are alert — morning slots often beat back-to-back evening slots.' },
  { ico: '🧘', tip: 'After a rejection, request brief feedback — many recruiters will share one actionable improvement.' },
  { ico: '🏆', tip: 'Put hackathons, open source, or club leadership in a dedicated section — they signal initiative.' },
  { ico: '🔐', tip: 'Remove "References available upon request" — it wastes space; offer references only when asked.' },
]

const TRENDING_SKILLS = [
  { name: 'React', growth: '+28%', color: '#61dafb' },
  { name: 'TypeScript', growth: '+35%', color: '#3178c6' },
  { name: 'Python', growth: '+22%', color: '#3776ab' },
  { name: 'AWS', growth: '+18%', color: '#ff9900' },
  { name: 'Docker', growth: '+24%', color: '#2496ed' },
  { name: 'Next.js', growth: '+42%', color: '#fff' },
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
  const { jobs, pagination, loading: jobsLoading, fetchJobs } = useJobStore()
  const loadProfileForJobs = useProfileStore((s) => s.load)
  const { apps, loadApps } = useTrackerStore()
  const profileData = useProfileStore((s) => s.profile)
  const loadProfileStore = useProfileStore((s) => s.load)
  const gamification = useGamificationStore((s) => s.gamification)
  const loadGamificationCatalog = useGamificationStore((s) => s.loadCatalog)
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
    // trackerStore.loaded, jobStore.savedJobsLoaded / lastFetched,
    // gamificationStore.catalogLoaded), so revisiting the Overview tab is
    // free in Firestore reads. syncEligibleBadges was removed from this
    // bootstrap on purpose — it ran on every mount and triggered up to
    // three collection scans per call. Badge re-evaluation now only happens
    // after the mutations that could actually unlock a badge (recordDailyVisit,
    // addApp/updateApp, appendMessage, completeSession, profile save).
    const id = requestAnimationFrame(() => {
      loadProfileData()
      loadProfileForJobs({ force: false }).then(() => {
        if (useJobStore.getState().jobs.length === 0) fetchJobs()
      })
      loadApps()
      loadSavedJobs()
      loadGamificationCatalog()
    })
    return () => cancelAnimationFrame(id)
  }, [fetchJobs, loadApps, loadProfileData, loadProfileForJobs, loadSavedJobs, loadGamificationCatalog])

  const streak = gamification?.streak || {}
  const streakCurrent = streak.current || 0
  const xpProgress = computeXpProgress(gamification?.xp || 0, gamification?.level)

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

  const topCategories = useMemo(() => {
    if (!jobs.length) return []
    const catMap = {}
    jobs.forEach(j => {
      const cat = j.category || j.type || 'Other'
      catMap[cat] = (catMap[cat] || 0) + 1
    })
    return Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [jobs])

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
        icon: '🎯',
        label: 'You have an interview lined up',
        body: 'Run a 10-question AI mock interview tailored to your role — practice beats nerves.',
        cta: 'Open Interview Prep',
        href: '/dashboard/interview',
        tone: 'prp',
      }
    }
    if (profileScore < 60) {
      return {
        icon: '👤',
        label: 'Finish your profile first',
        body: `You're at ${profileScore}% — every other tool gets sharper once we know your skills, experience and preferences.`,
        cta: 'Complete Profile',
        href: '/dashboard/profile',
        tone: 'blu',
      }
    }
    if (apps.length === 0) {
      return {
        icon: '🚀',
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
          icon: '📤',
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
        icon: '✨',
        label: 'Boost your response rate',
        body: `${responseRate.rate}% reply rate over ${responseRate.total} apps — let AI polish your resume and cover letters before the next batch.`,
        cta: 'Run Profile Review',
        href: '/dashboard/profile',
        tone: 'gold',
      }
    }
    if (streakCurrent < 3) {
      return {
        icon: '🔥',
        label: 'Build a 3-day apply streak',
        body: 'Consistency compounds — even 1 application per day keeps recruiters seeing you near the top.',
        cta: 'Browse Job Board',
        href: '/dashboard/jobs',
        tone: 'grn',
      }
    }
    return {
      icon: '🎓',
      label: 'Sharpen your skills with the daily quiz',
      body: 'Earn XP, keep your streak alive, and stay interview-ready while you wait for responses.',
      cta: 'Practice now',
      href: '/dashboard/interview',
      tone: 'blu',
    }
  }, [apps.length, savedJobs.length, interviews, profileScore, responseRate, streakCurrent])

  const NBA_TONE = {
    blu: { bg: 'rgba(56,139,253,.08)', bd: 'rgba(56,139,253,.25)', fg: 'var(--color-blu2)' },
    grn: { bg: 'rgba(46,160,67,.08)', bd: 'rgba(46,160,67,.25)', fg: 'var(--color-grn)' },
    gold: { bg: 'rgba(210,168,67,.08)', bd: 'rgba(210,168,67,.25)', fg: 'var(--color-gold)' },
    prp: { bg: 'rgba(163,113,247,.08)', bd: 'rgba(163,113,247,.25)', fg: 'var(--color-prp)' },
  }

  return (
    <>
      {/* Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .5, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-5 overflow-hidden rounded-2xl border border-[var(--color-bdr)] bg-gradient-to-br from-[var(--color-blu)]/[0.08] to-[var(--color-grn)]/[0.06] px-5 py-5 sm:px-6"
      >
        <div className="pointer-events-none absolute -right-2 -top-3 text-7xl opacity-[0.06] select-none sm:text-8xl" aria-hidden>
          ✨
        </div>
        <div className="relative text-[clamp(1.25rem,2.5vw,1.7rem)] font-black tracking-tight text-[var(--color-txt)]">
          {getGreeting()}, {firstName} 👋
        </div>
        <div className="relative mt-1 flex flex-wrap items-center gap-x-2 text-sm leading-relaxed text-[var(--color-txt2)]">
          <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-[var(--color-grn)] shadow-[0_0_8px_var(--color-grn)]" />
          <span>
            Live job feed active ·{' '}
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-4 mb-5" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}>
        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .45, ease: [0.16,1,0.3,1] }} className="kpi k1 cursor-pointer" onClick={() => navigate('/dashboard/jobs')}>
          <div className="kpi-ic">💼</div><div className="kpi-lbl">Job Matches</div>
          <div className="kpi-val">{jobsLoading ? '…' : (pagination.total || jobs.length)}</div>
          <div className="kpi-sub">Remote jobs available</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .45, ease: [0.16,1,0.3,1] }} className="kpi k2 cursor-pointer" onClick={() => navigate('/dashboard/applications')}>
          <div className="kpi-ic">📋</div><div className="kpi-lbl">Applications</div>
          <div className="kpi-val">{apps.length}</div>
          <div className="kpi-sub">{apps.length === 0 ? 'Start applying!' : inReview > 0 ? `${inReview} in review` : 'Track every apply'}</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .45, ease: [0.16,1,0.3,1] }} className="kpi k3 cursor-pointer" onClick={() => navigate('/dashboard/jobs')}>
          <div className="kpi-ic">🔖</div><div className="kpi-lbl">Saved Jobs</div>
          <div className="kpi-val">{savedJobs.length}</div>
          <div className="kpi-sub">{savedJobs.length > 0 ? 'Ready to apply' : 'Bookmark roles you like'}</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .45, ease: [0.16,1,0.3,1] }} className="kpi k4 cursor-pointer" onClick={() => navigate('/dashboard/applications')}>
          <div className="kpi-ic">🎤</div><div className="kpi-lbl">Interviews</div>
          <div className="kpi-val">{interviews}</div>
          <div className="kpi-sub">{interviews > 0 ? `${interviews} scheduled · prep with AI` : 'None yet — keep applying!'}</div>
        </motion.div>
      </motion.div>

      {/* Row 1: Top Jobs + Profile Strength */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] xl:grid-cols-[minmax(0,2fr)_minmax(260px,340px)] mb-4">
        <div className="card">
          <div className="ch"><h3>🎯 Top Job Matches</h3><button className="btn btn-gh btn-sm" onClick={() => navigate('/dashboard/jobs')}>View All →</button></div>
          <div className="cb p-2.5">
            {jobsLoading && <Loader variant="block" label="Loading jobs…" size={28} />}
            {!jobsLoading && jobs.length === 0 && <div className="text-center text-[--color-muted] py-4">No jobs yet. Check back soon!</div>}
            {!jobsLoading && jobs.slice(0, 5).map((j) => (
              <div className="jmini cursor-pointer" key={j.id} onClick={() => navigate(`/dashboard/jobs/${encodeURIComponent(j.id)}`)}>
                <div className="jml bg-[var(--color-bg3)]">{j.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="jmt">{j.title}</div>
                  <div className="jmc">
                    {(j.company || j.co) && (
                      <span className="jmc-part"><span className="jmc-ico" aria-hidden>🏢</span><span className="jmc-text">{j.company || j.co}</span></span>
                    )}
                    {(j.location || j.loc) && (
                      <span className="jmc-part"><span className="jmc-ico" aria-hidden>{j.remote ? '🌐' : '📍'}</span><span className="jmc-text">{j.location || j.loc}</span></span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="jmm">{j.match}%</div>
                  <div className="text-[.62rem] text-[--color-muted]" style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                    <span aria-hidden>🕒</span>{j.posted}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="ch"><h3>📊 Profile Strength</h3></div>
          <div className="cb text-center">
            <div className="relative mx-auto mb-3 h-[100px] w-[100px]">
              <svg className="absolute inset-0" width="100" height="100" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(56,139,253,.12)" strokeWidth="6" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#ov-g1)" strokeWidth="6"
                  strokeLinecap="round" strokeDasharray="276.5" strokeDashoffset={276.5 - (276.5 * profileScore / 100)}
                  transform="rotate(-90 50 50)" className="transition-[stroke-dashoffset] duration-500 ease-out" />
                <defs>
                  <linearGradient id="ov-g1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#388bfd" /><stop offset="100%" stopColor="#3fb950" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute left-2 top-2 flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--color-blu)] to-[var(--color-grn)] text-2xl font-black text-white">
                {user?.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : (user?.displayName?.[0] || 'U').toUpperCase()}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 rounded-lg border-2 border-[var(--color-bdr)] bg-[var(--color-surf)] px-1.5 py-px text-[0.68rem] font-extrabold ${profileScore >= 80 ? 'text-[var(--color-grn)]' : 'text-[var(--color-blu2)]'}`}>{profileScore}%</div>
            </div>
            {tips.map(([done, text], i) => (
              <div key={i} className="mb-1.5 flex items-center gap-2 text-[0.76rem]">
                <span className={done ? 'text-[--color-grn]' : 'text-[--color-muted]'}>{done ? '✅' : '○'}</span>
                <span className={done ? 'text-[--color-txt]' : 'text-[--color-txt2]'}>{text}</span>
              </div>
            ))}
            <button className="btn btn-o btn-sm btn-w mt-3" onClick={() => navigate('/dashboard/profile')}>Complete Profile</button>
          </div>
        </div>
      </div>

      {/* Row 2: Recent Applications + Daily Tip */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] xl:grid-cols-[minmax(0,2fr)_minmax(260px,340px)] mb-4">
        <div className="card">
          <div className="ch"><h3>📋 Recent Applications</h3><button className="btn btn-gh btn-sm" onClick={() => navigate('/dashboard/applications')}>View All →</button></div>
          <div className="cb">
            {recentApps.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mb-2 text-3xl">📭</div>
                <div className="mb-3 text-sm text-[var(--color-txt2)]">No applications tracked yet</div>
                <button type="button" className="btn btn-p btn-sm" onClick={() => navigate('/dashboard/jobs')}>Browse Jobs & Apply →</button>
              </div>
            ) : (
              recentApps.map((a) => {
                const statusColors = {
                  [APPLICATION_STATUS.APPLIED]: 'var(--color-blu)',
                  [APPLICATION_STATUS.IN_REVIEW]: 'var(--color-gold)',
                  [APPLICATION_STATUS.INTERVIEW]: 'var(--color-prp)',
                  [APPLICATION_STATUS.OFFER]: 'var(--color-grn)',
                  [APPLICATION_STATUS.REJECTED]: 'var(--color-red, #e5534b)',
                }
                const sc = statusColors[a.status] || 'var(--color-blu)'
                return (
                  <div key={a.id} className="flex items-center gap-3 border-b border-[var(--color-bdr)] px-3 py-2.5 last:border-b-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg3)] text-base">{a.logo || '💼'}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.82rem] font-bold text-[var(--color-txt)]">{a.role}</div>
                      <div className="text-[0.72rem] text-[var(--color-muted)]">{a.company} · {a.appliedDate}</div>
                    </div>
                    <span
                      className="shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[0.68rem] font-bold"
                      style={{ background: `${sc}18`, color: sc }}
                    >
                      {APPLICATION_STATUS_LABEL[a.status] || a.status}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="ch"><h3>💡 Daily Career Tip</h3></div>
          <div className="cb flex min-h-[120px] flex-col justify-center px-4 py-5">
            <div className="mb-2 text-center text-3xl">{dailyTip.ico}</div>
            <p className="text-center text-[0.82rem] leading-relaxed text-[var(--color-txt2)]">{dailyTip.tip}</p>
          </div>
        </div>
      </div>

      {/* Time-window filter pills */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[0.78rem] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
          📊 Analytics window
        </div>
        <div className="inline-flex rounded-xl border border-[var(--color-bdr)] bg-[var(--color-surf)] p-1 shadow-sm">
          {[
            { id: 7, label: '7 days' },
            { id: 30, label: '30 days' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setWindowDays(opt.id)}
              className={`rounded-lg px-3 py-1.5 text-[0.74rem] font-bold transition-colors ${
                windowDays === opt.id
                  ? 'bg-gradient-to-r from-[var(--color-blu)] to-[var(--color-grn)] text-white shadow-md shadow-[var(--color-blu)]/20'
                  : 'text-[var(--color-txt2)] hover:text-[var(--color-txt)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] xl:grid-cols-[minmax(0,2fr)_minmax(260px,340px)] mb-4">
        {/* Application Timeline Chart */}
        <div className="card">
          <div className="ch"><h3>📈 Application Timeline</h3><span className="text-[0.66rem] text-[var(--color-muted)]">Last {windowDays} days</span></div>
          <div className="cb px-3.5 py-3">
            {appsInWindow.length === 0 ? (
              <div className="py-6 text-center text-[0.8rem] text-[var(--color-muted)]">No applications in this window — switch to {windowDays === 7 ? '30' : '7'} days or start applying</div>
            ) : (
              <div className="flex h-[100px] items-end gap-1.5 sm:gap-2">
                {trendBuckets.map((w, i) => (
                  <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <span className={`font-mono text-[0.58rem] font-bold ${w.count > 0 ? 'text-[var(--color-blu2)]' : 'text-[var(--color-muted)]'}`}>{w.count || ''}</span>
                    <div
                      className="w-full max-w-[32px] rounded-t transition-[height] duration-300 ease-out"
                      style={{
                        height: `${Math.max(4, (w.count / maxBucket) * 70)}px`,
                        background: w.count > 0 ? 'linear-gradient(180deg, var(--color-blu), rgba(56,139,253,.4))' : 'var(--color-bg3)',
                      }}
                    />
                    <span className="whitespace-nowrap text-[0.52rem] text-[var(--color-muted)]">{w.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="ch"><h3>📊 Response Rate</h3></div>
          <div className="cb flex min-h-[100px] flex-col items-center justify-center px-3 py-4">
            {appsInWindow.length === 0 ? (
              <div className="text-center text-[0.8rem] text-[var(--color-muted)]">No data in this window</div>
            ) : (
              <>
                <div className="relative mb-2.5 h-20 w-20">
                  <svg className="absolute inset-0" width="80" height="80" viewBox="0 0 80 80" aria-hidden>
                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-bg3)" strokeWidth="7" />
                    <circle cx="40" cy="40" r="34" fill="none" strokeWidth="7" strokeLinecap="round"
                      stroke={responseRate.rate >= 50 ? 'var(--color-grn)' : responseRate.rate >= 25 ? 'var(--color-gold)' : 'var(--color-blu)'}
                      strokeDasharray="213.6" strokeDashoffset={213.6 - (213.6 * responseRate.rate / 100)}
                      transform="rotate(-90 40 40)" className="transition-[stroke-dashoffset] duration-500 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-[1.05rem] font-black">{responseRate.rate}%</div>
                </div>
                <div className="text-center text-[0.74rem] leading-relaxed text-[var(--color-txt2)]">
                  <strong>{responseRate.moved}</strong> of <strong>{responseRate.total}</strong> apps got responses
                  {avgDaysToResponse && (
                    <>
                      <br />
                      Avg response:{' '}
                      <strong className="text-[var(--color-blu2)]">{avgDaysToResponse}d</strong>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Next Best Action — smart, data-driven nudge that replaces the
            heatmap (which duplicated the timeline series). Picks ONE thing
            to do next based on profile completion, app pipeline state,
            response rate and streak. */}
        <div
          className="card"
          style={{
            borderColor: NBA_TONE[nextBestAction.tone].bd,
            background: NBA_TONE[nextBestAction.tone].bg,
          }}
        >
          <div className="ch"><h3>🧭 Next best action</h3></div>
          <div className="cb px-4 py-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ background: 'var(--color-surf)', border: `1px solid ${NBA_TONE[nextBestAction.tone].bd}` }}
                aria-hidden
              >
                {nextBestAction.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[0.86rem] font-extrabold leading-tight"
                  style={{ color: NBA_TONE[nextBestAction.tone].fg }}
                >
                  {nextBestAction.label}
                </div>
                <div className="mt-1 text-[0.78rem] leading-relaxed text-[var(--color-txt2)]">
                  {nextBestAction.body}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-p btn-sm self-start"
              onClick={() => navigate(nextBestAction.href)}
            >
              {nextBestAction.cta} →
            </button>
          </div>
        </div>

        <div className="card">
          <div className="ch"><h3>🏷️ Status Breakdown</h3></div>
          <div className="cb">
            {appsInWindow.length === 0 ? (
              <div className="py-6 text-center text-[0.8rem] text-[var(--color-muted)]">No applications in this window</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {[
                  { status: APPLICATION_STATUS.APPLIED, color: 'var(--color-blu)', ico: '📤' },
                  { status: APPLICATION_STATUS.IN_REVIEW, color: 'var(--color-gold)', ico: '👀' },
                  { status: APPLICATION_STATUS.INTERVIEW, color: 'var(--color-prp)', ico: '🎙️' },
                  { status: APPLICATION_STATUS.OFFER, color: 'var(--color-grn)', ico: '🎉' },
                  { status: APPLICATION_STATUS.REJECTED, color: 'var(--color-red)', ico: '❌' },
                ].map((s) => {
                  const count = statusBreakdown[s.status] || 0
                  const pct = appsInWindow.length > 0 ? Math.round((count / appsInWindow.length) * 100) : 0
                  const label = APPLICATION_STATUS_LABEL[s.status] || s.status
                  return (
                    <div key={s.status} className="flex items-center gap-2.5">
                      <span className="w-5 shrink-0 text-center text-[0.82rem]">{s.ico}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex justify-between gap-2">
                          <span className="text-[0.74rem] font-semibold text-[var(--color-txt)]">{label}</span>
                          <span className="shrink-0 font-mono text-[0.68rem] font-extrabold" style={{ color: s.color }}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-md bg-[var(--color-bg3)]">
                          <div className="h-full rounded-md transition-[width] duration-300 ease-out" style={{ width: `${pct}%`, background: s.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Trending Skills */}
        <div className="card">
          <div className="ch"><h3>🔥 Trending Skills</h3></div>
          <div className="cb">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TRENDING_SKILLS.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="truncate text-[0.78rem] font-semibold text-[var(--color-txt)]">{s.name}</span>
                  </div>
                  <span className="shrink-0 text-[0.68rem] font-bold text-[var(--color-grn)]">{s.growth}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="ch"><h3>📁 Job Categories</h3></div>
          <div className="cb">
            {topCategories.length === 0 && !jobsLoading && (
              <div className="py-4 text-center text-[0.8rem] text-[--color-muted]">Categories load with jobs</div>
            )}
            {jobsLoading && <Loader variant="block" size={28} />}
            {topCategories.map(([cat, count]) => {
              const pct = Math.round((count / jobs.length) * 100)
              return (
                <div key={cat} className="mb-3 last:mb-0">
                  <div className="mb-1 flex justify-between gap-2">
                    <span className="text-[0.78rem] font-semibold text-[var(--color-txt)]">{cat}</span>
                    <span className="text-[0.7rem] text-[var(--color-muted)]">{count} jobs · {pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-md bg-[var(--color-bg3)]">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-[var(--color-blu)] to-[var(--color-grn)] transition-[width] duration-300 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:items-stretch md:gap-3.5 [&>*]:min-h-0">
        <StreakCard currentStreak={streak.current || 0} longestStreak={streak.longest || 0} />
        <LevelProgress level={xpProgress.level} xp={xpProgress.xp} xpToNext={xpProgress.xpToNext} />
      </div>

      {/* Achievements */}
      <BadgesShowcase />
    </>
  )
}
