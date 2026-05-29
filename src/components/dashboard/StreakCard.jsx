import { motion } from 'framer-motion'
import { AppIcon, Badge, Card, CardContent, Progress } from '@/components/ui'

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
      className="h-full min-h-0"
    >
      <Card className="relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 opacity-50 blur-3xl"
        />

        <CardContent className="flex flex-1 flex-col p-3.5 sm:p-4">
          <div className="relative mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Active days
            </span>
            <Badge variant="outline" className="gap-1 border-amber-500/20 bg-amber-500/10 text-[0.58rem] font-bold uppercase tracking-wider text-amber-500">
              <AppIcon name="trophy" className="size-3" />
              Best {longestStreak}d
            </Badge>
          </div>

          <div className="relative flex items-center gap-3">
            <motion.span
              animate={{ scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="select-none leading-none text-amber-500"
              aria-hidden
            >
              <AppIcon name="fire" className="size-8" weight="fill" />
            </motion.span>
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="bg-gradient-to-br from-amber-500 to-amber-400 bg-clip-text font-mono text-[2rem] font-black tabular-nums text-transparent">
                {currentStreak}
              </span>
              <span className="text-sm font-bold text-amber-500">days</span>
            </div>
          </div>

          <div className="relative mt-3 flex items-center justify-between gap-1">
            {week.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded text-[0.55rem] font-bold transition-colors ${
                    d.isFuture
                      ? 'bg-muted text-muted-foreground opacity-50'
                      : d.inStreak
                        ? 'bg-gradient-to-br from-amber-500 to-amber-400 text-white shadow-sm shadow-amber-500/40'
                        : 'border border-border bg-muted text-muted-foreground'
                  } ${d.isToday ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-card' : ''}`}
                  title={d.isToday ? 'Today' : d.isFuture ? 'Upcoming' : d.inStreak ? 'On streak' : 'Missed'}
                >
                  {d.inStreak && !d.isFuture ? <AppIcon name="fire" className="size-2.5 text-white" weight="fill" /> : ''}
                </div>
                <span className="text-[0.55rem] font-semibold text-muted-foreground">{d.letter}</span>
              </div>
            ))}
          </div>

          <div className="relative mt-auto border-t border-border pt-2.5">
            <div className="mb-1 flex items-center justify-between text-[0.66rem]">
              <span className="truncate text-muted-foreground">
                Next: <strong className="text-foreground">{next.label}</strong>
              </span>
              <span className="flex shrink-0 items-center gap-0.5 font-bold text-amber-500">
                {daysToNext === 0 ? <AppIcon name="trophy" className="size-3.5" /> : `${daysToNext}d`}
              </span>
            </div>
            <Progress
              value={milestoneProgress}
              className="gap-0 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-amber-500 [&_[data-slot=progress-indicator]]:to-amber-400 [&_[data-slot=progress-track]]:h-1"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
