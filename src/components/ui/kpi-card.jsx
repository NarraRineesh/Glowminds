import { Card, CardContent, cn } from 'glowminds-resume/ui'
import AppIcon from '@/components/icons/AppIcon'

export function KpiCard({
  icon,
  label,
  value,
  sub,
  className,
  onClick,
}) {
  return (
    <Card
      className={cn('relative cursor-pointer overflow-hidden py-4 shadow-none', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e) } } : undefined}
    >
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
    <div className={cn('mb-4 flex flex-wrap items-center gap-2.5 rounded-[var(--radius-panel)] border border-border bg-card p-3 shadow-none', className)}>
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
