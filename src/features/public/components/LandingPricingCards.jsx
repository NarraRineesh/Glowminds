import { Link } from 'react-router-dom'
import useUpgradePro from '@/hooks/useUpgradePro'
import useAppStore from '@/store/authStore'
import usePricingConfig from '@/hooks/usePricingConfig'
import LandingReveal, { LandingRevealItem, LandingRevealStagger } from '@/features/public/components/LandingReveal'
import { LandingCheckList, LandingSection, LandingSectionTitle } from '@/features/public/components/landingPageUi'
import useIsLg from '@/hooks/useIsLg'
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

export default function LandingPricingCards({ pricing }) {
  const isLg = useIsLg()
  const { loggedIn } = useAppStore()
  const { startUpgrade, loading: upgradeLoading } = useUpgradePro()
  const { marketing, plans } = usePricingConfig()

  if (!pricing) return null

  const proHighlights = pricing.pro.highlights || marketing?.proHighlights || pricing.pro.features?.slice(0, 5) || []
  const regularPrice = pricing.pro.regularPrice || plans?.yearly?.regularPrice
  const launchOfferText = marketing?.launchOfferText || 'Founding Member Offer'
  const monthlyEquivalent = marketing?.monthlyEquivalent || 'Only ₹50/month when billed annually'
  const dailyEquivalent = marketing?.dailyEquivalent || 'Less than ₹2/day'

  return (
    <LandingSection muted>
      <LandingReveal>
        <LandingSectionTitle
          title="Choose the plan"
          highlight="right for you"
          subtitle="Start free. Upgrade when you need more power."
        />
      </LandingReveal>
      <LandingRevealStagger className={cn('mx-auto grid max-w-4xl gap-5 pt-2 lg:items-stretch', isLg ? 'grid-cols-2' : 'grid-cols-1')}>
        <LandingRevealItem>
          <Card className="flex h-full flex-col">
            <CardHeader>
              <Badge variant="secondary">{pricing.free.label}</Badge>
              <div className="flex items-baseline gap-1 pt-2">
                <CardTitle className="text-3xl">{pricing.free.price}</CardTitle>
                <span className="text-sm text-muted-foreground">{pricing.free.period}</span>
              </div>
              <CardDescription>{pricing.free.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              <LandingCheckList items={pricing.free.features} />
            </CardContent>
            <CardFooter className="mt-auto">
              <Button variant="outline" className="w-full" render={<Link to="/signup" />}>
                Get started free
              </Button>
            </CardFooter>
          </Card>
        </LandingRevealItem>
        <LandingRevealItem>
          <Card
            className={cn(
              'relative flex h-full flex-col border-primary/50 bg-gradient-to-b from-primary/5 to-card shadow-lg shadow-primary/10',
              isLg && 'lg:z-[1]',
            )}
          >
            <Badge
              variant="outline"
              className="absolute left-1/2 top-3 -translate-x-1/2 border-primary/30 bg-primary text-primary-foreground shadow-sm"
            >
              {launchOfferText}
            </Badge>
            <CardHeader className="pt-12">
              <Badge variant="outline" className="w-fit border-primary/20 bg-primary/10 text-primary">
                {pricing.pro.label}
              </Badge>
              {regularPrice && (
                <p className="pt-2 text-sm text-muted-foreground line-through">{regularPrice}{pricing.pro.period}</p>
              )}
              <div className="flex items-baseline gap-1">
                <CardTitle className="text-3xl">{pricing.pro.price}</CardTitle>
                <span className="text-sm text-muted-foreground">{pricing.pro.period}</span>
              </div>
              <p className="text-sm text-muted-foreground">{monthlyEquivalent}</p>
              <p className="text-xs text-muted-foreground">{dailyEquivalent}</p>
              <CardDescription>{pricing.pro.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              <LandingCheckList items={proHighlights} />
            </CardContent>
            <CardFooter className="mt-auto">
              {loggedIn ? (
                <Button className="w-full" onClick={() => startUpgrade({ plan: 'yearly' })} disabled={upgradeLoading}>
                  Upgrade to Pro
                </Button>
              ) : (
                <Button className="w-full" render={<Link to="/pricing" />}>
                  View Pro plan
                </Button>
              )}
            </CardFooter>
          </Card>
        </LandingRevealItem>
      </LandingRevealStagger>
    </LandingSection>
  )
}
