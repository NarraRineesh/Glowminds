import { cn } from '@/components/ui'

/** Shared horizontal container for marketing / legal pages */
export const PUBLIC_CONTAINER = 'mx-auto max-w-6xl px-5 md:px-8'
export const PUBLIC_CONTAINER_NARROW = 'mx-auto max-w-3xl px-5 md:px-8'

/** Standard vertical rhythm between page sections */
export const PUBLIC_SECTION_PY = 'py-12 md:py-16'

export function PublicPageSection({ children, className, muted, borderY }) {
  return (
    <section
      className={cn(
        PUBLIC_SECTION_PY,
        muted && 'bg-muted/30',
        borderY && 'border-y border-border',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function PublicPageContainer({ children, className, narrow = false }) {
  return (
    <div className={cn(narrow ? PUBLIC_CONTAINER_NARROW : PUBLIC_CONTAINER, className)}>
      {children}
    </div>
  )
}

/** Quiet hero ground. No glow, mesh, or blurred orbs. */
export function PublicPageHeroBackdrop() {
  return null
}

/** Responsive 3-column comparison row (feature + 2 tiers) */
export function ComparisonTableShell({ header, children, className }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-[280px]">
        {header}
        {children}
      </div>
    </div>
  )
}

export const COMPARISON_HEADER_CLASS =
  'grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] gap-2 border-b border-border bg-muted/40 px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[minmax(0,1fr)_5rem_5rem] sm:gap-4 sm:px-6 sm:text-xs'

export const COMPARISON_ROW_CLASS =
  'grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2 border-b border-border px-3 py-3 text-xs last:border-0 sm:grid-cols-[minmax(0,1fr)_5rem_5rem] sm:gap-4 sm:px-6 sm:text-sm'

/** Use with inline gridTemplateColumns for 3+ plan columns. */
export const COMPARISON_FLEX_HEADER_CLASS =
  'grid gap-2 border-b border-border bg-muted/40 px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:gap-4 sm:px-6 sm:text-xs'

export const COMPARISON_FLEX_ROW_CLASS =
  'grid items-center gap-2 border-b border-border px-3 py-3 text-xs last:border-0 sm:gap-4 sm:px-6 sm:text-sm'
