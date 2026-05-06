import { motion } from 'framer-motion'

const TIERS = [
  { from: 1, name: 'Rookie', color: '#94a3b8', icon: '🌱' },
  { from: 4, name: 'Rising Star', color: 'var(--color-blu2)', icon: '⭐' },
  { from: 7, name: 'Trailblazer', color: 'var(--color-grn)', icon: '🚀' },
  { from: 11, name: 'Pro', color: 'var(--color-prp)', icon: '🛡️' },
  { from: 16, name: 'Elite', color: 'var(--color-gold)', icon: '👑' },
]

const NEXT_REWARDS = {
  6: { icon: '✉️', label: 'Cover Letter perks' },
  7: { icon: '🚀', label: 'Trailblazer tier' },
  10: { icon: '💎', label: 'Pro template pack' },
  11: { icon: '🛡️', label: 'Pro tier' },
  16: { icon: '👑', label: 'Elite tier · custom badge' },
}

function getTier(level) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (level >= TIERS[i].from) return TIERS[i]
  }
  return TIERS[0]
}

export default function LevelProgress({ level = 5, xp = 650, xpToNext = 350 }) {
  const totalXPForLevel = xp + xpToNext
  const progress = Math.min(100, Math.max(0, (xp / totalXPForLevel) * 100))
  const tier = getTier(level)
  const nextLevel = level + 1
  const nextReward = NEXT_REWARDS[nextLevel]

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-bdr2)] hover:shadow-md sm:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-50 blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--color-glow), transparent 70%)',
        }}
      />

      <div className="relative mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Level
        </span>
        <span
          className="flex items-center gap-1 rounded-full border border-[var(--color-bdr)] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider"
          style={{ background: 'var(--color-bg3)', color: tier.color }}
        >
          <span aria-hidden>{tier.icon}</span> {tier.name}
        </span>
      </div>

      <div className="relative flex items-center gap-3">
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-mono text-2xl font-black tabular-nums text-white"
          style={{
            background: 'linear-gradient(135deg, var(--color-blu), var(--color-blu2))',
            boxShadow: '0 0 22px rgba(56,139,253,.45), inset 0 1px 0 rgba(255,255,255,.2)',
          }}
        >
          {level}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-0.5 rounded-full"
            style={{ border: `2px solid ${tier.color}55` }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">
            XP <span className="text-[var(--color-txt)]">{xp}</span>
            <span className="opacity-60"> / {totalXPForLevel}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg3)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-blu)] via-[var(--color-blu2)] to-[var(--color-grn)]"
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[0.62rem]">
            <span className="text-[var(--color-txt2)]">
              <strong className="text-[var(--color-blu2)]">{xpToNext}</strong> to L{nextLevel}
            </span>
            <span className="font-mono font-bold text-[var(--color-blu2)] tabular-nums">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {nextReward && (
        <div className="relative mt-auto flex items-center gap-2 rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-2 py-1.5">
          <span className="text-sm leading-none" aria-hidden>{nextReward.icon}</span>
          <span className="min-w-0 flex-1 truncate text-[0.65rem]">
            <span className="text-[var(--color-muted)]">L{nextLevel}: </span>
            <strong className="text-[var(--color-txt)]">{nextReward.label}</strong>
          </span>
        </div>
      )}
    </div>
  )
}
