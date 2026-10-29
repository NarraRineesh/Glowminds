import { Skeleton as UiSkeleton, cn } from '@/components/ui'

export function Skeleton({ className, ...props }) {
  return <UiSkeleton className={cn('rounded-[var(--radius-control)] bg-muted', className)} {...props} />
}

export function SkeletonLines({ lines = 3, label = 'Loading' }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-[var(--space-2)]">
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-3 w-full', index === lines - 1 && 'w-2/3')} />
      ))}
    </div>
  )
}
