const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** Streak + XP + optional badge strip. */
export default function StreakCard({
  streak = 0,
  bestStreak = 0,
  level = 1,
  xp = 0,
  xpToNext = 500,
  weekActive = [],
  badges = [],
  xpHint,
}) {
  const pct = Math.min(100, Math.round((xp / Math.max(1, xpToNext)) * 100))
  const todayIdx = (new Date().getDay() + 6) % 7

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-[var(--radius-control)] border border-border bg-card font-mono text-[22px] font-semibold text-foreground">
          {streak}
        </div>
        <div>
          <div className="font-semibold">Day streak</div>
          <p className="m-0 text-xs text-muted-foreground">
            Best · {bestStreak} days · Level {level}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5" aria-label="This week’s activity">
        {DAYS.map((d, i) => {
          const done = Boolean(weekActive?.[i])
          const isToday = i === todayIdx
          return (
            <div key={`${d}-${i}`} className="flex flex-col items-center gap-1.5 text-[10px] text-muted-foreground">
              <span
                className={`h-[18px] w-[18px] rounded-full border ${
                  done ? 'border-transparent bg-foreground' : 'border-border bg-muted'
                } ${isToday ? 'ring-2 ring-ring/40' : ''}`}
              />
              <span>{d}</span>
            </div>
          )
        })}
      </div>

      <div className="space-y-1.5 border-t border-border pt-3">
        <div className="flex justify-between text-xs">
          <span>XP this week</span>
          <span className="font-mono text-muted-foreground">{xp} / {xpToNext}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-[var(--radius-xs)] bg-muted">
          <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          {xpHint || `${Math.max(0, xpToNext - xp)} XP to Level ${level + 1}`}
        </p>
      </div>

      {badges.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {badges.slice(0, 6).map((b) => (
            <div
              key={b.id || b.title}
              className={`flex flex-col gap-0.5 rounded-lg border border-border bg-elevated p-2 ${b.locked ? 'opacity-55' : ''}`}
            >
              <strong className="text-[11px] font-semibold">{b.title}</strong>
              <span className="text-[10px] text-muted-foreground">{b.locked ? 'Locked' : b.subtitle || 'Unlocked'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
