import { AppIcon, cn } from '@/components/ui'

/** [v2] Compact metric / score card */
export default function MetricCard({
  title,
  score,
  status,
  delta,
  icon = 'chart',
  onClick,
  children,
  className,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex flex-col gap-2 rounded-[var(--radius-panel)] border border-border bg-card p-3 text-left shadow-none transition-colors',
        onClick && 'cursor-pointer hover:border-foreground/55',
        !onClick && 'cursor-default',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
        <AppIcon name={icon} className="size-3.5 text-muted-foreground" />
      </div>
      {children}
      {score != null && (
        <div className="flex items-end justify-between gap-2">
          <span className="text-2xl font-black tabular-nums text-foreground">{score}</span>
          <div className="text-right text-[0.7rem]">
            {status && <div className="font-medium text-foreground">{status}</div>}
            {delta != null && (
              <div className={cn(Number(delta) >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {Number(delta) >= 0 ? '+' : ''}
                {delta} pts
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  )
}
