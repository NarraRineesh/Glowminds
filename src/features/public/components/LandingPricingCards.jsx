import { Link } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useUpgradePro from '@/hooks/useUpgradePro'
import useIsPro from '@/hooks/useIsPro'
import usePricingConfig from '@/hooks/usePricingConfig'
import { PlansGrid } from '@/features/public/components/PlansCatalog'
import { highlightedPlan, visiblePlans } from '@/constants/pricingDefaults'
import { Button } from '@/components/ui'

/** Landing pricing strip — same cards as /pricing. */
export default function LandingPricingCards() {
  const { loggedIn } = useAppStore()
  const isPro = useIsPro()
  const { startUpgrade, loading } = useUpgradePro()
  const { config } = usePricingConfig()
  const plans = visiblePlans(config).slice(0, 4)

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Simple pricing for every stage
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Free, monthly, yearly, and lifetime. Compare every Career OS feature on the pricing page.
          </p>
        </div>
        <PlansGrid
          plans={plans}
          isPro={isPro}
          loggedIn={loggedIn}
          upgradeLoading={loading}
          onUpgrade={(p) => startUpgrade({ plan: p.id || p.key })}
        />
        <div className="mt-10 text-center">
          <Button variant="link" nativeButton={false} render={<Link to="/pricing" />}>
            Compare all features →
          </Button>
        </div>
      </div>
    </section>
  )
}
