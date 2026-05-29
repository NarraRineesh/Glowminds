import { motion } from 'framer-motion'
import { AppIcon, Badge, Card, CardContent, Progress } from '@/components/ui'

const TIERS = [
  { from: 1, name: 'Rookie', className: 'text-slate-400', icon: 'plant' },
  { from: 4, name: 'Rising Star', className: 'text-primary', icon: 'star' },
  { from: 7, name: 'Trailblazer', className: 'text-emerald-500', icon: 'rocket' },
  { from: 11, name: 'Pro', className: 'text-violet-500', icon: 'admin' },
  { from: 16, name: 'Elite', className: 'text-amber-500', icon: 'crown' },
]

const NEXT_REWARDS = {
  6: { icon: 'cover-letters', label: 'Cover Letter perks' },
  7: { icon: 'rocket', label: 'Trailblazer tier' },
  10: { icon: 'gem', label: 'Pro template pack' },
  11: { icon: 'admin', label: 'Pro tier' },
  16: { icon: 'crown', label: 'Elite tier · custom badge' },
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full min-h-0"
    >
    <Card className="relative flex h-full min-h-0 flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 opacity-50 blur-3xl"
      />

      <CardContent className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="relative mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Level
          </span>
          <Badge variant="outline" className={`gap-1 bg-muted text-[0.58rem] font-bold uppercase tracking-wider ${tier.className}`}>
            <AppIcon name={tier.icon} className="size-3" />
            {tier.name}
          </Badge>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 font-mono text-2xl font-black tabular-nums text-primary-foreground shadow-[0_0_22px_color-mix(in_srgb,var(--primary)_45%,transparent),inset_0_1px_0_rgba(255,255,255,0.2)] ring-2 ring-primary/30">
            {level}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              XP <span className="text-foreground">{xp}</span>
              <span className="opacity-60"> / {totalXPForLevel}</span>
            </div>
            <Progress
              value={progress}
              className="mt-1 gap-0 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-primary [&_[data-slot=progress-indicator]]:via-primary/80 [&_[data-slot=progress-indicator]]:to-emerald-500 [&_[data-slot=progress-track]]:h-1.5"
            />
            <div className="mt-1 flex items-center justify-between text-[0.62rem]">
              <span className="text-muted-foreground">
                <strong className="text-primary">{xpToNext}</strong> to L{nextLevel}
              </span>
              <span className="font-mono font-bold tabular-nums text-primary">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {nextReward && (
          <div className="relative mt-auto flex items-center gap-2 rounded-lg border border-border bg-muted px-2 py-1.5">
            <AppIcon name={nextReward.icon} className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-[0.65rem]">
              <span className="text-muted-foreground">L{nextLevel}: </span>
              <strong className="text-foreground">{nextReward.label}</strong>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  )
}
