import { Link } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useUpgradePro from '@/hooks/useUpgradePro'
import useIsPro from '@/hooks/useIsPro'
import usePricingConfig from '@/hooks/usePricingConfig'
import PlanCard from '@/features/public/components/PlanCard'
import { highlightedPlan, visiblePlans } from '@/constants/pricingDefaults'
import { Button } from '@/components/ui'

/** Landing pricing strip — cards from admin plans[] JSON. */
export default function LandingPricingCards() {
  const { loggedIn } = useAppStore()
  const isPro = useIsPro()
  const { startUpgrade, loading } = useUpgradePro()
  const { config } = usePricingConfig()
  const plans = visiblePlans(config).slice(0, 4)
  const highlight = highlightedPlan(config)

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Simple pricing for every stage
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {highlight?.monthlyEquivalent ||
              'Start free. Upgrade when you need AI coaching, interviews, and unlimited tracking.'}
          </p>
        </div>
        <div
          className={
            plans.length >= 4
              ? 'grid gap-4 lg:grid-cols-4 md:grid-cols-2'
              : plans.length === 3
                ? 'grid gap-4 lg:grid-cols-3 md:grid-cols-2'
                : 'mx-auto grid max-w-4xl gap-4 md:grid-cols-2'
          }
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isProUser={isPro && plan.tier === 'pro'}
              upgradeLoading={loading}
              loggedIn={loggedIn}
              onUpgrade={(p) => startUpgrade({ plan: p.id })}
            />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="link" render={<Link to="/pricing" />}>
            Compare all features →
          </Button>
        </div>
      </div>
    </section>
  )
}
