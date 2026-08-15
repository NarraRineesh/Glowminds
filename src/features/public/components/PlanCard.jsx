import { Link } from 'react-router-dom'
import AppIcon from '@/components/icons/AppIcon'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
} from '@/components/ui'

function planBadgeTone(label) {
  const t = String(label || '').toLowerCase()
  if (t.includes('founding') || t.includes('offer') || t.includes('launch')) {
    return {
      icon: 'crown',
      bar: 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 text-white',
      glow: 'shadow-[0_8px_24px_-12px_rgba(245,158,11,0.85)]',
    }
  }
  if (t.includes('best') || t.includes('value') || t.includes('lifetime')) {
    return {
      icon: 'trophy',
      bar: 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white',
      glow: 'shadow-[0_8px_24px_-12px_rgba(16,185,129,0.85)]',
    }
  }
  return {
    icon: 'star',
    bar: 'bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground',
    glow: 'shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--primary)_70%,transparent)]',
  }
}

function PlanOfferBadge({ label }) {
  if (!label) return null
  const tone = planBadgeTone(label)
  return (
    <div className={cn('relative z-10 flex items-center justify-center gap-1.5 px-3 py-2 text-center', tone.bar, tone.glow)}>
      <AppIcon name={tone.icon} className="size-3.5 shrink-0" weight="fill" />
      <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em]">{label}</span>
    </div>
  )
}
export default function PlanCard({
  plan,
  isProUser = false,
  upgradeLoading = false,
  loggedIn = false,
  onUpgrade,
  className,
}) {
  if (!plan) return null

  const features = Array.isArray(plan.cardFeatures) ? plan.cardFeatures : []
  const isFree = !(Number(plan.amountPaise) > 0)
  const isHighlighted = Boolean(plan.highlighted)
  const ctaVariant = plan.ctaVariant === 'outline' || isFree ? 'outline' : 'default'

  function handleCta() {
    if (isFree) return
    if (typeof onUpgrade === 'function') onUpgrade(plan)
  }

  const cta = isFree ? (
    <Button
      className="w-full"
      variant={ctaVariant}
      size="lg"
      nativeButton={false}
      render={<Link to={loggedIn ? '/dashboard' : '/signup'} />}
    >
      {plan.ctaLabel || 'Start Free'}
    </Button>
  ) : isProUser ? (
    <Button className="w-full" variant="outline" size="lg" disabled>
      Current plan
    </Button>
  ) : (
    <Button
      className="w-full"
      variant={ctaVariant === 'outline' ? 'outline' : 'default'}
      size="lg"
      disabled={upgradeLoading}
      onClick={handleCta}
    >
      {upgradeLoading ? 'Opening checkout…' : plan.ctaLabel || `Get ${plan.label}`}
    </Button>
  )

  return (
    <Card
      className={cn(
        'relative flex h-full min-h-[28rem] flex-col overflow-hidden py-0',
        isHighlighted && 'border-primary/40 shadow-md shadow-primary/10 ring-1 ring-primary/20',
        className,
      )}
    >
      {isHighlighted && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]" />
      )}
      <PlanOfferBadge label={plan.badge} />
      <CardHeader className={cn('relative space-y-3 px-6 pb-2', plan.badge ? 'pt-5' : 'pt-6')}>
        <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">
          {plan.label}
        </CardDescription>
        <div className="flex flex-wrap items-baseline gap-2">
          {plan.regularPrice ? (
            <span className="text-sm text-muted-foreground line-through">
              {plan.regularPrice}
              {plan.period || ''}
            </span>
          ) : null}
          <CardTitle className="text-3xl font-black tracking-tight xl:text-4xl">{plan.displayPrice || '—'}</CardTitle>
          {plan.period ? <span className="text-sm text-muted-foreground">{plan.period}</span> : null}
        </div>
        {plan.monthlyEquivalent ? (
          <p className="m-0 text-sm font-medium text-primary">{plan.monthlyEquivalent}</p>
        ) : null}
        {plan.dailyEquivalent ? (
          <p className="m-0 text-xs text-muted-foreground">{plan.dailyEquivalent}</p>
        ) : null}
        {plan.desc ? <CardDescription className="text-sm leading-relaxed">{plan.desc}</CardDescription> : null}
      </CardHeader>
      <CardContent className="relative flex-1 space-y-3 px-6 py-5">
        {features.map((f) => (
          <div key={f.id || f.text} className="flex items-start gap-2.5 text-sm leading-snug">
            {f.included !== false ? (
              <AppIcon name="check" className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            ) : (
              <span className="mt-0.5 inline-block w-4 shrink-0 text-center text-muted-foreground/50">—</span>
            )}
            <span className={cn('flex-1', f.included === false && 'text-muted-foreground/70')}>
              {f.text}
            </span>
            {f.badge ? (
              <Badge variant="secondary" className="shrink-0 border-primary/20 bg-primary/10 text-[10px] text-primary">
                {f.badge}
              </Badge>
            ) : null}
          </div>
        ))}
      </CardContent>
      <CardFooter className="relative mt-auto px-6 pb-6 pt-2">{cta}</CardFooter>
    </Card>
  )
}
