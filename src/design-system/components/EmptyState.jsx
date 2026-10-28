import AppIcon from '@/components/icons/AppIcon'

/** Quiet empty state. Pass a Phosphor icon name, not an emoji. */
export function EmptyState({ icon = 'folder', title, description, action }) {
  return (
    <div className="flex flex-col items-start gap-[var(--space-3)] rounded-[var(--radius-panel)] border border-dashed border-border px-[var(--space-4)] py-[var(--space-6)]">
      <AppIcon name={icon} className="size-5 text-muted-foreground" aria-hidden />
      <div>
        <h2 className="m-0 text-[length:var(--font-size-sm)] font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-[var(--space-1)] mb-0 max-w-prose text-[length:var(--font-size-sm)] leading-[var(--leading-body)] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action || null}
    </div>
  )
}
