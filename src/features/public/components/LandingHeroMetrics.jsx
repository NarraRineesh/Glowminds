import { cn } from '@/components/ui'

export default function LandingHeroMetrics({ metrics, className }) {
  if (!metrics?.length) return null

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-3', className)}>
      {metrics.map((item) => (
        <div
          key={item.label}
          className="rounded-[var(--radius-panel)] border border-border bg-card px-4 py-3 text-center shadow-none"
        >
          <p className="text-xl font-bold tracking-tight text-foreground md:text-2xl">{item.value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
