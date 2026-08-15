import { useEffect, useState } from 'react'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useIsPro from '@/hooks/useIsPro'
import useUpgradePro from '@/hooks/useUpgradePro'
import usePricingConfig from '@/hooks/usePricingConfig'
import PlansCatalog, { useFeatureComparison } from '@/features/public/components/PlansCatalog'
import { visiblePlans } from '@/constants/pricingDefaults'

/** In-app plans picker — same catalog as /pricing. */
export default function PlansSection() {
  const loggedIn = useAppStore((s) => s.loggedIn)
  const isPro = useIsPro()
  const { startUpgrade, loading } = useUpgradePro()
  const { config, marketing, resolvePlan } = usePricingConfig()
  const subscription = useProfileStore((s) => s.user?.subscription)
  const current = resolvePlan(subscription, isPro)
  const plans = visiblePlans(config)
  const comparison = useFeatureComparison()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:gap-10 md:px-8 md:py-8">
      <div className="max-w-2xl">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-primary">Choose a plan</p>
        <h1 className="mt-2 mb-2 text-2xl font-semibold tracking-tight md:text-3xl">Plans for your Career OS</h1>
        <p className="m-0 text-sm leading-relaxed text-muted-foreground md:text-base">
          {marketing?.heroDescription
            || 'Pick Free, monthly, yearly, or lifetime. Checkout only starts after you choose a paid plan.'}
        </p>
      </div>

      <PlansCatalog
        plans={plans}
        currentPlan={current}
        loggedIn={loggedIn}
        upgradeLoading={loading}
        onUpgrade={(p) => startUpgrade({ plan: p.id || p.key })}
        comparison={comparison}
      />
    </div>
  )
}
