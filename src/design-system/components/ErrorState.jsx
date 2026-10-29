import AppIcon from '@/components/icons/AppIcon'

export function ErrorState({ title = 'Something went wrong', message, action }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-[var(--space-3)] rounded-[var(--radius-panel)] border border-destructive/40 bg-card px-[var(--space-4)] py-[var(--space-4)]"
    >
      <AppIcon name="warning" className="size-5 text-destructive" aria-hidden />
      <div>
        <h2 className="m-0 text-[length:var(--font-size-sm)] font-semibold text-foreground">{title}</h2>
        {message ? (
          <p className="mt-[var(--space-1)] mb-0 max-w-prose text-[length:var(--font-size-sm)] leading-[var(--leading-body)] text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
      {action || null}
    </div>
  )
}
