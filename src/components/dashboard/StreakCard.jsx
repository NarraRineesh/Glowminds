import { motion } from 'framer-motion'

const MILESTONES = [
  { at: 7, label: 'Week Warrior' },
  { at: 14, label: 'Fortnight' },
  { at: 30, label: 'Monthly Master' },
  { at: 60, label: 'Streak Legend' },
  { at: 100, label: 'Centurion' },
]

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function buildLast7Days(currentStreak) {
  const today = new Date()
  const todayDow = (today.getDay() + 6) % 7 // make Mon = 0
  return Array.from({ length: 7 }, (_, i) => {
    const offset = i - todayDow
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    const isFuture = offset > 0
    const isToday = offset === 0
    // mark `currentStreak` consecutive days ending today as active
    const inStreak = !isFuture && offset > -currentStreak
    return { letter: DAY_LETTERS[i], isToday, isFuture, inStreak }
  })
}

export default function StreakCard({ currentStreak = 0, longestStreak = 0 }) {
  const next = MILESTONES.find((m) => m.at > currentStreak) || MILESTONES[MILESTONES.length - 1]
  const daysToNext = Math.max(0, next.at - currentStreak)
  const milestoneProgress = Math.min(100, Math.round((currentStreak / next.at) * 100))
  const week = buildLast7Days(currentStreak)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-bdr2)] hover:shadow-md sm:p-4"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-50 blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--color-gold2), transparent 70%)',
        }}
      />

      <div className="relative mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Active days
        </span>
        <span className="rounded-full border border-[var(--color-bdr)] bg-[var(--color-gold2)] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-[var(--color-gold)]">
          🏆 Best {longestStreak}d
        </span>
      </div>

      <div className="relative flex items-center gap-3">
        <motion.span
          animate={{ scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="select-none text-[2rem] leading-none"
          aria-hidden
        >
          🔥
        </motion.span>
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="bg-gradient-to-br from-[var(--color-gold)] to-[#f59e0b] bg-clip-text font-mono text-[2rem] font-black tabular-nums text-transparent">
            {currentStreak}
          </span>
          <span className="text-sm font-bold text-[var(--color-gold)]">days</span>
        </div>
      </div>

      {/* Last-7-days strip */}
      <div className="relative mt-3 flex items-center justify-between gap-1">
        {week.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded text-[0.55rem] font-bold transition-colors ${
                d.isFuture
                  ? 'bg-[var(--color-bg3)] text-[var(--color-muted)] opacity-50'
                  : d.inStreak
                    ? 'bg-gradient-to-br from-[var(--color-gold)] to-[#f59e0b] text-white shadow-sm shadow-[var(--color-gold)]/40'
                    : 'border border-[var(--color-bdr)] bg-[var(--color-bg3)] text-[var(--color-muted)]'
              } ${d.isToday ? 'ring-2 ring-[var(--color-gold)] ring-offset-1 ring-offset-[var(--color-surf)]' : ''}`}
              title={d.isToday ? 'Today' : d.isFuture ? 'Upcoming' : d.inStreak ? 'On streak' : 'Missed'}
            >
              {d.inStreak && !d.isFuture ? '🔥' : ''}
            </div>
            <span className="text-[0.55rem] font-semibold text-[var(--color-muted)]">{d.letter}</span>
          </div>
        ))}
      </div>

      {/* Next milestone */}
      <div className="relative mt-auto border-t border-[var(--color-bdr)] pt-2.5">
        <div className="mb-1 flex items-center justify-between text-[0.66rem]">
          <span className="truncate text-[var(--color-txt2)]">
            Next: <strong className="text-[var(--color-txt)]">{next.label}</strong>
          </span>
          <span className="shrink-0 font-bold text-[var(--color-gold)]">
            {daysToNext === 0 ? '🎉' : `${daysToNext}d`}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[var(--color-bg3)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${milestoneProgress}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-gold)] to-[#f59e0b]"
          />
        </div>
      </div>
    </motion.div>
  )
}
