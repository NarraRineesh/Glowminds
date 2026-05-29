import { Badge, cn } from 'glowminds-resume/ui'

const TONES = {
  default: 'border-primary/20 bg-primary/10 text-primary',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  purple: 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
  muted: 'border-border bg-secondary text-muted-foreground',
}

export function StatusBadge({ tone = 'default', className, children, ...props }) {
  return (
    <Badge variant="outline" className={cn('rounded-full font-semibold', TONES[tone] || TONES.default, className)} {...props}>
      {children}
    </Badge>
  )
}
