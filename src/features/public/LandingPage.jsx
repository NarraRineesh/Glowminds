import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useIsLg from '@/hooks/useIsLg'
import AppIcon from '@/components/icons/AppIcon'
import SEO from '@/components/SEO'
import { SITE_URL } from '@/config/site'
import PublicFaqItem from '@/features/public/components/PublicFaqItem'
import LandingHero from '@/features/public/components/LandingHero'
import { LandingMockupCard } from '@/features/public/components/LandingMockupPreviews'
import LandingReveal, { LandingRevealItem, LandingRevealStagger } from '@/features/public/components/LandingReveal'
import {
  LandingCheckList,
  LandingFeatureGrid,
  LandingSection,
  LandingSectionTitle,
  featureBadgeClass,
  toolIconClass,
} from '@/features/public/components/landingPageUi'
import { DEFAULT_LANDING_CONTENT } from '@/data/landingDefaults'
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
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Separator,
  cn,
} from '@/components/ui'

const {
  companies,
  features,
  steps,
  tools,
  testimonials,
  faqs,
  stats,
} = DEFAULT_LANDING_CONTENT

const HOME_FEATURES = features?.slice(0, 4) ?? []
const HOME_TOOLS = tools?.slice(0, 9) ?? []

export default function LandingPage() {
  const navigate = useNavigate()
  const isLg = useIsLg()
  const [ctaEmail, setCtaEmail] = useState('')
  const { pricing } = usePricingConfig()

  const goSignup = (email) => {
    const q = email?.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''
    navigate(`/signup${q}`)
  }

  return (
    <div className="bg-background">
      <SEO
        path="/"
        title="AI Career Platform for Students & Job Seekers"
        description="15+ AI-powered tools for students and job seekers in India. Build ATS-optimized resumes, get matched to 12,400+ daily jobs, practice AI interviews, generate cover letters. Free tier available."
        keywords="AI resume builder, job search India, student career platform, AI interview prep, fresher jobs, internship finder, career coach AI, cover letter generator, grammar checker, job application tracker, Glowminds"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Glowminds AI',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '52000' },
          description:
            'AI-powered career platform for students with resume builder, job matching, interview prep, and 15+ career tools',
          author: { '@type': 'Organization', name: 'Glowminds AI', url: SITE_URL },
        }}
      />

      <LandingHero stats={stats} onSignup={() => goSignup()} />

      {/* Logo cloud */}
      <LandingSection muted className="py-8 md:py-10">
        <LandingReveal>
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Students placed at top companies
          </p>
        </LandingReveal>
        <LandingRevealStagger className="flex flex-wrap items-center justify-center gap-2">
          {companies?.map((name) => (
            <LandingRevealItem key={name}>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                {name}
              </Badge>
            </LandingRevealItem>
          ))}
        </LandingRevealStagger>
      </LandingSection>

      {/* Feature highlights */}
      <LandingSection>
        <LandingReveal>
          <LandingSectionTitle
            eyebrow="Platform"
            title="Everything you need to"
            highlight="land the role"
            subtitle="Resume, jobs, interviews, and tracking — one AI-powered workspace."
          />
        </LandingReveal>
        <div className="space-y-16 md:space-y-20">
          {HOME_FEATURES.map((feature, index) => (
            <LandingReveal key={feature.title} delay={index * 0.05}>
              <LandingFeatureGrid reverse={feature.reverse}>
                <div className="space-y-4">
                  <Badge variant="outline" className={featureBadgeClass(index)}>
                    {feature.badge}
                  </Badge>
                  <h3 className="text-xl font-bold text-foreground md:text-2xl">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
                  <LandingCheckList items={feature.bullets} />
                  {index === 0 ? (
                    <Button onClick={() => goSignup()}>Try resume builder free</Button>
                  ) : null}
                </div>
                <LandingMockupCard src={feature.image} />
              </LandingFeatureGrid>
            </LandingReveal>
          ))}
        </div>
      </LandingSection>

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

      {/* AI tools */}
      <LandingSection>
        <LandingReveal>
          <LandingSectionTitle
            title="Explore all"
            highlight="AI tools"
            subtitle="15+ tools covering every step from resume to offer letter."
          />
        </LandingReveal>
        <LandingRevealStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_TOOLS.map((tool) => (
            <LandingRevealItem key={tool.title}>
              <Card className="h-full">
                <CardContent className="space-y-3 pt-6">
                  <div className={cn('flex size-10 items-center justify-center rounded-lg', toolIconClass(tool.ico))}>
                    <AppIcon name={tool.ico} className="size-5" />
                  </div>
                  <CardTitle className="text-base">{tool.title}</CardTitle>
                  <CardDescription>{tool.desc}</CardDescription>
                </CardContent>
              </Card>
            </LandingRevealItem>
          ))}
        </LandingRevealStagger>
        <LandingReveal className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/features')}>See all features</Button>
        </LandingReveal>
      </LandingSection>

      {/* Pricing */}
      <LandingSection muted>
        <LandingReveal>
          <LandingSectionTitle
            title="Choose the plan"
            highlight="right for you"
            subtitle="Start free. Upgrade when you need more power."
          />
        </LandingReveal>
        {pricing ? (
          <LandingRevealStagger className={cn('mx-auto grid max-w-4xl gap-4', isLg ? 'grid-cols-2' : 'grid-cols-1')}>
            <LandingRevealItem>
              <Card>
                <CardHeader>
                  <Badge variant="secondary">{pricing.free.label}</Badge>
                  <div className="flex items-baseline gap-1 pt-2">
                    <CardTitle className="text-3xl">{pricing.free.price}</CardTitle>
                    <span className="text-sm text-muted-foreground">{pricing.free.period}</span>
                  </div>
                  <CardDescription>{pricing.free.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <LandingCheckList items={pricing.free.features} />
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => goSignup()}>
                    Get started free
                  </Button>
                </CardFooter>
              </Card>
            </LandingRevealItem>
            <LandingRevealItem>
              <Card className="border-primary/40">
                <CardHeader>
                  <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                    {pricing.pro.label}
                  </Badge>
                  <div className="flex items-baseline gap-1 pt-2">
                    <CardTitle className="text-3xl">{pricing.pro.price}</CardTitle>
                    <span className="text-sm text-muted-foreground">{pricing.pro.period}</span>
                  </div>
                  <CardDescription>{pricing.pro.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <LandingCheckList items={pricing.pro.features.slice(0, 6)} />
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => navigate('/pricing')}>
                    View Pro plan
                  </Button>
                </CardFooter>
              </Card>
            </LandingRevealItem>
          </LandingRevealStagger>
        ) : null}
      </LandingSection>

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

      {/* Final CTA */}
      <LandingSection>
        <LandingReveal y={28}>
          <Card className="mx-auto max-w-2xl border-primary/30 text-center">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Ready to start your career?</CardTitle>
              <CardDescription>
                Join {stats?.students || '52K+'} students using Glowminds. Free forever plan — no credit card required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={ctaEmail}
                  onChange={(e) => setCtaEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') goSignup(ctaEmail) }}
                />
                <Button className="shrink-0" onClick={() => goSignup(ctaEmail)}>Get started</Button>
              </div>
              <p className="text-xs text-muted-foreground">Cancel anytime · Student-friendly pricing</p>
            </CardContent>
          </Card>
        </LandingReveal>
      </LandingSection>
    </div>
  )
}
