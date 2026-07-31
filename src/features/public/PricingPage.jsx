import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useAppStore from '@/store/authStore'
import useUpgradePro from '@/hooks/useUpgradePro'
import useIsPro from '@/hooks/useIsPro'
import usePricingConfig from '@/hooks/usePricingConfig'
import SEO from '@/components/SEO'
import {
  PAGE_SEO,
  breadcrumbSchema,
  faqPageSchema,
  normalizeStructuredData,
  organizationSchema,
  productOfferSchema,
  webPageSchema,
} from '@/config/seo'
import PublicFaqItem from '@/features/public/components/PublicFaqItem'
import PlanCard from '@/features/public/components/PlanCard'
import { fadeUp, motionEase, staggerFast } from '@/features/public/motionVariants'
import {
  COMPARISON_HEADER_CLASS,
  COMPARISON_ROW_CLASS,
  ComparisonTableShell,
  PublicPageContainer,
  PublicPageHeroBackdrop,
  PUBLIC_CONTAINER,
} from '@/features/public/components/publicPageUi'
import { highlightedPlan, visiblePlans, yearlySeoPrice } from '@/constants/pricingDefaults'
import { apiFetch } from '@/services/apiClient'
import {
  Accordion,
  Badge,
  cn,
} from '@/components/ui'

function PageHero({ eyebrow, title, highlight, description }) {
  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      <PublicPageHeroBackdrop />
      <PublicPageContainer className="relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: motionEase }}>
          <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
            {eyebrow}
          </Badge>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: motionEase, delay: 0.1 }}
          className="mb-4 text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl"
        >
          {title} <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">{highlight}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: motionEase, delay: 0.2 }}
          className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg"
        >
          {description}
        </motion.p>
      </PublicPageContainer>
    </section>
  )
}

export default function PricingPage() {
  const { loggedIn } = useAppStore()
  const isPro = useIsPro()
  const { startUpgrade, loading } = useUpgradePro()
  const { config, marketing } = usePricingConfig()
  const plans = visiblePlans(config) || []
  const highlight = highlightedPlan(config)

  const [featureComparison, setFeatureComparison] = useState(null)
  const [faqs, setFaqs] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [comp, faqRes] = await Promise.all([
          apiFetch('/config/feature-comparison', { method: 'GET', auth: false }),
          apiFetch('/config/pricing-faqs', { method: 'GET', auth: false }),
        ])
        if (cancelled) return
        setFeatureComparison(comp?.featureComparison || null)
        setFaqs(Array.isArray(faqRes?.faqs) ? faqRes.faqs : [])
      } catch (err) {
        console.warn('PricingPage extras:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const seoPrice = yearlySeoPrice(config)
  const seoDescription = PAGE_SEO.pricing.description
  const columns = Array.isArray(featureComparison?.columns) ? featureComparison.columns : []
  const rows = Array.isArray(featureComparison?.rows) ? featureComparison.rows : []

  return (
    <div>
      <SEO
        {...PAGE_SEO.pricing}
        description={seoDescription}
        structuredData={normalizeStructuredData([
          organizationSchema(),
          webPageSchema({
            name: PAGE_SEO.pricing.title,
            description: seoDescription,
            path: PAGE_SEO.pricing.path,
          }),
          productOfferSchema({
            price: seoPrice,
            description: seoDescription,
          }),
          faqPageSchema(faqs),
          breadcrumbSchema([
            { label: 'Home', path: '/' },
            { label: 'Pricing', path: '/pricing' },
          ]),
        ])}
      />

      <PageHero
        eyebrow={highlight?.badge || marketing?.launchOfferText || 'Pricing'}
        title="Land More Interviews."
        highlight="Pay Less."
        description={
          marketing?.heroDescription ||
          'AI-powered resumes, interview prep, and job matching — built for students and early-career professionals.'
        }
      />

      <section className="pb-12 md:pb-16">
        <motion.div
          variants={staggerFast}
          initial="hidden"
          animate="visible"
          className={cn(
            PUBLIC_CONTAINER,
            'grid gap-4',
            plans.length >= 4 ? 'lg:grid-cols-4 md:grid-cols-2' : plans.length === 3 ? 'lg:grid-cols-3 md:grid-cols-2' : 'md:grid-cols-2',
          )}
        >
          {plans.map((plan) => (
            <motion.div key={plan.id} variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }}>
              <PlanCard
                plan={plan}
                isProUser={isPro && plan.tier === 'pro'}
                upgradeLoading={loading}
                loggedIn={loggedIn}
                onUpgrade={(p) => startUpgrade({ plan: p.id })}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {rows.length > 0 && (
        <section className="pb-12 md:pb-16">
          <div className={PUBLIC_CONTAINER}>
            <h2 className="mb-6 text-center text-2xl font-black text-foreground md:text-3xl">
              {featureComparison?.title || 'Feature Comparison'}
            </h2>
            <ComparisonTableShell>
              <div
                className={COMPARISON_HEADER_CLASS}
                style={{ gridTemplateColumns: `minmax(140px,1.4fr) repeat(${columns.length}, minmax(80px,1fr))` }}
              >
                <div className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">Feature</div>
                {columns.map((col) => (
                  <div key={col.id || col.key} className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </div>
                ))}
              </div>
              {rows.map((row) => (
                <div
                  key={row.id || row.feature}
                  className={COMPARISON_ROW_CLASS}
                  style={{ gridTemplateColumns: `minmax(140px,1.4fr) repeat(${columns.length}, minmax(80px,1fr))` }}
                >
                  <div className="text-sm font-medium text-foreground">{row.feature}</div>
                  {columns.map((col) => {
                    const val = row.values?.[col.key] ?? '—'
                    const empty = !val || val === '-' || val === '—'
                    return (
                      <div key={col.key} className={cn('text-center text-xs', empty ? 'text-muted-foreground/50' : 'text-muted-foreground')}>
                        {val}
                      </div>
                    )
                  })}
                </div>
              ))}
            </ComparisonTableShell>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="pb-16 md:pb-20">
          <div className={cn(PUBLIC_CONTAINER, 'max-w-3xl')}>
            <h2 className="mb-6 text-center text-2xl font-black text-foreground md:text-3xl">FAQ</h2>
            <Accordion className="space-y-2">
              {faqs.map((f, i) => (
                <PublicFaqItem key={f.id || f.q} q={f.q} a={f.a} value={`faq-${f.id || i}`} variant="pricing" />
              ))}
            </Accordion>
          </div>
        </section>
      )}
    </div>
  )
}
