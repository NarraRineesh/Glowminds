import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useGamificationStore from '@/store/gamificationStore'
import { badgeXp } from '@/constants/badgesCatalog'
import AppIcon from '@/components/icons/AppIcon'
import { Badge, Button, Card, CardContent, Progress, cn } from '@/components/ui'

const TIER_RING = {
  bronze: 'border-amber-700/40 shadow-amber-700/30',
  silver: 'border-slate-400/40 shadow-slate-400/30',
  gold: 'border-amber-500/40 shadow-amber-500/30',
}

const SHOWCASE_COUNT = 6

export default function BadgesShowcase({ className }) {
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
      className={cn('h-full min-h-0', className)}
    >
      <Card className="relative flex h-full min-h-0 flex-col overflow-hidden transition-[border-color,transform,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-0.5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 opacity-50 blur-3xl"
        />

        <CardContent className="flex flex-1 flex-col p-3.5 sm:p-4">
          <div className="relative mb-2 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-[0.88rem] font-extrabold tracking-tight text-foreground">
              <AppIcon name="trophy" className="size-4 text-amber-500" />
              Recent Achievements
              <Badge variant="outline" className="text-[0.6rem] font-bold tabular-nums">
                {unlockedCount}/{totalCount || '—'}
              </Badge>
            </h3>
            <Button variant="link" size="sm" className="h-auto px-0 text-[0.7rem]" onClick={() => navigate('/dashboard/badges')}>
              View all →
            </Button>
          </div>

          <Progress
            value={pct}
            className="relative mb-2.5 gap-0 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-amber-500 [&_[data-slot=progress-indicator]]:to-violet-500 [&_[data-slot=progress-track]]:h-1"
          />

          {badges.length === 0 ? (
            <p className="relative py-6 text-center text-[0.78rem] text-muted-foreground">
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
                const ringClass = TIER_RING[badge.tier] || 'border-primary/40 shadow-primary/30'
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
                        ? 'border-border bg-card hover:border-primary/30'
                        : 'border-border bg-muted hover:border-primary/30'
                    }`}
                    title={badge.unlocked ? `${badge.name} — unlocked` : `${badge.name} — ${badge.description || 'Keep going'}`}
                  >
                    {badge.unlocked && (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_70%)]"
                      />
                    )}

                    <div
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full text-base shadow-md ${
                        badge.unlocked
                          ? `bg-card ${ringClass}`
                          : 'bg-muted opacity-50 grayscale ring-1 ring-inset ring-border'
                      }`}
                      aria-hidden
                    >
                      {badge.unlocked ? (
                        <AppIcon name={badge.icon} className="size-4" weight="fill" />
                      ) : (
                        <AppIcon name="lock" className="size-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div
                      className={`relative w-full truncate text-[10px] font-semibold leading-tight ${
                        badge.unlocked ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {badge.name}
                    </div>
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
