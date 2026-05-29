import { AppIcon, cn } from '@/components/ui'

export function JobMetaItem({ icon, children, className = '', title }) {
  if (!children) return null
  return (
    <span
      className={cn('inline-flex min-w-0 max-w-full items-center gap-1 text-[0.72rem] text-muted-foreground', className)}
      title={title}
    >
      {icon && <AppIcon name={icon} className="size-3.5 shrink-0 opacity-70" />}
      <span className="truncate">{children}</span>
    </span>
  )
}

export function JobMetaRow({ children, className = '' }) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1', className)}>
      {children}
    </div>
  )
}
