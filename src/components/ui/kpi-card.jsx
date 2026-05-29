import { Card, CardContent, cn } from 'glowminds-resume/ui'
import AppIcon from '@/components/icons/AppIcon'

const ACCENTS = {
  1: 'from-primary/80 to-primary',
  2: 'from-emerald-500/80 to-emerald-500',
  3: 'from-amber-500/80 to-amber-500',
  4: 'from-violet-500/80 to-violet-500',
}

export function KpiCard({
  icon,
  label,
  value,
  sub,
  accent = 1,
  className,
  onClick,
}) {
  return (
    <Card
      className={cn('relative cursor-pointer overflow-hidden py-4 transition-shadow hover:ring-foreground/15', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e) } } : undefined}
    >
      <div className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', ACCENTS[accent] || ACCENTS[1])} />
      {icon && (
        <div className="absolute right-3 top-3 opacity-15" aria-hidden>
          {typeof icon === 'string' ? <AppIcon name={icon} className="size-8" /> : icon}
        </div>
      )}
      <CardContent className="px-4 py-0">
        <div className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{value}</div>
        {sub && <div className="mt-0.5 text-[0.6875rem] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export function FilterBar({ children, className }) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-2.5 rounded-xl bg-card p-3 ring-1 ring-foreground/10', className)}>
      {children}
    </div>
  )
}

export function PageTitle({ title, subtitle, className, children }) {
  return (
    <div className={cn('mb-5', className)}>
      <h1 className="text-[clamp(1.15rem,2.2vw,1.5rem)] font-bold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  )
}
