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

/**
 * Generic pricing plan card — all copy/features from admin plan JSON.
 */
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
        'relative h-full overflow-hidden',
        isHighlighted && 'border-primary/40 shadow-md shadow-primary/10',
        className,
      )}
    >
      {isHighlighted && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]" />
      )}
      {plan.badge ? (
        <Badge className="absolute right-3 top-3 z-10 border-0 bg-primary text-primary-foreground">
          {plan.badge}
        </Badge>
      ) : null}
      <CardHeader className="relative">
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
          <CardTitle className="text-4xl font-black">{plan.displayPrice || '—'}</CardTitle>
          {plan.period ? <span className="text-muted-foreground">{plan.period}</span> : null}
        </div>
        {plan.monthlyEquivalent ? (
          <p className="text-sm font-medium text-primary">{plan.monthlyEquivalent}</p>
        ) : null}
        {plan.dailyEquivalent ? (
          <p className="text-xs text-muted-foreground">{plan.dailyEquivalent}</p>
        ) : null}
        {plan.desc ? <CardDescription className="pt-1">{plan.desc}</CardDescription> : null}
      </CardHeader>
      <CardContent className="relative space-y-2.5">
        {features.map((f) => (
          <div key={f.id || f.text} className="flex items-start gap-2 text-sm">
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
      <CardFooter className="relative">{cta}</CardFooter>
    </Card>
  )
}
