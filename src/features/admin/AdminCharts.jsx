/** Lightweight SVG charts for admin pages (no chart library). */

function maxOf(values) {
  let m = 0
  for (const v of values) {
    const n = Number(v) || 0
    if (n > m) m = n
  }
  return m || 1
}

export function AdminBarChart({
  data = [],
  valueKey = 'value',
  labelKey = 'label',
  height = 140,
  className = '',
  color = 'var(--color-primary, #0f766e)',
}) {
  if (!data.length) {
    return (
      <div className={`flex h-[140px] items-center justify-center text-xs text-muted-foreground ${className}`}>
        No chart data yet
      </div>
    )
  }

  const values = data.map((d) => Number(d[valueKey]) || 0)
  const max = maxOf(values)
  const barW = Math.max(8, Math.min(28, Math.floor(320 / data.length)))
  const gap = 4
  const width = data.length * (barW + gap) + 8
  const chartH = height - 28

  return (
    <div className={`overflow-x-auto ${className}`}>
      <svg width={width} height={height} role="img" aria-label="Bar chart">
        {data.map((d, i) => {
          const v = Number(d[valueKey]) || 0
          const h = Math.max(2, Math.round((v / max) * chartH))
          const x = 4 + i * (barW + gap)
          const y = chartH - h + 4
          return (
            <g key={`${d[labelKey]}-${i}`}>
              <title>{`${d[labelKey] ?? ''}: ${v}`}</title>
              <rect x={x} y={y} width={barW} height={h} rx={3} fill={color} opacity={0.85} />
              {data.length <= 16 && (
                <text
                  x={x + barW / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: 9 }}
                >
                  {String(d[labelKey] ?? '').slice(-5)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function AdminDonut({
  segments = [],
  size = 120,
  className = '',
}) {
  const total = segments.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1
  const r = size / 2 - 8
  const c = 2 * Math.PI * r
  let offset = 0
  const colors = ['#0f766e', '#d97706', '#6366f1', '#dc2626', '#64748b', '#059669']

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border, #e5e5e5)" strokeWidth={12} />
        {segments.map((seg, i) => {
          const v = Number(seg.value) || 0
          const len = (v / total) * c
          const el = (
            <circle
              key={seg.label || i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color || colors[i % colors.length]}
              strokeWidth={12}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
          offset += len
          return el
        })}
        <text
          x={size / 2}
          y={size / 2 + 4}
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 14, fontWeight: 700 }}
        >
          {Math.round(total)}
        </text>
      </svg>
      <ul className="space-y-1 text-xs">
        {segments.map((seg, i) => (
          <li key={seg.label || i} className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ background: seg.color || colors[i % colors.length] }}
            />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium tabular-nums">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AdminChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="mb-3">
        <h2 className="m-0 text-sm font-semibold">{title}</h2>
        {subtitle ? <p className="mt-0.5 mb-0 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  )
}
