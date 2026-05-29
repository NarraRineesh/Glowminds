import { cn } from 'glowminds-resume/ui'

/**
 * Responsive card grids for dashboard pages.
 * Parent must include `@container/dashboard` (see DashboardShell).
 */
const VARIANTS = {
  two: 'grid grid-cols-1 gap-4 @sm/dashboard:grid-cols-2 [&>*]:min-h-0 [&>*]:min-w-0',
  three: 'grid grid-cols-1 gap-4 @sm/dashboard:grid-cols-2 @3xl/dashboard:grid-cols-3 [&>*]:min-h-0 [&>*]:min-w-0',
  four: 'grid grid-cols-2 gap-3 sm:gap-4 @3xl/dashboard:grid-cols-4 [&>*]:min-h-0 [&>*]:min-w-0',
  sidebar: 'grid grid-cols-1 gap-4 @2xl/dashboard:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] [&>*]:min-h-0 [&>*]:min-w-0',
  sidebarWide: 'grid grid-cols-1 gap-4 @2xl/dashboard:grid-cols-[minmax(260px,min(340px,34%))_minmax(0,1fr)] [&>*]:min-h-0 [&>*]:min-w-0',
  sidebarWideRight: 'grid grid-cols-1 gap-4 @2xl/dashboard:grid-cols-[minmax(0,1fr)_minmax(260px,min(340px,34%))] [&>*]:min-h-0 [&>*]:min-w-0',
  kanban: 'grid grid-cols-1 gap-4 @md/dashboard:grid-cols-2 @4xl/dashboard:grid-cols-3 @6xl/dashboard:grid-cols-5 [&>*]:min-h-0 [&>*]:min-w-0',
  tiles: 'grid grid-cols-2 gap-3 @sm/dashboard:grid-cols-3 @3xl/dashboard:grid-cols-4 [&>*]:min-h-0 [&>*]:min-w-0',
  kpi3: 'grid grid-cols-1 gap-3 @sm/dashboard:grid-cols-3 [&>*]:min-h-0 [&>*]:min-w-0',
  jobs: 'grid grid-cols-1 gap-4 @sm/dashboard:grid-cols-2 @4xl/dashboard:grid-cols-3 [&>*]:min-h-0 [&>*]:min-w-0',
}

export function CardGrid({ variant = 'two', className, children, ...props }) {
  return (
    <div className={cn(VARIANTS[variant] ?? VARIANTS.two, className)} {...props}>
      {children}
    </div>
  )
}

export function PageStack({ className, children }) {
  return <div className={cn('min-w-0 space-y-5', className)}>{children}</div>
}
