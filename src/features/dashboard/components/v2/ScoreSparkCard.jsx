import Sparkline from './Sparkline'

const COLOR_MAP = {
  primary: 'var(--primary)',
  ai: 'var(--ai)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  profile: 'var(--profile)',
}

/** Health score card with optional sparkline + delta. */
export default function ScoreSparkCard({
  label,
  value,
  delta,
  color = 'primary',
  trend = [],
}) {
  const stroke = COLOR_MAP[color] || color
  const flat = delta == null || delta === '—' || delta === 0
  const deltaLabel = flat ? '—' : (Number(delta) > 0 ? `+${delta}` : String(delta))

  return (
    <div
      className="flex h-full min-h-[6.5rem] min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-card px-3 py-3"
      style={{ borderLeftWidth: 3, borderLeftColor: stroke }}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className={`font-mono text-[10px] ${flat ? 'text-muted-foreground' : 'text-success'}`}>
          {deltaLabel}
        </span>
      </div>
      <div className="font-mono text-[22px] font-bold leading-none tracking-tight" style={{ color: stroke }}>
        {value == null ? '—' : value}
      </div>
      {trend.length >= 2 ? (
        <Sparkline id={String(label).toLowerCase()} points={trend} color={stroke} />
      ) : (
        <div className="h-7" />
      )}
    </div>
  )
}
