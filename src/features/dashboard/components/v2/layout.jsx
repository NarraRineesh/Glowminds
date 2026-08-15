import { Button, cn } from '@/components/ui'

/** Main + insight rail — Design Lab SplitRail */
export function SplitRail({ main, rail, className, sticky = true }) {
  return (
    <div className={cn('grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]', className)}>
      <div className="min-w-0 space-y-3">{main}</div>
      {rail ? (
        <aside className={cn('min-w-0 w-full space-y-3', sticky && 'lg:sticky lg:top-20 lg:self-start')}>
          {rail}
        </aside>
      ) : null}
    </div>
  )
}

/** Pill filter / range chips */
export function FilterBar({ options, value, onChange, className }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)} role="tablist">
      {options.map((opt) => {
        const id = typeof opt === 'string' ? opt : opt.id
        const label = typeof opt === 'string' ? opt : opt.label
        const active = value === id
        return (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={active ? 'default' : 'outline'}
            className="h-8"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(id)}
          >
            {label}
          </Button>
        )
      })}
    </div>
  )
}

/** Compact 4-stat header strip */
export function StatStrip({ stats = [], className }) {
  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', className)}>
      {stats.map(([label, value, hint]) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card px-3 py-2.5 ring-1 ring-foreground/5"
        >
          <p className="m-0 text-[0.68rem] text-muted-foreground">{label}</p>
          <p className="m-0 mt-0.5 text-xl font-bold tabular-nums tracking-tight">{value}</p>
          {hint ? <p className="m-0 mt-0.5 text-[0.65rem] text-muted-foreground">{hint}</p> : null}
        </div>
      ))}
    </div>
  )
}

/** Persistent shortcut row */
export function QuickActions({ items = [], className }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map((item) => (
        <Button
          key={item.label}
          type="button"
          size="sm"
          variant={item.ai ? 'default' : 'outline'}
          className={cn('h-8', item.ai && 'bg-ai text-background hover:bg-ai/90')}
          disabled={item.disabled}
          onClick={item.onClick}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}

/** Quiet AI / insight rail card */
export function AiRail({ title, body, cta, onCta, className }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-ai/25 bg-ai/5 p-3.5 ring-1 ring-ai/10',
        className,
      )}
    >
      <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-wider text-ai">AI · {title}</p>
      {body ? <p className="mt-1.5 mb-0 text-sm leading-snug text-foreground/90">{body}</p> : null}
      {cta ? (
        <Button
          type="button"
          size="sm"
          className="mt-3 h-8 bg-ai text-background hover:bg-ai/90"
          onClick={onCta}
        >
          {cta}
        </Button>
      ) : null}
    </div>
  )
}

/** Dense data table — drops min-width on small screens to avoid forced horizontal scroll */
export function DenseTable({ columns = [], rows = [], className, empty }) {
  if (!rows.length) {
    return empty || <p className="text-sm text-muted-foreground">No rows yet.</p>
  }
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-0 border-collapse text-left text-sm sm:min-w-[420px]">
        <thead>
          <tr className="border-b border-border text-[0.68rem] uppercase tracking-wider text-muted-foreground">
            {columns.map((c) => (
              <th key={c} className="px-2 py-2 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/70 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-2.5 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Toolbar: filters left, actions right */
export function Toolbar({ left, right, className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <div className="min-w-0 flex-1">{left}</div>
      {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
    </div>
  )
}
