import useIsLg from '@/hooks/useIsLg'
import { cn } from '@/components/ui'

export function ToolPage({ children, className }) {
  return <div className={cn('min-w-0 space-y-3 sm:space-y-6', className)}>{children}</div>
}

export function ToolSidebarLayout({
  sidebar,
  children,
  sidebarRight = false,
  /** On small screens, put filters/actions above the main column (when CTA lives in the sidebar). */
  mobileSidebarFirst = false,
  className,
}) {
  const isLg = useIsLg()
  const stackGap = 'flex min-w-0 flex-col gap-2.5 sm:gap-4'
  const sidebarSticky = cn(stackGap, 'lg:sticky lg:top-20 lg:self-start')

  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-6',
        isLg
          ? sidebarRight
            ? 'grid-cols-[minmax(0,1fr)_minmax(240px,300px)]'
            : 'grid-cols-[minmax(240px,300px)_minmax(0,1fr)]'
          : 'grid-cols-1',
        className,
      )}
    >
      {isLg ? (
        sidebarRight ? (
          <>
            <div className={stackGap}>{children}</div>
            <div className={sidebarSticky}>{sidebar}</div>
          </>
        ) : (
          <>
            <div className={sidebarSticky}>{sidebar}</div>
            <div className={stackGap}>{children}</div>
          </>
        )
      ) : mobileSidebarFirst ? (
        <>
          <div className={stackGap}>{sidebar}</div>
          <div className={stackGap}>{children}</div>
        </>
      ) : (
        <>
          <div className={stackGap}>{children}</div>
          <div className={stackGap}>{sidebar}</div>
        </>
      )}
    </div>
  )
}

export function ToolEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center sm:py-8">
      {Icon ? <Icon className="size-8 text-muted-foreground/50" /> : null}
      {title ? <p className="text-sm font-medium text-foreground">{title}</p> : null}
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}
