import { AppIcon, Card, CardContent, CardHeader, CardTitle, cn } from '@/components/ui'

/** [v2] Section card wrapper */
export function SectionCard({ title, action, children, className }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {(title || action) && (
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          {title ? <CardTitle className="text-sm font-bold">{title}</CardTitle> : <span />}
          {action}
        </CardHeader>
      )}
      <CardContent className={title || action ? 'pt-0' : undefined}>{children}</CardContent>
    </Card>
  )
}

/** [v2] Today’s action plan checklist */
export function ActionPlanList({ items = [], onItemClick }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">You’re all caught up for today.</p>
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onItemClick?.(item)}
            className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-2.5 py-2 text-left transition-colors hover:border-primary/30 hover:bg-muted/60"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card">
              <AppIcon name={item.icon || 'target'} className="size-4 text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8rem] font-semibold text-foreground">{item.title}</span>
              {item.hint && (
                <span className="block truncate text-[0.68rem] text-muted-foreground">{item.hint}</span>
              )}
            </span>
            {item.est && (
              <span className="shrink-0 text-[0.65rem] text-muted-foreground">{item.est}</span>
            )}
            <AppIcon name="chevron-right" className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  )
}

/** [v2] Recent activity timeline */
export function TimelineList({ items = [] }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No recent activity yet.</p>
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2.5">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8rem] font-medium text-foreground">{item.title}</p>
            <p className="text-[0.68rem] text-muted-foreground">
              {item.type}
              {item.when ? ` · ${item.when}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
