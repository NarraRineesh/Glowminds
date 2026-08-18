import { useNavigate } from 'react-router-dom'
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
  ['Equal Access', 'border-primary/20 bg-primary/10 text-primary'],
  ['AI-First', 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'],
  ['Student-Priced', 'border-amber-500/20 bg-amber-500/10 text-amber-500'],
  ['Privacy First', 'border-violet-500/20 bg-violet-500/10 text-violet-500'],
]

function PageHero({ badge, title, highlight, description }) {
  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_50%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_50%,transparent)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: motionEase }}>
          <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
            {badge}
          </Badge>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionEase, delay: 0.1 }}
          className="mb-4 text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl"
        >
          {title} <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">{highlight}</span>
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
  const navigate = useNavigate()

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
        badge="✦ ABOUT US"
        title="We're Building the Future of"
        highlight="Student Careers"
        description="Glowminds was born from a simple idea: every student deserves smart tools to launch their career, not just those from top colleges."
      />

      <section className="pb-12 md:pb-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 md:px-8 lg:grid-cols-2">
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
                  We believe a student&apos;s potential shouldn&apos;t be limited by their college tier or network. Glowminds levels the playing field with AI-powered tools that give every student access to professional-grade career resources.
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
                  We asked ourselves: <strong className="text-foreground">What if AI could be the great equaliser?</strong> That question became Glowminds. Today we build for students and early-career professionals across India — starting with honest tools, not vanity counts.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4">
                  {[
                    ['15', 'Resume templates'],
                    ['ATS', 'Resume scoring'],
                    ['50+', 'Job portals'],
                    ['₹0', 'Free to start'],
                  ].map(([v, l], i, arr) => (
                    <div key={l} className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-mono text-lg font-black bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">{v}</div>
                        <div className="text-[10px] text-muted-foreground">{l}</div>
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
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-muted text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)]" />
            <CardContent className="relative py-10 md:py-12">
              <h2 className="mb-3 text-2xl font-black text-foreground md:text-3xl">Join students getting hired</h2>
              <p className="mx-auto mb-6 max-w-md text-base text-muted-foreground">Start building your career today — completely free.</p>
              <div className="mb-3 flex flex-wrap justify-center gap-3">
                <Button size="lg" onClick={() => navigate('/signup')}>
                  Get Started Now
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
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
