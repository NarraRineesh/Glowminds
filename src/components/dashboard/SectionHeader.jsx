import { Badge, cn } from '@/components/ui'

/**
 * Dashboard section header — aligned with glowminds-resume builder chrome.
 */
export default function SectionHeader({
  badge,
  badgeClassName,
  title,
  accent,
  subtitle,
  actions,
}) {
  let titleNode = title
  if (accent && typeof title === 'string' && title.includes(accent)) {
    const [pre, post] = title.split(accent)
    titleNode = (
      <>
        {pre}
        <span className="text-primary">{accent}</span>
        {post}
      </>
    )
  }

  return (
    <div className="relative flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        {badge && (
          <Badge
            variant="outline"
            className={cn(
              'mb-2 border-primary/20 bg-primary/10 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-primary',
              badgeClassName,
            )}
          >
            {badge}
          </Badge>
        )}
        <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
          {titleNode}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
