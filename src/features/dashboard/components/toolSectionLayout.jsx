import useIsLg from '@/hooks/useIsLg'
import { cn } from '@/components/ui'

export function ToolPage({ children, className }) {
  return <div className={cn('min-w-0 space-y-6', className)}>{children}</div>
}

export function ToolSidebarLayout({ sidebar, children, sidebarRight = false, className }) {
  const isLg = useIsLg()
  return (
    <div
      className={cn(
        'grid gap-6',
        isLg
          ? sidebarRight
            ? 'grid-cols-[minmax(0,1fr)_minmax(240px,300px)]'
            : 'grid-cols-[minmax(240px,300px)_minmax(0,1fr)]'
          : 'grid-cols-1',
        className,
      )}
    >
      {sidebarRight ? (
        <>
          <div className="flex min-w-0 flex-col gap-4">{children}</div>
          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:self-start">{sidebar}</div>
        </>
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:self-start">{sidebar}</div>
          <div className="flex min-w-0 flex-col gap-4">{children}</div>
        </>
      )}
    </div>
  )
}

export function ToolEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      {Icon ? <Icon className="size-8 text-muted-foreground/50" /> : null}
      {title ? <p className="text-sm font-medium text-foreground">{title}</p> : null}
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}
