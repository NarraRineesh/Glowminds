const ROWS = [
  {
    key: 'apps',
    label: 'Applications',
    icon: '📋',
    accent: 'var(--color-blu2)',
    accentBg: 'var(--color-blu3)',
    color: 'text-[var(--color-blu2)]',
  },
  {
    key: 'jobsSaved',
    label: 'Jobs Saved',
    icon: '💼',
    accent: 'var(--color-prp)',
    accentBg: 'var(--color-prp2)',
    color: 'text-[var(--color-txt)]',
  },
  {
    key: 'xpEarned',
    label: 'XP Earned',
    icon: '⚡',
    accent: 'var(--color-grn)',
    accentBg: 'var(--color-grn2)',
    color: 'text-[var(--color-grn)]',
    prefix: '+',
  },
  {
    key: 'activeDays',
    label: 'Active Days',
    icon: '📆',
    accent: 'var(--color-gold)',
    accentBg: 'var(--color-gold2)',
    color: 'text-[var(--color-gold)]',
    suffix: '/7',
  },
]

function formatTrend(delta) {
  if (delta == null || delta === 0) return null
  const up = delta > 0
  return {
    label: `${up ? '↑' : '↓'} ${Math.abs(delta)}`,
    color: up ? 'text-[var(--color-grn)]' : 'text-[var(--color-red)]',
    bg: up ? 'bg-[var(--color-grn2)]' : 'bg-[var(--color-red2)]',
  }
}

export default function QuickStats({
  apps = 3,
  jobsSaved = 12,
  xpEarned = 250,
  activeDays = 5,
  trends = { apps: +2, jobsSaved: +4, xpEarned: +60, activeDays: +1 },
}) {
  const values = { apps, jobsSaved, xpEarned, activeDays }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-bdr2)] hover:shadow-md sm:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-50 blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--color-glow2), transparent 70%)',
        }}
      />

      <div className="relative mb-2 flex shrink-0 items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          <span className="text-[1rem] leading-none opacity-90" aria-hidden>📊</span>
          This week
        </p>
        <span className="rounded-full border border-[var(--color-bdr)] bg-[var(--color-grn2)] px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-[var(--color-grn)]">
          ↑ up
        </span>
      </div>

      <ul className="relative flex flex-1 flex-col justify-center gap-1.5">
        {ROWS.map(({ key, label, icon, accent, accentBg, color, prefix = '', suffix = '' }) => {
          const trend = formatTrend(trends?.[key])
          return (
            <li
              key={key}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-[var(--color-bdr)] pb-1.5 last:border-b-0 last:pb-0"
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md text-[0.78rem]"
                style={{ background: accentBg, color: accent }}
                aria-hidden
              >
                {icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="truncate text-[11px] leading-tight text-[var(--color-txt)]">
                    {label}
                  </span>
                  {trend && (
                    <span className={`text-[0.58rem] font-bold ${trend.color}`}>
                      {trend.label}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`shrink-0 text-right font-mono text-[1.05rem] font-black tabular-nums leading-none ${color}`}
              >
                {prefix}
                {values[key]}
                {suffix}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
