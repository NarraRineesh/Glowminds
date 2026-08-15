import { Link } from 'react-router-dom'
import AppIcon from '@/components/icons/AppIcon'
import SEO from '@/components/SEO'
import {
  PAGE_SEO,
  breadcrumbSchema,
  faqPageSchema,
  normalizeStructuredData,
  organizationSchema,
  softwareApplicationSchema,
  siteNavigationSchema,
  webSiteSchema,
} from '@/config/seo'
import PublicFaqItem from '@/features/public/components/PublicFaqItem'
import LandingHero from '@/features/public/components/LandingHero'
import LandingAtsPreview from '@/features/public/components/LandingAtsPreview'
import { LandingMockupCard } from '@/features/public/components/LandingMockupPreviews'
import LandingOutcomeGroups from '@/features/public/components/LandingOutcomeGroups'
import LandingPricingCards from '@/features/public/components/LandingPricingCards'
import LandingWhyGlowminds from '@/features/public/components/LandingWhyGlowminds'
import LandingReveal, { LandingRevealItem, LandingRevealStagger } from '@/features/public/components/LandingReveal'
import {
  LandingCheckList,
  LandingFeatureGrid,
  LandingSection,
  LandingSectionTitle,
  featureBadgeClass,
} from '@/features/public/components/landingPageUi'
import { DEFAULT_LANDING_CONTENT, getHomeFeatures } from '@/data/landingDefaults'
import useLandingConfig from '@/hooks/useLandingConfig'
import usePricingConfig from '@/hooks/usePricingConfig'
import {
  Accordion,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@/components/ui'

const {
  features,
  hero,
  heroMetrics,
  trustBadges,
  outcomeGroups,
  whyGlowminds,
  exitCta,
  steps,
  testimonials,
  faqs,
  stats,
} = DEFAULT_LANDING_CONTENT

const HOME_FEATURES = getHomeFeatures(features)

export default function LandingPage() {
  const { config: landingConfig } = useLandingConfig()
  const { pricing: configPricing } = usePricingConfig()
  const resolvedHeroMetrics = landingConfig.heroMetrics || heroMetrics
  const resolvedStats = landingConfig.stats || stats
  const pricing = configPricing

  return (
    <div className="bg-background">
      <SEO
        {...PAGE_SEO.home}
        structuredData={normalizeStructuredData([
          organizationSchema(),
          webSiteSchema(),
          siteNavigationSchema(),
          softwareApplicationSchema(),
          faqPageSchema(faqs),
          breadcrumbSchema([{ label: 'Home', path: '/' }]),
        ])}
      />

      <LandingHero
        hero={hero}
        heroMetrics={resolvedHeroMetrics}
        trustBadges={trustBadges}
        stats={resolvedStats}
      />

      {/* Feature story */}
      <LandingSection>
        <LandingReveal>
          <LandingSectionTitle
            eyebrow="AI-Powered Career Operating System"
            title="From first resume to offer"
            highlight="in one OS"
            subtitle="Build, apply, prepare, and track — a Career Operating System designed for how job seekers actually work."
          />
        </LandingReveal>
        <div className="space-y-16 md:space-y-20">
          {HOME_FEATURES.map((feature, index) => (
            <LandingReveal key={feature.key || feature.title} delay={index * 0.05}>
              <LandingFeatureGrid reverse={index % 2 === 1}>
                <div className="space-y-4">
                  <Badge variant="outline" className={featureBadgeClass(index)}>
                    {feature.badge}
                  </Badge>
                  <h3 className="text-xl font-bold text-foreground md:text-2xl">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
                  <LandingCheckList items={feature.bullets} />
                  {feature.key === 'resume-builder' ? (
                    <div className="space-y-4">
                      <LandingAtsPreview className="max-w-sm" />
                      <Button render={<Link to="/signup" />}>{feature.cta || 'Try resume builder free'}</Button>
                    </div>
                  ) : feature.cta ? (
                    <Button variant={index === 0 ? 'default' : 'outline'} render={<Link to="/signup" />}>
                      {feature.cta}
                    </Button>
                  ) : null}
                </div>
                <LandingMockupCard src={feature.image} stats={resolvedStats} />
              </LandingFeatureGrid>
            </LandingReveal>
          ))}
        </div>
      </LandingSection>

      <LandingWhyGlowminds whyGlowminds={whyGlowminds} />

      {/* Steps */}
      <LandingSection muted>
        <LandingReveal>
          <LandingSectionTitle
            title="Four steps to"
            highlight="success"
            subtitle="No experience needed — our AI handles the heavy lifting."
          />
        </LandingReveal>
        <LandingRevealStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps?.map((step) => (
            <LandingRevealItem key={step.num}>
              <Card className="h-full text-center">
                <CardContent className="space-y-2 pt-6">
                  <Badge variant="secondary" className="font-mono">{step.num}</Badge>
                  <AppIcon name={step.ico} className="mx-auto size-8 text-primary" />
                  <CardTitle className="text-base">{step.title}</CardTitle>
                  <CardDescription>{step.desc}</CardDescription>
                </CardContent>
              </Card>
            </LandingRevealItem>
          ))}
        </LandingRevealStagger>
      </LandingSection>

      <LandingOutcomeGroups outcomeGroups={outcomeGroups} />

      <LandingSection className="pt-0">
        <LandingReveal className="text-center">
          <Button variant="outline" render={<Link to="/features" />}>See all features</Button>
        </LandingReveal>
      </LandingSection>

      <LandingPricingCards pricing={pricing} />

      {/* Testimonials */}
      <LandingSection>
        <LandingReveal>
          <LandingSectionTitle
            title="What our users"
            highlight="say"
            subtitle="Real stories from students who landed their dream jobs."
          />
        </LandingReveal>
        <LandingRevealStagger className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {testimonials?.map((item) => (
            <LandingRevealItem key={item.name}>
              <Card className="h-full">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <AppIcon key={i} name="star" className="size-4 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">&ldquo;{item.text}&rdquo;</p>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{item.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LandingRevealItem>
          ))}
        </LandingRevealStagger>
      </LandingSection>

      {/* FAQ */}
      <LandingSection muted>
        <LandingReveal>
          <LandingSectionTitle title="Frequently asked" highlight="questions" />
        </LandingReveal>
        <LandingReveal>
          <Accordion type="single" collapsible className="mx-auto max-w-3xl space-y-2">
            {faqs?.map((item, index) => (
              <PublicFaqItem key={item.q} q={item.q} a={item.a} value={String(index)} variant="landing" />
            ))}
          </Accordion>
        </LandingReveal>
      </LandingSection>

      {/* Exit CTA */}
      <LandingSection>
        <LandingReveal y={28}>
          <Card className="mx-auto max-w-2xl border-primary/30 bg-gradient-to-b from-primary/5 to-card text-center">
            <CardHeader className="space-y-3">
              <CardTitle className="text-xl md:text-2xl">{exitCta?.title || 'Ready to Land Your Next Job?'}</CardTitle>
              <CardDescription className="text-base">
                {exitCta?.body || 'Build your resume, discover opportunities, and prepare for interviews — all for free.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="min-w-[160px]" render={<Link to="/signup" />}>
                {exitCta?.button || 'Start Free'}
              </Button>
            </CardContent>
          </Card>
        </LandingReveal>
      </LandingSection>
    </div>
  )
}
