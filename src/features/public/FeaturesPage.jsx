import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import { pageUrl } from '@/config/site'
import { fadeUp, motionEase, staggerFast } from '@/features/public/motionVariants'
import { AppIcon,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  cn,
} from '@/components/ui'

const MORE_FEATURES = [
  { ico: 'bell', bg: 'bg-violet-500/10', title: 'Real-time Job Alerts', desc: 'Instant push + email alerts the moment a high-match job drops. Be first in line, every time.' },
  { ico: 'lightning', bg: 'bg-destructive/10', title: '1-Click Apply', desc: 'Your profile auto-fills every form. One click, details go straight to the recruiter.' },
  { ico: 'cover-letters', bg: 'bg-primary/10', title: 'Cover Letter AI', desc: 'AI reads the JD, pulls your achievements, and generates a tailored cover letter in seconds.' },
  { ico: 'salary', bg: 'bg-amber-500/10', title: 'Salary Insights', desc: 'Real market-rate salary data for your target role, city, and experience level.' },
  { ico: 'trend-up', bg: 'bg-emerald-500/10', title: 'Career Analytics', desc: 'Track response rates, interview conversion, and time-to-offer with visual dashboards.' },
  { ico: 'admin', bg: 'bg-violet-500/10', title: 'Privacy & Security', desc: 'End-to-end encryption, zero data selling, and full control to export or delete anytime.' },
  { ico: 'globe', bg: 'bg-primary/10', title: 'Multi-Portal Sync', desc: 'One profile syncs across 50+ job portals. Update once, apply everywhere.' },
  { ico: 'brain', bg: 'bg-amber-500/10', title: 'Skill Gap Analysis', desc: 'AI identifies missing skills for your dream role and recommends courses to bridge the gap.' },
]

const STEPS = [
  { n: '01', t: 'Create Profile', d: 'Sign up in 30 seconds. Add skills, education, and preferences.', color: 'text-primary' },
  { n: '02', t: 'Build Resume', d: 'AI generates an ATS-optimized resume with live preview.', color: 'text-emerald-500' },
  { n: '03', t: 'Get Matched', d: '50+ portals scanned. Jobs ranked by your match score.', color: 'text-amber-500' },
  { n: '04', t: 'Land Offers', d: 'One-click apply, AI interview prep, Kanban tracking.', color: 'text-violet-500' },
]

const PREVIEW_JOBS = [
  { logo: 'search', bg: 'bg-blue-500/15', title: 'Software Intern — Python', co: 'Google · Hyderabad', score: '96%', scoreCls: 'bg-emerald-500/15 text-emerald-500' },
  { logo: 'food', bg: 'bg-emerald-500/15', title: 'Frontend Developer', co: 'Swiggy · Bangalore', score: '91%', scoreCls: 'bg-emerald-500/15 text-emerald-500' },
  { logo: 'credit-card', bg: 'bg-violet-500/15', title: 'Full Stack Engineer', co: 'Razorpay · Remote', score: '85%', scoreCls: 'bg-primary/15 text-primary' },
]

function SectionHead({ badge, badgeClass, title, highlight, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: motionEase }}
      className="mb-8 text-center"
    >
      <Badge variant="secondary" className={cn('mb-4', badgeClass)}>
        {badge}
      </Badge>
      <h2 className="mb-3 text-3xl font-black text-foreground md:text-4xl">
        {title} <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">{highlight}</span>
      </h2>
      <p className="mx-auto max-w-2xl text-muted-foreground">{description}</p>
    </motion.div>
  )
}

function CheckList({ items }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((c) => (
        <div key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-bold text-emerald-500">✓</span>
          {c}
        </div>
      ))}
    </div>
  )
}

