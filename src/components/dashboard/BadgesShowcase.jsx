import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useGamificationStore from '@/store/gamificationStore'
import { badgeXp } from '@/constants/badgesCatalog'

const TIER_RING = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: 'var(--color-gold)',
}

const SHOWCASE_COUNT = 6

export default function BadgesShowcase() {
  const navigate = useNavigate()
  const catalog = useGamificationStore((s) => s.catalog)
  const catalogLoaded = useGamificationStore((s) => s.catalogLoaded)
  const loadCatalog = useGamificationStore((s) => s.loadCatalog)
  const gamification = useGamificationStore((s) => s.gamification)

  useEffect(() => {
    if (!catalogLoaded) loadCatalog()
  }, [catalogLoaded, loadCatalog])

  const earnedSet = useMemo(
    () => new Set(gamification?.earnedBadgeIds || []),
    [gamification?.earnedBadgeIds],
  )

  const badges = useMemo(() => {
    const list = (catalog || []).map((b) => ({
      ...b,
      unlocked: earnedSet.has(b.id),
      xp: badgeXp(b),
    }))
    const sorted = [...list].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    const unlocked = sorted.filter((b) => b.unlocked)
    const locked = sorted.filter((b) => !b.unlocked)
    return [...unlocked, ...locked].slice(0, SHOWCASE_COUNT)
  }, [catalog, earnedSet])

  const totalCount = catalog?.length || 0
  const unlockedCount = (catalog || []).filter((b) => earnedSet.has(b.id)).length
  const pct = totalCount ? Math.round((unlockedCount / totalCount) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] p-3.5 shadow-sm transition-[border-color,transform,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-0.5 hover:border-[var(--color-bdr2)] sm:p-4"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-50 blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--color-gold2), transparent 70%)',
        }}
      />

      <div className="relative mb-2 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[0.88rem] font-extrabold tracking-tight text-[var(--color-txt)]">
          <span className="text-base" aria-hidden>🏆</span>
          Recent Achievements
          <span className="rounded-full border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums text-[var(--color-txt2)]">
            {unlockedCount}/{totalCount || '—'}
          </span>
        </h3>
        <button
          type="button"
          onClick={() => navigate('/dashboard/badges')}
          className="text-[0.7rem] font-semibold text-[var(--color-blu2)] transition-colors hover:text-[var(--color-blu)]"
        >
          View all →
        </button>
      </div>

      <motion.div className="relative mb-2.5 h-1 overflow-hidden rounded-full bg-[var(--color-bg3)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-prp)]"
        />
      </motion.div>

      {badges.length === 0 ? (
        <p className="relative py-6 text-center text-[0.78rem] text-[var(--color-muted)]">
          {catalogLoaded ? 'Complete activities to unlock badges' : 'Loading achievements…'}
        </p>
      ) : (
        <motion.div
          className="relative grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {badges.map((badge) => {
            const ring = TIER_RING[badge.tier] || 'var(--color-blu)'
            return (
              <motion.button
                type="button"
                key={badge.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.94 },
                  visible: { opacity: 1, scale: 1 },
                }}
                whileHover={badge.unlocked ? { scale: 1.04, y: -2 } : { scale: 1.02 }}
                onClick={() => navigate('/dashboard/badges')}
                className={`group relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-xl border p-2 text-center transition-colors ${
                  badge.unlocked
                    ? 'border-[var(--color-bdr)] bg-[var(--color-surf)] hover:border-[var(--color-bdr2)]'
                    : 'border-[var(--color-bdr)] bg-[var(--color-bg3)] hover:border-[var(--color-bdr2)]'
                }`}
                title={badge.unlocked ? `${badge.name} — unlocked` : `${badge.name} — ${badge.description || 'Keep going'}`}
              >
                {badge.unlocked && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${ring}33, transparent 70%)`,
                    }}
                  />
                )}

                <motion.div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-base ${
                    badge.unlocked ? '' : 'opacity-50 grayscale'
                  }`}
                  style={{
                    background: badge.unlocked ? 'var(--color-surf)' : 'var(--color-bg2)',
                    boxShadow: badge.unlocked
                      ? `0 0 0 2px ${ring}66, 0 0 10px ${ring}44`
                      : `0 0 0 1.5px var(--color-bdr) inset`,
                  }}
                  aria-hidden
                >
                  {badge.unlocked ? badge.icon : '🔒'}
                </motion.div>
                <div
                  className={`relative w-full truncate text-[10px] font-semibold leading-tight ${
                    badge.unlocked ? 'text-[var(--color-txt)]' : 'text-[var(--color-txt2)]'
                  }`}
                >
                  {badge.name}
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
