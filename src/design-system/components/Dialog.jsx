import { AppDialog, cn } from '@/components/ui'

/** Modal with a required title. Focus trap comes from the shared dialog primitive. */
export function Dialog({ title, className, ...props }) {
  return (
    <AppDialog
      title={title}
      className={cn(
        'rounded-[var(--radius-panel)] border border-border shadow-[var(--shadow-overlay)]',
        className,
      )}
      {...props}
    />
  )
}
