/** Match percentage bar for job cards. */
export default function MatchBar({ value = 0, className = '' }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0))
  return (
    <div className={`mt-1.5 h-1 overflow-hidden rounded-full bg-elevated ${className}`}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  )
}
