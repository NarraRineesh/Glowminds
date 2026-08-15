import { Link } from 'react-router-dom'
import AppIcon from '@/components/icons/AppIcon'
import { Button } from '@/components/ui'

/** Shown when a feature API returns permission-denied (Pro required). */
export default function ProUpgradeInline({ message, className }) {
  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <AppIcon name="lock" className="size-10 text-primary/60" />
        <p className="text-sm font-semibold text-foreground">Glowminds Pro required</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {message || 'Upgrade to Pro to use this feature.'}
        </p>
        <Button size="sm" nativeButton={false} render={<Link to="/dashboard/plans" />}>
          Compare plans & choose
        </Button>
      </div>
    </div>
  )
}
