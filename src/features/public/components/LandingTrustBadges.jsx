import AppIcon from '@/components/icons/AppIcon'
import { cn } from '@/components/ui'

export default function LandingTrustBadges({ badges, className }) {
  if (!badges?.length) return null

  return (
    <ul className={cn('flex flex-wrap items-center gap-2', className)}>
      {badges.map((badge) => (
        <li
          key={badge.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
        >
          <AppIcon name={badge.icon} className="size-3.5 shrink-0 text-primary" />
          <span>{badge.label}</span>
        </li>
      ))}
    </ul>
  )
}
