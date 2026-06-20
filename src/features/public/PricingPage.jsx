import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppIcon from '@/components/icons/AppIcon'
import useAppStore from '@/store/authStore'
import useUpgradePro from '@/hooks/useUpgradePro'
import useIsPro from '@/hooks/useIsPro'
import useIsLg from '@/hooks/useIsLg'
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
import { fadeUp, motionEase, staggerFast } from '@/features/public/motionVariants'
import {
  COMPARISON_HEADER_CLASS,
  COMPARISON_ROW_CLASS,
  ComparisonTableShell,
  PublicPageContainer,
  PublicPageHeroBackdrop,
  PUBLIC_CONTAINER,
} from '@/features/public/components/publicPageUi'
import { yearlySeoPrice } from '@/constants/pricingDefaults'
import {
  Accordion,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
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

function ComparisonCell({ included, detail }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {included ? (
        <AppIcon name="check" className="size-4 text-emerald-500" aria-label="Included" />
      ) : (
        <AppIcon name="x" className="size-4 text-muted-foreground/40" aria-label="Not included" />
      )}
      {detail && (
        <span className={cn('text-xs', included ? 'text-muted-foreground' : 'text-muted-foreground/60')}>
          {detail}
        </span>
      )}
      {!detail && (
        <span className="text-xs text-muted-foreground">{included ? 'Included' : 'Not included'}</span>
      )}
    </div>
  )
}

function comparisonRow(row, tier) {
  if ('freeIncluded' in row || 'proIncluded' in row) {
    const included = tier === 'free' ? row.freeIncluded : row.proIncluded
    const detail = tier === 'free' ? row.freeDetail : row.proDetail
    return { included: Boolean(included), detail }
  }
  const legacy = tier === 'free' ? row.free : row.pro
  const included = legacy && legacy !== '—'
  return { included, detail: legacy && legacy !== '—' ? legacy : undefined }
}

