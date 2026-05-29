import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import { AppIcon, Badge, DashboardCard, KpiCard, CardGrid, cn } from '@/components/ui'
import useGamificationStore from '@/store/gamificationStore'
import useProfileStore from '@/store/profileStore'
import { badgeXp } from '@/constants/badgesCatalog'

const TIER_STYLE = {
  bronze: { ring: '#cd7f32', glow: 'rgba(205,127,50,.18)' },
  silver: { ring: '#c0c0c0', glow: 'rgba(192,192,192,.18)' },
  gold: { ring: '#f59e0b', glow: 'rgba(245,158,11,.22)' },
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
        badgeClassName="border-amber-500/20 bg-amber-500/10 text-amber-500"
        title="Earn badges, level up your career"
        accent="level up"
        subtitle="Each badge unlocks XP and shows up on your profile. Some are progressive — keep using Glowminds daily to climb the tiers."
      />

      <CardGrid variant="kpi3" className="mb-5">
        <KpiCard icon="trophy" label="Unlocked" value={<>{unlocked.length}<span className="text-base text-muted-foreground">/{badges.length}</span></>} sub={`${pct}% complete`} accent={3} />
        <KpiCard icon="lightning" label="XP from badges" value={totalXP} sub="Lifetime" accent={1} />
        <KpiCard icon="target" label="Next badge" value={nextBadge?.name || 'Done!'} sub={`+${nextBadge?.xp || 0} XP`} accent={4} className="[&_.text-2xl]:text-[1.2rem] sm:[&_.text-2xl]:text-[1.35rem]" />
      </CardGrid>

      {badges.length === 0 ? (
        <DashboardCard contentClassName="py-10 text-center text-sm text-muted-foreground">
          {catalogLoaded ? 'No badges available yet.' : 'Loading badge catalog…'}
        </DashboardCard>
      ) : (
        <CardGrid variant="tiles">
          {badges.map((b, idx) => {
            const tier = TIER_STYLE[b.tier] || TIER_STYLE.bronze
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: idx * 0.03 }}
                whileHover={b.unlocked ? { y: -3 } : {}}
                className={cn(
                  'relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-4 text-center transition-colors',
                  b.unlocked
                    ? 'cursor-pointer border-border bg-card hover:border-ring/30'
                    : 'border-border bg-muted opacity-60',
                )}
                title={b.unlocked ? `${b.name} — +${b.xp} XP` : 'Locked'}
              >
                {b.unlocked && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${tier.glow}, transparent 60%)` }}
                  />
                )}

                <div
                  className={cn(
                    'relative flex h-14 w-14 items-center justify-center rounded-full text-2xl',
                    b.unlocked ? 'bg-card' : 'bg-muted',
                  )}
                  style={{
                    boxShadow: b.unlocked ? `0 0 0 3px ${tier.ring}55, 0 0 18px ${tier.glow}` : 'none',
                  }}
                >
                  {b.unlocked ? <AppIcon name={b.icon} className="size-7" /> : <AppIcon name="lock" className="size-6 text-muted-foreground" />}
                </div>

                <div className="relative text-[0.84rem] font-bold leading-tight text-foreground">
                  {b.unlocked ? b.name : '???'}
                </div>
                <div className="relative text-[0.7rem] leading-snug text-muted-foreground">
                  {b.unlocked ? b.description : 'Keep going to unlock'}
                </div>
                <Badge
                  variant="outline"
                  className="relative mt-auto text-[0.6rem] font-bold uppercase tracking-wider"
                  style={{
                    color: b.unlocked ? tier.ring : undefined,
                    background: b.unlocked ? tier.glow : undefined,
                  }}
                >
                  {b.tier} · +{b.xp} XP
                </Badge>
              </motion.div>
            )
          })}
        </CardGrid>
      )}
    </>
  )
}
