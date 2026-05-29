import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAppStore from '@/store/authStore'
import useUpgradePro from '@/hooks/useUpgradePro'
import useIsLg from '@/hooks/useIsLg'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import { pageUrl } from '@/config/site'
import PublicFaqItem from '@/features/public/components/PublicFaqItem'
import { fadeUp, motionEase, staggerFast } from '@/features/public/motionVariants'
import { DEFAULT_LANDING_CONTENT } from '@/data/landingDefaults'
import { AppIcon,
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

const { pricing, pricingComparison, pricingFaqs, freeFeatures, proFeatures } = DEFAULT_LANDING_CONTENT

function PageHero({ eyebrow, title, highlight, description }) {
  return (
    <section className="relative overflow-hidden px-4 py-12 md:px-8 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]" />
      <div className="pointer-events-none absolute -left-20 top-1/4 size-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 size-48 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center md:px-8">
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
      </div>
    </section>
  )
}

export default function PricingPage() {
  const navigate = useNavigate()
  const isLg = useIsLg()
  const { loggedIn } = useAppStore()
  const { startUpgrade, loading } = useUpgradePro()

  const getMonthlyPrice = () => {
    const priceStr = pricing?.pro?.price || '₹399'
    const numericPrice = parseInt(priceStr.replace(/[^\d]/g, ''), 10)
    return `₹${Math.round(numericPrice / 12)}/month`
  }

  const handleSubscribe = () => startUpgrade({ plan: 'yearly' })

  return (
    <div>
      <SEO
        title="Pricing"
        path="/pricing"
        description="Glowminds Pro — AI Resume Builder, Career Coach, Interview Prep, and more. Just ₹399/year (₹33/month). Affordable plans built for Indian students and freshers."
        keywords="AI career platform pricing, student career tools pricing, resume builder price, career coach cost, interview prep pricing, affordable career tools India, student job platform pricing"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Offer',
          name: 'Glowminds Pro Plan',
          price: '399',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: pageUrl('/pricing'),
          seller: { '@type': 'Organization', name: 'Glowminds AI' },
        }}
      />

      <PageHero
        eyebrow="Simple, Transparent Pricing"
        title="One Plan."
        highlight="Everything Included."
        description="Unlimited access to AI-powered career tools. Built for students, priced for students. Just ₹33/month."
      />

      <section className="pb-12 md:pb-16">
        <motion.div
          variants={staggerFast}
          initial="hidden"
          animate="visible"
          className={cn('mx-auto grid max-w-6xl gap-4 px-4 md:px-8', isLg ? 'grid-cols-2' : 'grid-cols-1')}
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
                <CardDescription>Get started with core tools. No credit card needed.</CardDescription>
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
              <Badge className="absolute right-4 top-4">MOST POPULAR</Badge>
              <CardHeader>
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">Pro</CardDescription>
                <div className="flex items-baseline gap-1">
                  <CardTitle className="text-4xl font-black">{pricing?.pro?.price || '₹399'}</CardTitle>
                  <span className="text-muted-foreground">{pricing?.pro?.period || '/year'}</span>
                </div>
                <p className="text-sm text-muted-foreground">That&apos;s just {getMonthlyPrice()} — less than a cup of coffee</p>
                <Badge variant="secondary" className="w-fit border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                  Save 32% vs monthly
                </Badge>
                <CardDescription className="pt-1">Unlimited access to all AI-powered career tools for 12 months.</CardDescription>
              </CardHeader>
              <CardFooter className="flex-col items-stretch gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button className="w-full" disabled={loading} onClick={handleSubscribe}>
                    {loading ? 'Processing...' : `Get Pro — ${pricing?.pro?.price || '₹399'}${pricing?.pro?.period || '/year'}`}
                  </Button>
                </motion.div>
                <ul className="flex w-full flex-col gap-2 text-sm">
                  {proFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="font-bold text-emerald-500">✓</span>
                      <span className={cn(f.highlight && 'font-bold text-foreground')}>{f.text}</span>
                      {f.highlight && (
                        <Badge variant="secondary" className="ml-auto border-primary/20 bg-primary/10 text-primary text-[10px]">
                          NEW
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

      <Separator className="mx-auto max-w-6xl" />

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
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
              <div className="grid grid-cols-3 gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:px-6">
                <span>Feature</span>
                <span className="text-center">Free</span>
                <span className="text-center text-primary">Pro</span>
              </div>
              {pricingComparison.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-3 gap-4 border-b border-border px-4 py-3 text-sm last:border-0 md:px-6"
                >
                  <span className="font-medium text-foreground">{row.feature}</span>
                  <span className={cn('text-center', row.free === '—' ? 'text-muted-foreground' : 'text-muted-foreground')}>
                    {row.free}
                  </span>
                  <span className="text-center font-medium text-primary">{row.pro}</span>
                </div>
              ))}
            </Card>
          </motion.div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      <section className="py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-8">
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
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
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
        </div>
      </section>

      <section className="pb-12 md:pb-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: motionEase }}
          >
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-muted text-center">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]" />
              <CardContent className="relative py-10 md:py-12">
                <h2 className="mb-3 text-2xl font-black text-foreground md:text-3xl">Ready to Go Pro?</h2>
                <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                  Join thousands of students landing their dream jobs with Glowminds Pro.
                </p>
                <div className="mb-3 flex flex-wrap justify-center gap-3">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Button disabled={loading} onClick={handleSubscribe}>
                      {loading ? 'Processing...' : `Get Pro — ${pricing?.pro?.price || '₹399'}${pricing?.pro?.period || '/year'}`}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="outline" onClick={() => navigate(loggedIn ? '/dashboard' : '/signup')}>
                      Start Free
                    </Button>
                  </motion.div>
                </div>
                <p className="text-xs text-muted-foreground">Cancel anytime · Free tier available forever</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