export default function PricingPage() {
  const navigate = useNavigate()
  const isLg = useIsLg()
  const { loggedIn } = useAppStore()
  const isPro = useIsPro()
  const { startUpgrade, loading } = useUpgradePro()
  const {
    config,
    pricing,
    pricingComparison,
    pricingFaqs,
    freeFeatures,
    proFeatures,
    marketing,
    plans,
  } = usePricingConfig()

  const handleSubscribe = () => startUpgrade({ plan: 'yearly' })
  const seoPrice = yearlySeoPrice(config)
  const proPriceLabel = `${pricing?.pro?.price || '₹599'}${pricing?.pro?.period || '/year'}`
  const regularPrice = pricing?.pro?.regularPrice || plans?.yearly?.regularPrice || '₹999'
  const launchOfferText = marketing?.launchOfferText || 'Founding Member Offer'
  const proHighlights = marketing?.proHighlights || pricing?.pro?.highlights || []
  const seoDescription = PAGE_SEO.pricing.description

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
          faqPageSchema(pricingFaqs),
          breadcrumbSchema([
            { label: 'Home', path: '/' },
            { label: 'Pricing', path: '/pricing' },
          ]),
        ])}
      />

      <PageHero
        eyebrow={launchOfferText}
        title="Land More Interviews."
        highlight="Pay Less."
        description={
          marketing?.heroDescription ||
          'AI-powered resumes, interview prep, and job matching — built for students and early-career professionals. Join as a founding member at our launch price.'
        }
      />

      {proHighlights.length > 0 && (
        <section className="pb-8 md:pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: motionEase }}
            className={cn(PUBLIC_CONTAINER, 'max-w-3xl')}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
              <CardHeader className="pb-3 text-center">
                <CardTitle className="text-lg font-black">What Pro Users Get</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {proHighlights.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <AppIcon name="check" className="size-4 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      )}

      <section className="pb-12 md:pb-16">
        <motion.div
          variants={staggerFast}
          initial="hidden"
          animate="visible"
          className={cn(PUBLIC_CONTAINER, 'grid gap-4', isLg ? 'grid-cols-2' : 'grid-cols-1')}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }}>
            <Card className="relative h-full overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_oklab,var(--muted-foreground)_8%,transparent),transparent)]" />
              <CardHeader>
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Free</CardDescription>
                <div className="flex items-baseline gap-1">
                  <CardTitle className="text-4xl font-black">{pricing?.free?.price || '₹0'}</CardTitle>
                  <span className="text-muted-foreground">{pricing?.free?.period || '/forever'}</span>
                </div>
                <CardDescription>{pricing?.free?.desc || 'Get started with core tools. No credit card needed.'}</CardDescription>
              </CardHeader>
              <CardFooter className="flex-col items-stretch gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outline" className="w-full" onClick={() => navigate(loggedIn ? '/dashboard' : '/signup')}>
                    {loggedIn ? 'Go to Dashboard' : 'Start Free'}
                  </Button>
                </motion.div>
                <ul className="flex w-full flex-col gap-2 text-sm">
                  {freeFeatures.map((f, i) => (
                    <li key={i} className={cn('flex items-center gap-2', !f.included && 'text-muted-foreground/60')}>
                      <span className={cn('font-bold', f.included ? 'text-emerald-500' : 'text-muted-foreground')}>
                        {f.included ? '✓' : '—'}
                      </span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }}>
            <Card className="relative h-full overflow-hidden border-primary/40 shadow-lg shadow-primary/10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)]" />
              <Badge className="absolute right-3 top-3 max-w-[45%] truncate text-[10px] sm:right-4 sm:top-4 sm:max-w-none sm:text-xs">{launchOfferText}</Badge>
              <CardHeader className="pr-24 sm:pr-28">
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">Pro</CardDescription>
                <p className="text-lg text-muted-foreground line-through">
                  {regularPrice}
                  {pricing?.pro?.period || '/year'}
                </p>
                <div className="flex items-baseline gap-1">
                  <CardTitle className="text-4xl font-black">{pricing?.pro?.price || '₹599'}</CardTitle>
                  <span className="text-muted-foreground">{pricing?.pro?.period || '/year'}</span>
                </div>
                <p className="text-sm font-medium text-primary">
                  {marketing?.monthlyEquivalent || 'Only ₹50/month when billed annually'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {marketing?.dailyEquivalent || 'Less than ₹2/day'}
                </p>
                <CardDescription className="pt-1">
                  100 AI credits/month, AI mock interviews, cover letters, career coach, and resume ATS reviews.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex-col items-stretch gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  {isPro && loggedIn ? (
                    <Button className="w-full" variant="secondary" onClick={() => navigate('/dashboard')}>
                      You&apos;re on Pro · Go to dashboard
                    </Button>
                  ) : (
                    <Button className="w-full" disabled={loading} onClick={handleSubscribe}>
                      {loading ? 'Processing...' : `Get Pro — ${proPriceLabel}`}
                    </Button>
                  )}
                </motion.div>
                <ul className="flex w-full flex-col gap-2 text-sm">
                  {proFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="font-bold text-emerald-500">✓</span>
                      <span className={cn(f.highlight && 'font-bold text-foreground')}>{f.text}</span>
                      {f.highlight && (
                        <Badge variant="secondary" className="ml-auto border-primary/20 bg-primary/10 text-primary text-[10px]">
                          AI
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {marketing?.guaranteeText && (
        <section className="pb-10 md:pb-12">
          <PublicPageContainer narrow className="text-center">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="flex flex-col items-center justify-center gap-3 px-4 py-6 sm:flex-row">
                <AppIcon name="check-circle" className="size-6 shrink-0 text-emerald-500" />
                <p className="text-sm font-semibold text-foreground md:text-base">{marketing.guaranteeText}</p>
              </CardContent>
            </Card>
          </PublicPageContainer>
        </section>
      )}

      {marketing?.socialProof && (
        <section className="pb-10 md:pb-12">
          <PublicPageContainer className="text-center">
            <p className="text-sm text-muted-foreground md:text-base">{marketing.socialProof}</p>
          </PublicPageContainer>
        </section>
      )}

      <Separator className={cn(PUBLIC_CONTAINER, 'max-w-6xl')} />

      <section className="py-12 md:py-16">
        <PublicPageContainer>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: motionEase }}
            className="mb-8 text-center"
          >
            <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
              Compare Plans
            </Badge>
            <h2 className="text-3xl font-black text-foreground md:text-4xl">
              Feature <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Comparison</span>
            </h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: motionEase }}>
            <Card className="overflow-hidden">
              <ComparisonTableShell>
                <div className={COMPARISON_HEADER_CLASS}>
                  <span>Feature</span>
                  <span className="text-center">Free</span>
                  <span className="text-center text-primary">Pro</span>
                </div>
                {pricingComparison.map((row, i) => {
                  const freeCell = comparisonRow(row, 'free')
                  const proCell = comparisonRow(row, 'pro')
                  return (
                    <div key={i} className={COMPARISON_ROW_CLASS}>
                      <span className="min-w-0 font-medium text-foreground">{row.feature}</span>
                      <ComparisonCell included={freeCell.included} detail={freeCell.detail} />
                      <ComparisonCell included={proCell.included} detail={proCell.detail} />
                    </div>
                  )
                })}
              </ComparisonTableShell>
            </Card>
          </motion.div>
        </PublicPageContainer>
      </section>

      <Separator className={cn(PUBLIC_CONTAINER)} />

      <section className="py-12 md:py-16">
        <PublicPageContainer className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { ico: 'lock', title: 'Secure Payments', desc: 'Encrypted via Razorpay. UPI, cards, wallets accepted.' },
            { ico: 'lightning', title: 'Instant Activation', desc: 'Pro features unlock the moment your payment is confirmed.' },
            { ico: 'refresh', title: 'Cancel Anytime', desc: 'No lock-in. Cancel from your dashboard. Access until period ends.' },
          ].map((t) => (
            <Card key={t.title} className="text-center">
              <CardContent className="pt-6">
                <div className="mb-2"><AppIcon name={t.ico} className="size-6 text-primary" /></div>
                <CardTitle className="text-base">{t.title}</CardTitle>
                <CardDescription className="mt-2">{t.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </PublicPageContainer>
      </section>

      <Separator className={cn(PUBLIC_CONTAINER)} />

      <section className="py-12 md:py-16">
        <PublicPageContainer narrow>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: motionEase }}
            className="mb-8 text-center"
          >
            <Badge variant="secondary" className="mb-4 border-amber-500/20 bg-amber-500/10 text-amber-500">
              FAQ
            </Badge>
            <h2 className="text-3xl font-black text-foreground md:text-4xl">
              Frequently Asked <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Questions</span>
            </h2>
          </motion.div>

          <motion.div variants={staggerFast} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
            <Accordion type="single" collapsible className="flex flex-col gap-2">
              {pricingFaqs.map((f, i) => (
                <motion.div key={i} variants={fadeUp} transition={{ duration: 0.4, ease: motionEase }}>
                  <PublicFaqItem q={f.q} a={f.a} value={String(i)} variant="pricing" />
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </PublicPageContainer>
      </section>

      <section className="pb-12 md:pb-16">
        <PublicPageContainer>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: motionEase }}
          >
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-muted text-center">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]" />
              <CardContent className="relative py-10 md:py-12">
                <h2 className="mb-3 text-2xl font-black text-foreground md:text-3xl">Ready to Land More Interviews?</h2>
                <p className="mx-auto mb-6 max-w-lg text-muted-foreground">
                  Build ATS-ready resumes, practice with AI mock interviews, and get matched to jobs that fit — all in one platform.
                </p>
                <div className="mb-3 flex flex-wrap justify-center gap-3">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="outline" onClick={() => navigate(loggedIn ? '/dashboard' : '/signup')}>
                      Start Free
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    {isPro && loggedIn ? (
                      <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                        You&apos;re on Pro
                      </Button>
                    ) : (
                      <Button disabled={loading} onClick={handleSubscribe}>
                        {loading ? 'Processing...' : `Upgrade to Pro — ${proPriceLabel}`}
                      </Button>
                    )}
                  </motion.div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {marketing?.guaranteeText || '7-day money-back guarantee'} · Cancel anytime · Free tier available forever
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </PublicPageContainer>
      </section>
    </div>
  )
}
