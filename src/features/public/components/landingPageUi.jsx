import AppIcon from '@/components/icons/AppIcon'
import useIsLg from '@/hooks/useIsLg'
import { Badge, cn } from '@/components/ui'

export function LandingSection({ children, className, muted = false }) {
  return (
    <section className={cn(muted ? 'bg-muted/30' : '', 'py-12 md:py-16', className)}>
      <div className="mx-auto max-w-6xl px-5 md:px-8">{children}</div>
    </section>
  )
}

export function LandingSectionTitle({ eyebrow, title, highlight, subtitle }) {
  return (
    <div className="mb-8 text-center">
      {eyebrow ? (
        <Badge variant="outline" className="mb-3 border-primary/20 bg-primary/10 text-primary">
          {eyebrow}
        </Badge>
      ) : null}
      <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
        {title}
        {highlight ? <> <span className="text-primary">{highlight}</span></> : null}
      </h2>
      {subtitle ? (
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p>
      ) : null}
    </div>
  )
}

export function LandingCheckList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
          <AppIcon name="check" className="mt-0.5 size-4 shrink-0 text-emerald-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

const FEATURE_BADGE_CLASS = [
  'border-border bg-card text-foreground',
]

export function featureBadgeClass(index) {
  return FEATURE_BADGE_CLASS[index % FEATURE_BADGE_CLASS.length]
}

export function toolIconClass() {
  return 'bg-muted text-foreground'
}

export function LandingFeatureGrid({ reverse, children }) {
  const isLg = useIsLg()
  return (
    <div
      className={cn(
        'grid gap-8 md:gap-10',
        isLg ? 'grid-cols-2 items-center' : 'grid-cols-1',
        reverse && isLg && '[&>*:first-child]:order-2',
      )}
    >
      {children}
    </div>
  )
}
