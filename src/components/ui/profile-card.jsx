import { DashboardCard } from './card'
import { cn } from 'glowminds-resume/ui'

/** Profile section card — same as DashboardCard with scroll anchor defaults. */
export function ProfileCard({ id, title, titleIcon, action, children, className, style, contentClassName }) {
  return (
    <DashboardCard
      id={id}
      className={className || 'scroll-mt-20'}
      title={title}
      titleIcon={titleIcon}
      action={action}
      style={style}
      contentClassName={cn('py-3 sm:py-4', contentClassName)}
    >
      {children}
    </DashboardCard>
  )
}
