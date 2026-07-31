/** Tiny sparkline for score cards. */
export default function Sparkline({ points = [], color = 'var(--primary)', width = 88, height = 28, id = 'spark' }) {
  const safe = points.length >= 2 ? points : [0, 0]
  const min = Math.min(...safe)
  const max = Math.max(...safe)
  const span = Math.max(1, max - min)
  const pad = 2
  const coords = safe.map((v, i) => {
    const x = pad + (i / Math.max(1, safe.length - 1)) * (width - pad * 2)
    const y = height - pad - ((v - min) / span) * (height - pad * 2)
    return [x, y]
  })
  const line = coords.map(([x, y]) => `${x},${y}`).join(' ')
  const area = [
    `${coords[0][0]},${height}`,
    ...coords.map(([x, y]) => `${x},${y}`),
    `${coords[coords.length - 1][0]},${height}`,
  ].join(' ')
  const last = coords[coords.length - 1]
  const gid = `gm-sg-${id}`

  return (
    <svg className="block h-7 w-full" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${gid})`} points={area} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />}
    </svg>
  )
}
