import { cn } from '@/components/ui'

/** Bordered surface. No gradient fill and no drop shadow. */
export function Card({ title, description, children, footer, className }) {
  return (
    <section className={cn('rounded-[var(--radius-panel)] border border-border bg-card text-card-foreground', className)}>
      {title || description ? (
        <header className="border-b border-border px-[var(--space-4)] py-[var(--space-3)]">
          {title ? (
            <h2 className="m-0 text-[length:var(--font-size-sm)] font-semibold leading-[var(--leading-tight)] text-foreground">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--leading-body)] text-muted-foreground">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      <div className="px-[var(--space-4)] py-[var(--space-4)]">{children}</div>
      {footer ? (
        <footer className="border-t border-border px-[var(--space-4)] py-[var(--space-3)]">{footer}</footer>
      ) : null}
    </section>
  )
}
