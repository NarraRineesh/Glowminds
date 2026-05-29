import { DashboardCard } from './card'

/** Profile section card — same as DashboardCard with scroll anchor defaults. */
export function ProfileCard({ id, title, titleIcon, action, children, className, style }) {
  return (
    <DashboardCard
      id={id}
      className={className || 'scroll-mt-20'}
      title={title}
      titleIcon={titleIcon}
      action={action}
      style={style}
    >
      {children}
    </DashboardCard>
  )
}
