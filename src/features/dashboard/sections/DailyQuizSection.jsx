import SectionHeader from '@/components/dashboard/SectionHeader'
import DailyQuizCard from '@/features/dashboard/components/DailyQuizCard'
import { motion } from 'framer-motion'
import '@/styles/cards.css'
import '@/styles/dashboard.css'

const STREAK_TIPS = [
  { ico: '🔥', label: '7-day streak', value: 'Unlocks "Week Warrior" badge' },
  { ico: '🎯', label: '30-day streak', value: 'Unlocks "Quiz Master" + 500 XP' },
  { ico: '🧠', label: 'Mix of topics', value: 'Resume · Interview · Negotiation · Tech' },
]

export default function DailyQuizSection() {
  return (
    <>
      <SectionHeader
        badge="Daily · 1 question"
        badgeBg="var(--color-prp2)"
        badgeColor="var(--color-prp)"
        title="Sharpen your career edge daily"
        accent="career edge"
        subtitle="One quick question every day across resume, interview, negotiation and tech topics. Build a streak — earn XP and unlock badges."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="card"
        >
          <div className="ch">
            <h3>🧠 Today’s Question</h3>
            <span className="text-[0.66rem] text-[var(--color-muted)]">
              Updated daily at 12:00 AM
            </span>
          </div>
          <div className="cb">
            <DailyQuizCard />
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="card"
          >
            <div className="ch"><h3>🏆 Why play?</h3></div>
            <div className="cb flex flex-col gap-3">
              {STREAK_TIPS.map((t) => (
                <div
                  key={t.label}
                  className="flex items-start gap-3 rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-3 py-2.5"
                >
                  <div className="text-xl leading-none" aria-hidden>{t.ico}</div>
                  <div className="min-w-0">
                    <div className="text-[0.78rem] font-bold text-[var(--color-txt)]">{t.label}</div>
                    <div className="text-[0.7rem] text-[var(--color-txt2)]">{t.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-[var(--color-bdr)] bg-gradient-to-br from-[var(--color-blu3)] to-[var(--color-prp2)] p-5"
          >
            <div className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--color-blu2)]">
              Pro Tip
            </div>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-[var(--color-txt)]">
              Take the quiz first thing each morning — it primes you with one
              actionable career insight before you start applying.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  )
}
