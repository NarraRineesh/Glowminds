import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAppStore from '@/store/authStore'
import useJobStore from '@/store/jobStore'
import useTrackerStore from '@/store/trackerStore'
import useNotifStore from '@/store/notifStore'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import StreakCard from '@/components/dashboard/StreakCard'
import LevelProgress from '@/components/dashboard/LevelProgress'
import QuickStats from '@/components/dashboard/QuickStats'
import BadgesShowcase from '@/components/dashboard/BadgesShowcase'
import Loader from '@/components/Loader'
import { OPEN_NOTIFS_EVENT } from '@/constants/events'
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
  const { jobs, loading: jobsLoading, fetchJobs } = useJobStore()
  const { apps, loadApps } = useTrackerStore()
  const unread = useNotifStore(s => s.notifs.filter(n => !n.read).length)

  const [profileData, setProfileData] = useState(null)

  const loadProfileData = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists() && snap.data().profile) setProfileData(snap.data().profile)
    } catch (e) { console.error('Load profile for overview:', e) }
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (jobs.length === 0) fetchJobs()
      loadApps()
      loadProfileData()
    })
    return () => cancelAnimationFrame(id)
  }, [jobs.length, fetchJobs, loadApps, loadProfileData])

  const inReview = apps.filter(a => a.status === 'In Review').length
  const interviews = apps.filter(a => a.status === 'Interview').length

  const pSkills = profileData?.skills || []
  const pEdu = profileData?.education || {}
  const pExps = Array.isArray(profileData?.experience) ? profileData.experience : []
  const pPrefs = profileData?.preferences || {}
  const pSummary = profileData?.summary || ''
  const isFresher = profileData?.isFresher || false

  const tips = [
    [!!user?.displayName, 'Complete your profile'],
    [pSkills.length >= 3, 'Add your skills'],
    [!!pEdu.degree && !!pEdu.college, 'Add education'],
    [pExps.some(e => e.company) || isFresher, 'Add experience'],
    [!!pPrefs.expectedCTC, 'Set salary expectations'],
    [!!pPrefs.github || !!pPrefs.linkedIn, 'Add GitHub or LinkedIn'],
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
      const ad = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.date)
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
        const ad = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.date)
        return ad >= b.start && ad < end
      }).length
    })
    return buckets
  }, [apps, windowDays])

  const maxBucket = Math.max(...trendBuckets.map((w) => w.count), 1)

  const responseRate = useMemo(() => {
    if (appsInWindow.length === 0) return { rate: 0, moved: 0, total: 0 }
    const moved = appsInWindow.filter((a) => a.status !== 'Applied' && a.status !== 'Rejected').length
    return { rate: Math.round((moved / appsInWindow.length) * 100), moved, total: appsInWindow.length }
  }, [appsInWindow])

  const avgDaysToResponse = useMemo(() => {
    const responded = appsInWindow.filter((a) => a.status !== 'Applied')
    if (responded.length === 0) return null
    const days = responded.map((a) => {
      const created = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.date)
      const updated = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || a.date)
      return Math.max(1, Math.round((updated - created) / 86400000))
    })
    return Math.round(days.reduce((s, d) => s + d, 0) / days.length)
  }, [appsInWindow])

  const activityGrid = useMemo(() => {
    const days = windowDays
    const grid = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i))
      d.setHours(0, 0, 0, 0)
      const next = new Date(d); next.setDate(next.getDate() + 1)
      const count = apps.filter((a) => {
        const ad = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.date)
        return ad >= d && ad < next
      }).length
      return { date: d, count }
    })
    return grid
  }, [apps, windowDays])

  const statusBreakdown = useMemo(() => {
    const m = {}
    appsInWindow.forEach((a) => { m[a.status] = (m[a.status] || 0) + 1 })
    return m
  }, [appsInWindow])

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
            Live job feed active · Remotive API ·{' '}
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-4 mb-5" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}>
        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .45, ease: [0.16,1,0.3,1] }} className="kpi k1 cursor-pointer" onClick={() => navigate('/dashboard/jobs')}>
          <div className="kpi-ic">💼</div><div className="kpi-lbl">Job Matches</div>
          <div className="kpi-val">{jobsLoading ? '…' : jobs.length}</div>
          <div className="kpi-sub">Remote jobs available</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .45, ease: [0.16,1,0.3,1] }} className="kpi k2 cursor-pointer" onClick={() => navigate('/dashboard/applications')}>
          <div className="kpi-ic">📋</div><div className="kpi-lbl">Applications</div>
          <div className="kpi-val">{apps.length}</div>
          <div className="kpi-sub">{inReview > 0 ? `${inReview} in review` : ''}{inReview > 0 && interviews > 0 ? ' · ' : ''}{interviews > 0 ? `${interviews} interview` : ''}{!inReview && !interviews ? 'Start applying!' : ''}</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .45, ease: [0.16,1,0.3,1] }} className="kpi k3 cursor-pointer" onClick={() => navigate('/dashboard/profile')}>
          <div className="kpi-ic">📄</div><div className="kpi-lbl">Profile Score</div>
          <div className="kpi-val">{profileScore}%</div>
          <div className="kpi-sub">{profileScore < 60 ? 'Needs work' : profileScore < 80 ? 'Getting there' : 'Looking great!'}</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .45, ease: [0.16,1,0.3,1] }} className="kpi k4 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent(OPEN_NOTIFS_EVENT))}>
          <div className="kpi-ic">🔔</div><div className="kpi-lbl">Alerts</div>
          <div className="kpi-val">{unread}</div>
          <div className="kpi-sub">{unread > 0 ? 'Unread notifications' : 'All caught up!'}</div>
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
              <div className="jmini cursor-pointer" key={j.id} onClick={() => navigate('/dashboard/jobs')}>
                <div className="jml bg-[var(--color-bg3)]">{j.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="jmt">{j.title}</div>
                  <div className="jmc">{j.co} · {j.loc}</div>
                </div>
                <div className="text-right">
                  <div className="jmm">{j.match}%</div>
                  <div className="text-[.62rem] text-[--color-muted]">{j.posted}</div>
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
                const statusColors = { Applied: 'var(--color-blu)', 'In Review': 'var(--color-gold)', Interview: 'var(--color-prp)', Offer: 'var(--color-grn)' }
                const sc = statusColors[a.status] || 'var(--color-blu)'
                return (
                  <div key={a.id} className="flex items-center gap-3 border-b border-[var(--color-bdr)] px-3 py-2.5 last:border-b-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg3)] text-base">{a.logo || '💼'}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.82rem] font-bold text-[var(--color-txt)]">{a.role}</div>
                      <div className="text-[0.72rem] text-[var(--color-muted)]">{a.co} · {a.date}</div>
                    </div>
                    <span
                      className="shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[0.68rem] font-bold"
                      style={{ background: `${sc}18`, color: sc }}
                    >
                      {a.status}
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
        {/* Activity Heatmap */}
        <div className="card">
          <div className="ch"><h3>🟩 Activity (Last {windowDays} days)</h3></div>
          <div className="cb px-3.5 py-3">
            <div className={`grid gap-1 ${windowDays === 7 ? 'grid-cols-7' : 'grid-cols-10'}`}>
              {activityGrid.map((d, i) => (
                <div
                  key={i}
                  title={`${d.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${d.count} apps`}
                  className="aspect-square rounded-[3px] transition-colors"
                  style={{
                    background: d.count === 0 ? 'var(--color-bg3)' : d.count === 1 ? 'rgba(46,160,67,.25)' : d.count === 2 ? 'rgba(46,160,67,.5)' : 'rgba(46,160,67,.8)',
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[0.6rem] text-[var(--color-muted)]">Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((l) => (
                  <div
                    key={l}
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{
                      background: l === 0 ? 'var(--color-bg3)' : l === 1 ? 'rgba(46,160,67,.25)' : l === 2 ? 'rgba(46,160,67,.5)' : 'rgba(46,160,67,.8)',
                    }}
                  />
                ))}
              </div>
              <span className="text-[0.6rem] text-[var(--color-muted)]">More</span>
            </div>
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
                  { status: 'Applied', color: 'var(--color-blu)', ico: '📤' },
                  { status: 'In Review', color: 'var(--color-gold)', ico: '👀' },
                  { status: 'Interview', color: 'var(--color-prp)', ico: '🎙️' },
                  { status: 'Offer', color: 'var(--color-grn)', ico: '🎉' },
                  { status: 'Rejected', color: 'var(--color-red)', ico: '❌' },
                ].map((s) => {
                  const count = statusBreakdown[s.status] || 0
                  const pct = appsInWindow.length > 0 ? Math.round((count / appsInWindow.length) * 100) : 0
                  return (
                    <div key={s.status} className="flex items-center gap-2.5">
                      <span className="w-5 shrink-0 text-center text-[0.82rem]">{s.ico}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex justify-between gap-2">
                          <span className="text-[0.74rem] font-semibold text-[var(--color-txt)]">{s.status}</span>
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

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:items-stretch lg:grid-cols-3 lg:gap-3.5 [&>*]:min-h-0">
        <StreakCard currentStreak={7} longestStreak={14} />
        <LevelProgress level={5} xp={650} xpToNext={350} />
        <QuickStats apps={apps.length} jobsSaved={12} xpEarned={250} activeDays={5} />
      </div>

      {/* Achievements */}
      <BadgesShowcase />
    </>
  )
}
