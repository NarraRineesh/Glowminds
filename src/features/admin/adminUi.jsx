import { cn } from '@/components/ui'

export function AdminPageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="m-0 text-xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function AdminKpi({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="m-0 text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 mb-0 text-2xl font-semibold tabular-nums tracking-tight">{value ?? '—'}</p>
      {hint ? <p className="mt-1 mb-0 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function AdminPanel({ title, subtitle, action, children, className }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {title ? <h2 className="m-0 text-sm font-semibold">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 mb-0 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function AdminTableWrap({ children, className }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border bg-card', className)}>
      {children}
    </div>
  )
}

export const adminTableClass = 'w-full min-w-0 text-left text-sm'
export const adminThClass = 'border-b border-border px-3 py-2.5 text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground'
export const adminTdClass = 'border-b border-border/60 px-3 py-2.5 align-middle'

export function AdminJsonEditor({ value, onChange, disabled, minHeight = 'min-h-[28rem]' }) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-border bg-card p-3 font-mono text-xs leading-relaxed text-foreground',
        minHeight,
      )}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      spellCheck={false}
      disabled={disabled}
    />
  )
}
