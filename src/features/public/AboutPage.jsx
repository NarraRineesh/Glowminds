import { Link } from 'react-router-dom'
import { AppAuthLink } from '@/components/HostLinks'
import { motion } from 'framer-motion'
import SEO from '@/components/SEO'
import {
  PAGE_SEO,
  breadcrumbSchema,
  normalizeStructuredData,
  organizationSchema,
  webPageSchema,
} from '@/config/seo'
import { motionEase } from '@/features/public/motionVariants'
import useLandingConfig from '@/hooks/useLandingConfig'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from '@/components/ui'

const MISSION_HIGHLIGHTS = [
  'Bridge the gap between tier-1 and tier-2/3 colleges',
  'Replace expensive career coaches with free AI tools',
  'Make job discovery effortless and personalised',
  'Give every student the same career tools as a well-funded placement cell',
]

const VALUE_BADGES = [
  ['Equal Access', 'border-border bg-card text-foreground'],
  ['AI-First', 'border-border bg-card text-foreground'],
  ['Student-Priced', 'border-border bg-card text-foreground'],
  ['Privacy First', 'border-border bg-card text-foreground'],
]

function PageHero({ badge, title, highlight, description }) {
  return (
    <section className="relative overflow-hidden border-b border-border py-12 md:py-16">
      <div className="relative z-10 mx-auto max-w-6xl px-5 text-center md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: motionEase }}>
          <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
            {badge}
          </Badge>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionEase, delay: 0.1 }}
          className="mb-4 text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl"
        >
          {title} <span className="text-primary">{highlight}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionEase, delay: 0.2 }}
          className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          {description}
        </motion.p>
      </div>
    </section>
  )
}

export default function AboutPage() {
  const { config: landingConfig } = useLandingConfig()
  const aboutMetrics = landingConfig.aboutMetrics || []
  const socialProof = landingConfig.socialProof || {}

  return (
    <div>
      <SEO
        {...PAGE_SEO.about}
        structuredData={normalizeStructuredData([
          organizationSchema(),
          webPageSchema({
            name: PAGE_SEO.about.title,
            description: PAGE_SEO.about.description,
            path: PAGE_SEO.about.path,
            type: 'AboutPage',
          }),
          breadcrumbSchema([
            { label: 'Home', path: '/' },
            { label: 'About', path: '/about' },
          ]),
        ])}
      />

      <PageHero
        badge="About"
        title="We're Building the"
        highlight="Career Operating System"
        description="Glowminds is an AI-Powered Career Operating System — not just a resume site. Every student gets professional-grade tools: resumes, jobs, Glow (Bot), interviews, and tracking."
      />

      <section className="pb-12 md:pb-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-5 md:px-8 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: motionEase }}>
            <Card className="h-full">
              <CardHeader>
                <Badge variant="secondary" className="w-fit border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                  OUR MISSION
                </Badge>
                <CardTitle className="text-xl">Democratize Career Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  We believe a student&apos;s potential shouldn&apos;t be limited by their college tier or network. Glowminds is an AI-Powered Career Operating System that levels the playing field with Glow (Bot) and professional-grade career tools.
                </p>
                <p>
                  Our goal is ambitious but simple: <strong className="text-foreground">ensure no talented student gets left behind</strong> because they didn&apos;t know how to write a resume, couldn&apos;t find the right job listing, or lacked the confidence to ace an interview.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {MISSION_HIGHLIGHTS.map((h) => (
                    <div key={h} className="flex items-start gap-2">
                      <span className="text-emerald-500">✓</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {VALUE_BADGES.map(([label, cls]) => (
                    <Badge key={label} variant="secondary" className={cls}>
                      {label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: motionEase, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <Badge variant="secondary" className="w-fit border-primary/20 bg-primary/10 text-primary">
                  OUR STORY
                </Badge>
                <CardTitle className="text-xl">Born from Frustration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Glowminds started because talented students from tier-2 and tier-3 colleges were missing out on good roles — not for lack of ability, but because resume help, job matching, and interview practice were scattered or expensive.
                </p>
                <p>Job portals were overwhelming. Resume builders were generic. Career advice was locked behind expensive paywalls or campus placement cells that only served the top 10%.</p>
                <p>
                  We asked ourselves: <strong className="text-foreground">What if AI could be the great equaliser?</strong> That question became Glowminds. Today we help students and early-career people worldwide land roles — not only in India.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-panel)] border border-border bg-card p-4">
                  {aboutMetrics.map((metric, i, arr) => (
                    <div key={metric.label} className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-mono text-lg font-semibold text-primary">{metric.value}</div>
                        <div className="text-[10px] text-muted-foreground">{metric.label}</div>
                      </div>
                      {i < arr.length - 1 && <Separator orientation="vertical" className="hidden h-8 sm:block" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: motionEase }}
        className="pb-12 md:pb-16"
      >
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Card className="relative overflow-hidden text-center">
            <CardContent className="relative py-10 md:py-12">
              <h2 className="mb-3 text-2xl font-semibold text-foreground md:text-3xl">{socialProof.joinStudentsTitle || 'Join students getting hired'}</h2>
              <p className="mx-auto mb-6 max-w-md text-base text-muted-foreground">Start building your career today — completely free.</p>
              <div className="mb-3 flex flex-wrap justify-center gap-3">
                <Button size="lg" nativeButton={false} render={<AppAuthLink to="/signup" />}>
                  Get Started Now
                </Button>
                <Button size="lg" variant="outline" render={<Link to="/contact" />}>
                  Contact Us
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">No credit card required · Free forever tier available</p>
            </CardContent>
          </Card>
        </div>
      </motion.section>

    </div>
  )
}
