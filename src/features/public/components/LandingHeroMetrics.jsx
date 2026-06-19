import { cn } from '@/components/ui'

export default function LandingHeroMetrics({ metrics, className }) {
  if (!metrics?.length) return null

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-3', className)}>
      {metrics.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border/80 bg-card/60 px-4 py-3 text-center backdrop-blur-sm"
        >
          <p className="text-xl font-bold tracking-tight text-foreground md:text-2xl">{item.value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
