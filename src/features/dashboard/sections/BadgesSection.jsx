import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import useGamificationStore from '@/store/gamificationStore'
import useProfileStore from '@/store/profileStore'
import { badgeXp } from '@/constants/badgesCatalog'
import '@/styles/cards.css'
import '@/styles/dashboard.css'

const TIER_STYLE = {
  bronze: { ring: '#cd7f32', glow: 'rgba(205,127,50,.18)' },
  silver: { ring: '#c0c0c0', glow: 'rgba(192,192,192,.18)' },
  gold: { ring: 'var(--color-gold)', glow: 'rgba(210,153,34,.22)' },
}

export default function BadgesSection() {
  const catalog = useGamificationStore((s) => s.catalog)
  const catalogLoaded = useGamificationStore((s) => s.catalogLoaded)
  const loadCatalog = useGamificationStore((s) => s.loadCatalog)
  const gamification = useGamificationStore((s) => s.gamification)
  const userDoc = useProfileStore((s) => s.user)
  const loadProfile = useProfileStore((s) => s.load)
  const syncEligibleBadges = useGamificationStore((s) => s.syncEligibleBadges)

  useEffect(() => {
    if (!catalogLoaded) loadCatalog()
    if (!userDoc) loadProfile()
    syncEligibleBadges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const earnedSet = useMemo(
    () => new Set(gamification?.earnedBadgeIds || []),
    [gamification],
  )

  const badges = useMemo(() => {
    const list = (catalog || []).map((b) => ({
      ...b,
      unlocked: earnedSet.has(b.id),
      xp: badgeXp(b),
    }))
    return list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  }, [catalog, earnedSet])

  const unlocked = badges.filter((b) => b.unlocked)
  const totalXP = unlocked.reduce((s, b) => s + b.xp, 0)
  const pct = badges.length ? Math.round((unlocked.length / badges.length) * 100) : 0
  const nextBadge = badges.find((b) => !b.unlocked)

  return (
    <>
      <SectionHeader
        badge="Achievements"
        badgeBg="var(--color-gold2)"
        badgeColor="var(--color-gold)"
        title="Earn badges, level up your career"
        accent="level up"
        subtitle="Each badge unlocks XP and shows up on your profile. Some are progressive — keep using Glowminds daily to climb the tiers."
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="kpi k3">
          <div className="kpi-ic">🏆</div>
          <div className="kpi-lbl">Unlocked</div>
          <div className="kpi-val">{unlocked.length}<span className="text-[var(--color-muted)] text-[1rem]">/{badges.length}</span></div>
          <div className="kpi-sub">{pct}% complete</div>
        </div>
        <div className="kpi k1">
          <div className="kpi-ic">⚡</div>
          <div className="kpi-lbl">XP from badges</div>
          <div className="kpi-val">{totalXP}</div>
          <div className="kpi-sub">Lifetime</div>
        </div>
        <div className="kpi k4">
          <div className="kpi-ic">🎯</div>
          <div className="kpi-lbl">Next badge</div>
          <div className="kpi-val text-[1.2rem] sm:!text-[1.35rem]">{nextBadge?.name || 'Done!'}</div>
          <div className="kpi-sub">+{nextBadge?.xp || 0} XP</div>
        </div>
      </div>

      {badges.length === 0 ? (
        <div className="card">
          <div className="cb py-10 text-center text-[var(--color-muted)] text-sm">
            {catalogLoaded ? 'No badges available yet.' : 'Loading badge catalog…'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b, idx) => {
            const tier = TIER_STYLE[b.tier] || TIER_STYLE.bronze
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: idx * 0.03 }}
                whileHover={b.unlocked ? { y: -3 } : {}}
                className={`relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-4 text-center transition-colors ${
                  b.unlocked
                    ? 'cursor-pointer border-[var(--color-bdr)] bg-[var(--color-surf)] hover:border-[var(--color-bdr2)]'
                    : 'border-[var(--color-bdr)] bg-[var(--color-bg3)] opacity-60'
                }`}
                title={b.unlocked ? `${b.name} — +${b.xp} XP` : 'Locked'}
              >
                {b.unlocked && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${tier.glow}, transparent 60%)`,
                    }}
                  />
                )}

                <div
                  className="relative flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                  style={{
                    background: b.unlocked ? 'var(--color-surf)' : 'var(--color-bg3)',
                    boxShadow: b.unlocked ? `0 0 0 3px ${tier.ring}55, 0 0 18px ${tier.glow}` : 'none',
                  }}
                >
                  {b.unlocked ? b.icon : '🔒'}
                </div>

                <div className="relative text-[0.84rem] font-bold leading-tight text-[var(--color-txt)]">
                  {b.unlocked ? b.name : '???'}
                </div>
                <div className="relative text-[0.7rem] leading-snug text-[var(--color-txt2)]">
                  {b.unlocked ? b.description : 'Keep going to unlock'}
                </div>
                <div
                  className="relative mt-auto rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
                  style={{
                    color: b.unlocked ? tier.ring : 'var(--color-muted)',
                    background: b.unlocked ? `${tier.glow}` : 'var(--color-surf2)',
                  }}
                >
                  {b.tier} · +{b.xp} XP
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </>
  )
}