export default function FeaturesPage() {
  const navigate = useNavigate()

  return (
    <div>
      <SEO
        title="Features"
        path="/features"
        description="Explore 15+ AI-powered career tools: AI Resume Builder, Smart Job Matching across 50+ portals, AI Career Coach, Interview Prep, Application Tracker, Cover Letter Generator, and more."
        keywords="AI resume builder features, smart job matching, AI career coach, interview prep features, application tracker, cover letter generator, career tools"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Glowminds AI Features',
          description: 'Explore 15+ AI-powered career tools for students and job seekers',
          url: pageUrl('/features'),
        }}
      />

      <section className="relative overflow-hidden px-4 py-12 md:px-8 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]" />
        <div className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-1/3 size-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center md:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: motionEase }}>
            <Badge variant="secondary" className="mb-4 gap-2 border-primary/20 bg-primary/10 text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Platform Features
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: motionEase, delay: 0.1 }}
            className="mb-4 text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl"
          >
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Land Your Dream Job</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: motionEase, delay: 0.2 }}
            className="mx-auto mb-6 max-w-2xl text-muted-foreground"
          >
            From resume to offer letter — AI-powered tools that cover the full career journey for students and fresh graduates.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: motionEase, delay: 0.3 }}
            className="mb-8 flex flex-wrap justify-center gap-3"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button onClick={() => navigate('/signup')}>Get Started Free</Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" onClick={() => navigate('/pricing')}>
                View Pricing
              </Button>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8"
          >
            {[
              ['12K+', 'Daily Jobs'],
              ['94%', 'Match Rate'],
              ['52K+', 'Students'],
              ['4.9/5', 'Rating'],
            ].map(([v, l]) => (
              <div key={l} className="text-center">
                <strong className="block font-mono text-2xl font-black bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  {v}
                </strong>
                <span className="text-xs text-muted-foreground">{l}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <SectionHead
            badge="Core Features"
            badgeClass="border-primary/20 bg-primary/10 text-primary"
            title="Powerful Tools,"
            highlight="One Platform"
            description="Every feature is designed to eliminate friction from your job search and maximize your chances."
          />

          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }} className="lg:col-span-2">
              <Card className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent)]" />
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-xl"><AppIcon name="resume" className="size-5 text-primary" /></div>
                  <CardTitle>AI Resume Builder</CardTitle>
                  <CardDescription>
                    Answer a few questions about your education, skills, and experience — our AI crafts a polished, ATS-optimized PDF resume in under 2 minutes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CheckList items={['6 Pro Templates', 'ATS Score Checker', 'Live Preview', 'PDF Export', 'AI Keywords', 'Drag & Drop Sections']} />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="border-primary/20 bg-primary/10 text-primary">
                      Pro Feature
                    </Badge>
                    <Badge variant="secondary" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                      Most Popular
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-semibold">ATS Score</span>
                      <span className="font-bold text-emerald-500">96/100</span>
                    </div>
                    <Progress value={96} className="mb-3 h-2" />
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-muted-foreground">Keywords</span>
                        <strong className="block text-emerald-500">14/15</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Format</span>
                        <strong className="block text-emerald-500">Perfect</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Length</span>
                        <strong className="block text-primary">1 Page</strong>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }}>
              <Card className="relative h-full overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,color-mix(in_oklab,var(--emerald-500)_8%,transparent),transparent)]" />
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-500/15 text-xl"><AppIcon name="target" className="size-5 text-emerald-500" /></div>
                  <CardTitle>Smart Job Matching</CardTitle>
                  <CardDescription>AI scans 50+ portals daily and ranks every job by how well it fits your skills, role, and location preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                      94% Accuracy
                    </Badge>
                    <Badge variant="secondary" className="border-primary/20 bg-primary/10 text-primary">
                      Free Tier
                    </Badge>
                  </div>
                  {PREVIEW_JOBS.map((j) => (
                    <div key={j.title} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5">
                      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg text-lg', j.bg)}><AppIcon name={j.logo} className="size-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">{j.title}</div>
                        <div className="text-xs text-muted-foreground">{j.co}</div>
                      </div>
                      <Badge variant="secondary" className={cn('shrink-0 font-extrabold', j.scoreCls)}>
                        {j.score}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }}>
              <Card className="relative h-full overflow-hidden">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-amber-500/15 text-xl"><AppIcon name="robot" className="size-5 text-amber-500" /></div>
                  <CardTitle>AI Career Coach</CardTitle>
                  <CardDescription>A senior mentor available 24/7. Resume tips, interview prep, salary negotiation — expert-level answers instantly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="border-amber-500/20 bg-amber-500/10 text-amber-500">
                      Gemini Powered
                    </Badge>
                    <Badge variant="secondary" className="border-violet-500/20 bg-violet-500/10 text-violet-500">
                      STAR Method
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary/15"><AppIcon name="robot" className="size-4 text-primary" /></span>
                      <div>
                        <div className="text-sm font-bold">Glowminds Coach</div>
                        <div className="text-xs text-emerald-500">Online</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="ml-auto max-w-[85%] rounded-lg bg-primary/15 px-3 py-2 text-right">
                        How do I answer &quot;Tell me about yourself&quot;?
                      </div>
                      <div className="max-w-[90%] rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground">
                        Use a <strong className="text-foreground">Present-Past-Future</strong> formula: start with your current role/studies, highlight relevant achievements, then connect to why this role excites you...
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-pink-500/15 text-xl"><AppIcon name="chart" className="size-5 text-pink-500" /></div>
                  <CardTitle>Kanban Application Tracker</CardTitle>
                  <CardDescription>
                    Manage your entire job hunt visually. A drag-and-drop board organises every application into stages — see your full pipeline at a glance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CheckList items={['Drag & Drop Board', 'Status Tracking', 'Notes & Deadlines', 'Visual Pipeline', 'Export History', 'Auto-Sync']} />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { l: 'Applied', v: '12', c: 'text-primary' },
                      { l: 'Review', v: '8', c: 'text-amber-500' },
                      { l: 'Interview', v: '5', c: 'text-violet-500' },
                      { l: 'Offered', v: '3', c: 'text-emerald-500' },
                    ].map((k) => (
                      <div key={k.l} className="rounded-xl border border-border bg-muted/40 p-4 text-center">
                        <div className="text-xs font-semibold text-muted-foreground">{k.l}</div>
                        <div className={cn('text-2xl font-black', k.c)}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }} className="lg:col-span-2">
              <Card className="relative overflow-hidden">
                <CardContent className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
                  <div>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-violet-500/15 text-xl"><AppIcon name="microphone" className="size-5 text-violet-500" /></div>
                    <h3 className="mb-2 text-xl font-bold">AI Mock Interviews</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Practice with an AI interviewer that adapts to your target role. Get scored on content, structure, and delivery — with actionable feedback after every answer.
                    </p>
                    <CheckList items={['Technical Questions', 'Behavioral (STAR)', 'HR & Culture Fit', 'Real-time Scoring', 'Detailed Feedback', 'Sample Answers']} />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="border-violet-500/20 bg-violet-500/10 text-violet-500">
                        AI Evaluator
                      </Badge>
                      <Badge variant="secondary" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                        12 Roles
                      </Badge>
                      <Badge variant="secondary" className="border-primary/20 bg-primary/10 text-primary">
                        Pro Feature
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="border-violet-500/20 bg-violet-500/10 text-violet-500">
                          Technical
                        </Badge>
                        <Badge variant="secondary" className="border-amber-500/20 bg-amber-500/10 text-amber-500">
                          Medium
                        </Badge>
                        <span className="ml-auto text-xs text-muted-foreground">Q3 of 5</span>
                      </div>
                      <p className="text-sm font-medium">
                        &quot;Explain the difference between useEffect and useLayoutEffect in React. When would you use each?&quot;
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Overall', score: '8.7', c: 'text-emerald-500' },
                        { label: 'Content', score: '9.1', c: 'text-primary' },
                        { label: 'Structure', score: '8.2', c: 'text-amber-500' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-border bg-card p-3">
                          <div className={cn('text-xl font-black', s.c)}>{s.score}</div>
                          <div className="text-xs text-muted-foreground">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      {[
                        { label: 'Role', val: 'React Dev', c: 'text-primary' },
                        { label: 'Questions', val: '5', c: 'text-violet-500' },
                        { label: 'Avg Score', val: '8.7/10', c: 'text-emerald-500' },
                        { label: 'Duration', val: '18 min', c: 'text-amber-500' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border border-border bg-muted/30 p-2 text-center">
                          <div className="text-[10px] text-muted-foreground">{s.label}</div>
                          <strong className={cn('text-sm', s.c)}>{s.val}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <SectionHead
            badge="Full Toolkit"
            badgeClass="border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            title="And"
            highlight="So Much More"
            description="Beyond the core, Glowminds packs a full toolkit designed to give you an unfair advantage."
          />
          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MORE_FEATURES.map((f) => (
              <motion.div key={f.title} variants={fadeUp} transition={{ duration: 0.45, ease: motionEase }}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className={cn('mb-3 flex size-10 items-center justify-center rounded-lg text-xl', f.bg)}><AppIcon name={f.ico} className="size-5 text-primary" /></div>
                    <CardTitle className="mb-2 text-base">{f.title}</CardTitle>
                    <CardDescription>{f.desc}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <SectionHead
            badge="How It Works"
            badgeClass="border-amber-500/20 bg-amber-500/10 text-amber-500"
            title="From Zero to"
            highlight="Offer Letter"
            description="Four simple steps. No experience needed."
          />
          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {STEPS.map((s) => (
              <motion.div key={s.n} variants={fadeUp} transition={{ duration: 0.5, ease: motionEase }}>
                <Card className="h-full text-center">
                  <CardContent className="pt-6">
                    <div className={cn('mb-2 font-mono text-3xl font-black', s.color)}>{s.n}</div>
                    <CardTitle className="mb-2 text-base">{s.t}</CardTitle>
                    <CardDescription>{s.d}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
                <h2 className="mb-3 text-2xl font-black text-foreground md:text-3xl">Ready to Experience the Difference?</h2>
                <p className="mx-auto mb-6 max-w-md text-muted-foreground">Start free, go Pro for just ₹49/mo. No credit card required.</p>
                <div className="mb-3 flex flex-wrap justify-center gap-3">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Button onClick={() => navigate('/signup')}>Get Started Free</Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="outline" onClick={() => navigate('/pricing')}>
                      View Pricing
                    </Button>
                  </motion.div>
                </div>
                <p className="text-xs text-muted-foreground">Cancel anytime · Free forever tier available</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
