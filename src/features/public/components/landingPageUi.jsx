import AppIcon from '@/components/icons/AppIcon'
import useIsLg from '@/hooks/useIsLg'
import { Badge, cn } from '@/components/ui'

export function LandingSection({ children, className, muted = false }) {
  return (
    <section className={cn(muted ? 'bg-muted/30' : '', 'py-12 md:py-16', className)}>
      <div className="mx-auto max-w-6xl px-4 md:px-8">{children}</div>
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
  'border-primary/20 bg-primary/10 text-primary',
  'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
  'border-amber-500/20 bg-amber-500/10 text-amber-500',
  'border-violet-500/20 bg-violet-500/10 text-violet-500',
  'border-pink-500/20 bg-pink-500/10 text-pink-500',
  'border-cyan-500/20 bg-cyan-500/10 text-cyan-500',
  'border-teal-500/20 bg-teal-500/10 text-teal-500',
]

export function featureBadgeClass(index) {
  return FEATURE_BADGE_CLASS[index % FEATURE_BADGE_CLASS.length]
}

const TOOL_ICON_BG = {
  resume: 'bg-primary/10 text-primary',
  target: 'bg-emerald-500/10 text-emerald-500',
  robot: 'bg-amber-500/10 text-amber-500',
  microphone: 'bg-violet-500/10 text-violet-500',
  dashboard: 'bg-pink-500/10 text-pink-500',
  'grammar-check': 'bg-teal-500/10 text-teal-500',
  'envelope-open': 'bg-cyan-500/10 text-cyan-500',
  linkedin: 'bg-primary/10 text-primary',
  'cover-letters': 'bg-pink-500/10 text-pink-500',
  pencil: 'bg-violet-500/10 text-violet-500',
  calendar: 'bg-emerald-500/10 text-emerald-500',
  code: 'bg-amber-500/10 text-amber-500',
}

export function toolIconClass(ico) {
  return TOOL_ICON_BG[ico] || 'bg-muted text-foreground'
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
