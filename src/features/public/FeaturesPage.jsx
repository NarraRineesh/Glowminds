import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEO from '@/components/SEO'
import {
  PAGE_SEO,
  breadcrumbSchema,
  itemListSchema,
  normalizeStructuredData,
  organizationSchema,
  webPageSchema,
} from '@/config/seo'
import { fadeUp, motionEase, staggerFast } from '@/features/public/motionVariants'
import {
  COMPARISON_HEADER_CLASS,
  COMPARISON_ROW_CLASS,
  ComparisonTableShell,
} from '@/features/public/components/publicPageUi'
import {
  AppIcon,
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

const CAPABILITY_PILLS = [
  { icon: 'target', label: 'Updated Job Database Daily' },
  { icon: 'sparkle', label: 'AI-Powered Matching' },
  { icon: 'resume', label: 'ATS Resume Optimization' },
  { icon: 'microphone', label: 'Mock Interview Practice' },
]

const MATCH_PREVIEW_JOBS = [
  { title: 'Frontend Developer', score: '95%', scoreCls: 'bg-emerald-500/15 text-emerald-500' },
  { title: 'React Developer', score: '91%', scoreCls: 'bg-emerald-500/15 text-emerald-500' },
  { title: 'Software Engineer', score: '88%', scoreCls: 'bg-primary/15 text-primary' },
]

const COACH_EXAMPLES = [
  'How do I answer "Tell me about yourself"?',
  'What projects should I add to my resume?',
  'How do I negotiate salary?',
]

const PIPELINE_STAGES = ['Applied', 'Review', 'Interview', 'Offer']

const FEATURE_CATEGORIES = [
  {
    title: 'Job Search',
    items: ['Smart Matching', 'Job Alerts', 'Salary Insights'],
  },
  {
    title: 'Applications',
    items: ['One Click Apply', 'Multi Portal Sync', 'Application Tracking'],
  },
  {
    title: 'Career Growth',
    items: ['Skill Gap Analysis', 'AI Upskilling Paths', 'Cover Letter AI'],
  },
]

const COMPARISON_ROWS = [
  'Resume website',
  'LinkedIn',
  'Job board',
  'Notes spreadsheet',
  'Interview prep site',
  'One platform',
]

const SOCIAL_PROOF = [
  {
    label: 'ATS Score Improved',
    before: '42',
    after: '89',
    icon: 'resume',
    color: 'text-emerald-500',
  },
  {
    label: 'Interview Calls',
    before: '0',
    after: '5 in 3 weeks',
    icon: 'microphone',
    color: 'text-violet-500',
  },
]

const STEPS = [
  { n: '01', t: 'Pick a template', d: 'Choose an ATS-friendly resume layout that fits your role.', color: 'text-primary' },
  { n: '02', t: 'Enter or sync details', d: 'Fill sections or sync from your Glowminds profile in one click.', color: 'text-emerald-500' },
  { n: '03', t: 'GLOWMINDS AI analysis', d: 'Grammar, errors, content quality, and stronger bullet descriptions.', color: 'text-amber-500' },
  { n: '04', t: 'Apply & interview', d: 'Match jobs, practice interviews, and track offers in the same OS.', color: 'text-violet-500' },
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
        {title}{' '}
        <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">{highlight}</span>
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

function AtsScoreHeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: motionEase, delay: 0.35 }}
      className="mx-auto mt-8 max-w-md"
    >
      <p className="mb-4 text-sm font-semibold text-foreground">See Your Resume Score Improve</p>
      <Card className="border-primary/20 bg-card/80 text-left shadow-lg backdrop-blur-sm">
        <CardContent className="space-y-4 p-5">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Current ATS Score</span>
              <span className="font-bold text-orange-500">42</span>
            </div>
            <Progress value={42} className="h-2 bg-muted [&>div]:bg-orange-500" />
          </div>
          <div className="flex flex-col items-center gap-1 py-1 text-xs font-medium text-primary">
            <AppIcon name="caret-down" className="size-4" />
            <span>Glowminds Optimization</span>
            <AppIcon name="caret-down" className="size-4" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Optimized ATS Score</span>
              <span className="font-bold text-emerald-500">91</span>
            </div>
            <Progress value={91} className="h-2 bg-muted [&>div]:bg-emerald-500" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PipelineVisualization() {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
        {PIPELINE_STAGES.map((stage, index) => (
          <div key={stage} className="flex items-center gap-2">
            <span className="rounded-lg border border-border bg-card px-3 py-2 text-foreground">{stage}</span>
            {index < PIPELINE_STAGES.length - 1 ? (
              <span className="text-muted-foreground" aria-hidden>→</span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'Applied', v: '12', c: 'text-primary' },
          { l: 'Review', v: '8', c: 'text-amber-500' },
          { l: 'Interview', v: '5', c: 'text-violet-500' },
          { l: 'Offered', v: '3', c: 'text-emerald-500' },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-card p-3 text-center">
            <div className="text-xs font-semibold text-muted-foreground">{k.l}</div>
            <div className={cn('text-xl font-black', k.c)}>{k.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const FEATURE_SEO_NAMES = [
  'ATS Resume Builder',
  'Smart Job Matching',
  'Skill Gap Analysis & Upskilling',
  'AI Mock Interviews',
  'Application Tracker',
  'AI Cover Letters',
  'GLOWMINDS AI',
  'Grammar Checker',
  'LinkedIn Optimizer',
  'Salary Insights',
]

export default function FeaturesPage() {
  return (
    <div>
      <SEO
        {...PAGE_SEO.features}
        structuredData={normalizeStructuredData([
          organizationSchema(),
          webPageSchema({
            name: PAGE_SEO.features.title,
            description: PAGE_SEO.features.description,
            path: PAGE_SEO.features.path,
          }),
          itemListSchema(FEATURE_SEO_NAMES),
          breadcrumbSchema([
            { label: 'Home', path: '/' },
            { label: 'Features', path: '/features' },
          ]),
        ])}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center md:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: motionEase }}>
            <Badge variant="secondary" className="mb-4 gap-2 border-primary/20 bg-primary/10 text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              Platform Features
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: motionEase, delay: 0.1 }}
            className="mb-4 text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl"
          >
            Everything You Need in a{' '}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Career Operating System</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: motionEase, delay: 0.2 }}
            className="mx-auto mb-6 max-w-2xl text-muted-foreground"
          >
            From resume to offer — ATS builder, jobs, GLOWMINDS AI, interviews, skills, cover letters, and tracking in one Career OS.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: motionEase, delay: 0.3 }}
            className="mb-6 flex flex-wrap justify-center gap-3"
          >
            <Button render={<Link to="/signup" />}>Get Started Free</Button>
            <Button variant="outline" render={<Link to="/pricing" />}>View Pricing</Button>
          </motion.div>

          <AtsScoreHeroVisual />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {CAPABILITY_PILLS.map((pill) => (
              <Badge
                key={pill.label}
                variant="outline"
                className="gap-1.5 border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-normal text-muted-foreground"
              >
                <AppIcon name={pill.icon} className="size-3.5 text-primary" />
                {pill.label}
              </Badge>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Journey — moved up after hero */}
      <section className="border-y border-border bg-muted/30 py-12 md:py-16">
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

      {/* Core features — priority order */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <SectionHead
            badge="Core Features"
            badgeClass="border-primary/20 bg-primary/10 text-primary"
            title="Powerful Tools,"
            highlight="One Career OS"
            description="Templates → details → GLOWMINDS AI analysis. Then jobs, interviews, and tracking."
          />

          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-6"
          >
            {/* 1. Resume Builder — largest */}
            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }}>
              <Card className="relative overflow-hidden border-primary/20 shadow-md">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent)]" />
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="mb-3 w-fit border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                    #1 — Start Here
                  </Badge>
                  <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/15">
                    <AppIcon name="resume" className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl">AI Resume Builder</CardTitle>
                  <CardDescription className="text-base">
                    Answer a few questions — pick a template, sync your profile, then GLOWMINDS AI checks grammar, quality, and descriptions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <CheckList items={['Template gallery first', 'Sync profile details', 'ATS + grammar AI', 'PDF Export', 'AI Keywords', 'Improve bullet descriptions']} />
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="border-primary/20 bg-primary/10 text-primary">Most Popular</Badge>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-semibold">ATS Score</span>
                      <span className="font-bold text-emerald-500">91/100</span>
                    </div>
                    <Progress value={91} className="mb-3 h-2" />
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

            {/* 2. Job Matching — large */}
            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }}>
              <Card className="relative overflow-hidden border-emerald-500/20 shadow-md">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,color-mix(in_oklab,var(--emerald-500)_8%,transparent),transparent)]" />
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="mb-3 w-fit border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                    #2 — Find Roles That Fit
                  </Badge>
                  <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-emerald-500/15">
                    <AppIcon name="target" className="size-6 text-emerald-500" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl">Smart Job Matching</CardTitle>
                  <CardDescription className="text-base">
                    Jobs ranked by how well they fit your skills, role, and location — so you apply where you have the best shot.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <CheckList items={['Daily refreshed job database', 'Skill-based match scores', 'Remote & location filters', 'Save and apply in one place']} />
                  <div className="space-y-3">
                    {MATCH_PREVIEW_JOBS.map((j) => (
                      <div key={j.title} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                          <AppIcon name="target" className="size-5 text-emerald-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-foreground">{j.title}</div>
                          <div className="text-xs text-muted-foreground">Match score</div>
                        </div>
                        <Badge variant="secondary" className={cn('shrink-0 text-base font-extrabold', j.scoreCls)}>
                          {j.score}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 3. Mock Interviews */}
            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }}>
              <Card className="relative overflow-hidden">
                <CardContent className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
                  <div>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-violet-500/15">
                      <AppIcon name="microphone" className="size-5 text-violet-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">AI Mock Interviews</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Practice with an AI interviewer that adapts to your target role. Get scored on content, structure, and delivery.
                    </p>
                    <CheckList items={['Technical Questions', 'Behavioral (STAR)', 'HR & Culture Fit', 'Real-time Scoring', 'Detailed Feedback']} />
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                      <p className="text-sm font-medium">
                        &quot;Explain the difference between useEffect and useLayoutEffect in React.&quot;
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Overall Score', score: '8.7', c: 'text-emerald-500' },
                        { label: 'Confidence', score: '8.4', c: 'text-primary' },
                        { label: 'Technical Score', score: '9.1', c: 'text-violet-500' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-border bg-card p-3">
                          <div className={cn('text-xl font-black', s.c)}>{s.score}</div>
                          <div className="text-xs text-muted-foreground">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 4. Application Tracker */}
            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }}>
              <Card>
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-pink-500/15">
                    <AppIcon name="chart" className="size-5 text-pink-500" />
                  </div>
                  <CardTitle>Kanban Application Tracker</CardTitle>
                  <CardDescription>
                    See every application move from applied to offer — no more lost spreadsheets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PipelineVisualization />
                  <CheckList items={['Drag & Drop Board', 'Status Tracking', 'Notes & Deadlines', 'Export History']} />
                </CardContent>
              </Card>
            </motion.div>

            {/* 5. GLOWMINDS AI */}
            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: motionEase }}>
              <Card>
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-amber-500/15">
                    <AppIcon name="robot" className="size-5 text-amber-500" />
                  </div>
                  <CardTitle>GLOWMINDS AI</CardTitle>
                  <CardDescription>
                    The Career OS advisor — resumes, interviews, salary, and skill gaps with your profile context.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {COACH_EXAMPLES.map((q) => (
                      <Badge key={q} variant="secondary" className="max-w-full whitespace-normal text-left font-normal">
                        {q}
                      </Badge>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary/15">
                        <AppIcon name="robot" className="size-4 text-primary" />
                      </span>
                      <div>
                        <div className="text-sm font-bold">GLOWMINDS AI</div>
                        <div className="text-xs text-emerald-500">Online</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="ml-auto max-w-[85%] rounded-lg bg-primary/15 px-3 py-2 text-right">
                        How do I answer &quot;Tell me about yourself&quot;?
                      </div>
                      <div className="max-w-[90%] rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground">
                        Use a <strong className="text-foreground">Present-Past-Future</strong> formula: current role, relevant wins, then why this opportunity fits you.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-y border-border bg-muted/30 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <SectionHead
            badge="Why Glowminds"
            badgeClass="border-primary/20 bg-primary/10 text-primary"
            title="Why Use"
            highlight="Glowminds?"
            description="Stop juggling five different tools for one job search."
          />
          <Card className="mx-auto max-w-3xl overflow-hidden">
            <CardContent className="p-0">
              <ComparisonTableShell>
                <div className={COMPARISON_HEADER_CLASS}>
                  <span>Tool</span>
                  <span className="text-center">Without</span>
                  <span className="text-center text-primary">With</span>
                </div>
                {COMPARISON_ROWS.map((row, index) => (
                  <div
                    key={row}
                    className={cn(
                      COMPARISON_ROW_CLASS,
                      index < COMPARISON_ROWS.length - 1 && 'border-b border-border',
                    )}
                  >
                    <span className="min-w-0 font-medium text-foreground">{row}</span>
                    <span className="flex justify-center">
                      {row === 'One platform' ? (
                        <AppIcon name="x" className="size-4 text-muted-foreground/50" />
                      ) : (
                        <AppIcon name="check" className="size-4 text-muted-foreground/60" />
                      )}
                    </span>
                    <span className="flex justify-center">
                      <AppIcon name="check" className="size-4 text-emerald-500" />
                    </span>
                  </div>
                ))}
              </ComparisonTableShell>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <SectionHead
            badge="Results"
            badgeClass="border-violet-500/20 bg-violet-500/10 text-violet-500"
            title="Real"
            highlight="Outcomes"
            description="Illustrative examples of what focused job seekers achieve with Glowminds."
          />
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {SOCIAL_PROOF.map((item) => (
              <Card key={item.label}>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <AppIcon name={item.icon} className={cn('size-6', item.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-lg font-black">
                      <span className="text-muted-foreground line-through decoration-muted-foreground/50">{item.before}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className={item.color}>{item.after}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categorized extras */}
      <section className="border-t border-border bg-muted/30 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <SectionHead
            badge="Full Toolkit"
            badgeClass="border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            title="And"
            highlight="So Much More"
            description="Everything else you need — grouped so you can scan quickly."
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURE_CATEGORIES.map((cat) => (
              <Card key={cat.title} className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{cat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {cat.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AppIcon name="check" className="size-4 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Exit CTA */}
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
                <h2 className="mb-3 text-2xl font-black text-foreground md:text-3xl">Ready to Land More Interviews?</h2>
                <p className="mx-auto mb-6 max-w-lg text-muted-foreground">
                  Build your resume, discover jobs, and practice interviews — all for free.
                </p>
                <Button size="lg" render={<Link to="/signup" />}>Start Free</Button>
                <p className="mt-3 text-xs text-muted-foreground">No credit card required · Free tier forever</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
