import { cn } from '@/components/ui'

/** One page title. Do not add a second h1 in the page body. */
export function PageHeader({ title, description, actions, className }) {
  return (
    <header
      className={cn(
        'flex flex-col gap-[var(--space-3)] border-b border-border pb-[var(--space-4)]',
        'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="m-0 text-[length:var(--font-size-xl)] font-semibold leading-[var(--leading-tight)] tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-[var(--space-2)] mb-0 max-w-2xl text-[length:var(--font-size-sm)] leading-[var(--leading-body)] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-[var(--space-2)]">{actions}</div> : null}
    </header>
  )
}
