import AppIcon from '@/components/icons/AppIcon'
import { Badge, cn, Progress } from '@/components/ui'

function MockupShell({ children, className }) {
  return <div className={cn('bg-muted/30 p-4 md:p-5', className)}>{children}</div>
}

function SkeletonLine({ className }) {
  return <div className={cn('h-2 rounded-full bg-muted-foreground/15', className)} />
}

export function getLandingPreviewKey(src) {
  if (!src) return 'dashboard'
  const match = String(src).match(/\/([^/]+)\.svg$/)
  return match?.[1] || 'dashboard'
}

function DashboardPreview() {
  return (
    <MockupShell className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Templates', value: '15', tone: 'text-emerald-500' },
          { label: 'Applications', value: '12', tone: 'text-primary' },
          { label: 'Interviews', value: '3', tone: 'text-violet-500' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-2.5">
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            <p className={cn('text-lg font-bold', stat.tone)}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold">Profile strength</p>
          <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-500">
            Strong
          </Badge>
        </div>
        <Progress value={82} className="h-1.5" />
      </div>
      <div className="flex items-end gap-1.5 rounded-lg border border-border bg-card p-3 pt-4">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/20"
            style={{ height: `${h * 0.4}px` }}
          />
        ))}
      </div>
    </MockupShell>
  )
}

function ResumeBuilderPreview() {
  return (
    <MockupShell>
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-2 space-y-2 rounded-lg border border-border bg-card p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Templates</p>
          {['Modern', 'Classic', 'Minimal'].map((name, i) => (
            <div
              key={name}
              className={cn(
                'rounded-md border px-2 py-1.5 text-[11px]',
                i === 0 ? 'border-primary/40 bg-primary/10 font-semibold text-primary' : 'border-border text-muted-foreground',
              )}
            >
              {name}
            </div>
          ))}
          <div className="mt-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5 text-center text-[10px] font-semibold text-emerald-500">
            ATS Score: 96
          </div>
        </div>
        <div className="col-span-3 space-y-2 rounded-lg border border-border bg-card p-3">
          <SkeletonLine className="mx-auto w-1/2 h-2.5 bg-primary/25" />
          <SkeletonLine className="mx-auto w-2/3" />
          <div className="my-2 border-t border-border" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-11/12" />
          <SkeletonLine className="w-4/5" />
          <div className="my-2 border-t border-border" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-10/12" />
        </div>
      </div>
    </MockupShell>
  )
}

/** Three-panel builder layout for landing hero (rxresu.me style) */
function ResumeBuilderHeroPreview() {
  return (
    <MockupShell className="p-3 md:p-4">
      <div className="grid grid-cols-12 gap-2 md:gap-3">
        <div className="col-span-3 space-y-2 rounded-lg border border-border bg-card p-2 md:p-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground md:text-[10px]">Basics</p>
          {['Headline', 'Email', 'Phone', 'Location'].map((label) => (
            <div key={label} className="space-y-1">
              <p className="text-[9px] text-muted-foreground">{label}</p>
              <SkeletonLine className="h-2 w-full" />
            </div>
          ))}
          <div className="mt-2 space-y-1 border-t border-border pt-2">
            <p className="text-[9px] font-semibold text-muted-foreground">Summary</p>
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-4/5" />
          </div>
        </div>
        <div className="col-span-6 overflow-hidden rounded-lg border border-border bg-card">
          <div className="bg-primary/90 px-3 py-4 text-primary-foreground md:px-4 md:py-5">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary-foreground/20 md:size-10" />
              <div className="space-y-1">
                <SkeletonLine className="h-2 w-20 bg-primary-foreground/40" />
                <SkeletonLine className="h-1.5 w-28 bg-primary-foreground/25" />
              </div>
            </div>
          </div>
          <div className="space-y-2 p-3 md:p-4">
            <p className="text-[9px] font-bold uppercase tracking-wide text-primary md:text-[10px]">Experience</p>
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-11/12" />
            <SkeletonLine className="w-4/5" />
            <div className="my-1 border-t border-border" />
            <p className="text-[9px] font-bold uppercase tracking-wide text-primary md:text-[10px]">Education</p>
            <SkeletonLine className="w-3/4" />
            <SkeletonLine className="w-1/2" />
          </div>
        </div>
        <div className="col-span-3 space-y-2 rounded-lg border border-border bg-card p-2 md:p-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground md:text-[10px]">Design</p>
          <p className="text-[9px] text-muted-foreground">Typography</p>
          <SkeletonLine className="h-2 w-full" />
          <div className="grid grid-cols-4 gap-1 pt-1">
            {['bg-primary', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'].map((tone) => (
              <div key={tone} className={cn('aspect-square rounded-sm', tone)} />
            ))}
          </div>
          <p className="pt-1 text-[9px] text-muted-foreground">Layout</p>
          <SkeletonLine className="h-2 w-full" />
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-1 text-center text-[9px] font-semibold text-emerald-500 md:text-[10px]">
            ATS 96
          </div>
        </div>
      </div>
    </MockupShell>
  )
}

function JobMatchingPreview() {
  const jobs = [
    { icon: 'search', tone: 'bg-blue-500/10 text-blue-500', title: 'SDE Intern', co: 'Google', score: '96%' },
    { icon: 'food', tone: 'bg-emerald-500/10 text-emerald-500', title: 'Frontend Dev', co: 'Swiggy', score: '91%' },
    { icon: 'credit-card', tone: 'bg-violet-500/10 text-violet-500', title: 'Full Stack', co: 'Razorpay', score: '85%' },
  ]
  return (
    <MockupShell className="space-y-2">
      <div className="mb-1 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <AppIcon name="search" className="size-3.5 text-muted-foreground" />
        <SkeletonLine className="h-2 flex-1" />
        <Badge variant="secondary" className="text-[10px]">Filter</Badge>
      </div>
      {jobs.map((job) => (
        <div key={job.title} className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5">
          <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', job.tone)}>
            <AppIcon name={job.icon} className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{job.title}</p>
            <p className="text-[10px] text-muted-foreground">{job.co}</p>
          </div>
          <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-500">
            {job.score}
          </Badge>
        </div>
      ))}
    </MockupShell>
  )
}

function AiCoachPreview() {
  return (
    <MockupShell className="space-y-3">
      <div className="flex gap-2">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <AppIcon name="robot" className="size-3 text-primary" />
        </div>
        <div className="rounded-lg rounded-tl-none border border-border bg-card px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          How should I answer &ldquo;Tell me about yourself&rdquo; for a frontend role?
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%] rounded-lg rounded-tr-none border border-primary/20 bg-primary/10 px-3 py-2 text-[11px] leading-relaxed">
          Start with your current focus, highlight 2 relevant projects, then connect to the role.
        </div>
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
          You
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <AppIcon name="robot" className="size-3 text-primary" />
        </div>
        <div className="rounded-lg rounded-tl-none border border-border bg-card px-3 py-2">
          <SkeletonLine className="mb-1.5 w-32" />
          <SkeletonLine className="w-24" />
        </div>
      </div>
    </MockupShell>
  )
}

function InterviewPrepPreview() {
  return (
    <MockupShell className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <Badge variant="outline" className="mb-2 border-violet-500/20 bg-violet-500/10 text-[10px] text-violet-500">
          Behavioral
        </Badge>
        <p className="text-xs font-semibold">Describe a time you solved a difficult bug under pressure.</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Your answer</p>
        <SkeletonLine className="mb-1.5 w-full" />
        <SkeletonLine className="mb-1.5 w-11/12" />
        <SkeletonLine className="w-4/5" />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
        <span className="text-xs font-semibold text-emerald-500">STAR Score</span>
        <span className="text-lg font-bold text-emerald-500">8.5/10</span>
      </div>
    </MockupShell>
  )
}

function AppTrackerPreview() {
  const columns = [
    { title: 'Applied', count: 4, tone: 'border-primary/30' },
    { title: 'Interview', count: 2, tone: 'border-amber-500/30' },
    { title: 'Offer', count: 1, tone: 'border-emerald-500/30' },
  ]
  return (
    <MockupShell>
      <div className="grid grid-cols-3 gap-2">
        {columns.map((col) => (
          <div key={col.title} className={cn('rounded-lg border bg-card p-2', col.tone)}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold">{col.title}</p>
              <Badge variant="secondary" className="h-4 px-1 text-[9px]">{col.count}</Badge>
            </div>
            {Array.from({ length: col.count > 2 ? 2 : col.count }).map((_, i) => (
              <div key={i} className="mb-1.5 rounded border border-border bg-muted/40 px-2 py-1.5 last:mb-0">
                <SkeletonLine className="mb-1 w-3/4 h-1.5" />
                <SkeletonLine className="w-1/2 h-1.5" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </MockupShell>
  )
}

function CoverLetterPreview() {
  return (
    <MockupShell>
      <div className="rounded-lg border border-border bg-card p-4">
        <SkeletonLine className="mx-auto mb-3 w-1/3 h-2.5" />
        <SkeletonLine className="mb-2 w-full" />
        <SkeletonLine className="mb-2 w-full" />
        <p className="mb-2 text-[11px] leading-relaxed">
          I am excited to apply for the{' '}
          <span className="rounded bg-primary/15 px-0.5 font-medium text-primary">Frontend Developer</span>{' '}
          role. My experience with React and TypeScript aligns with your requirements.
        </p>
        <SkeletonLine className="mb-2 w-11/12" />
        <SkeletonLine className="w-4/5" />
        <div className="mt-3 flex justify-end">
          <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/10 text-[10px] text-cyan-500">
            AI Generated
          </Badge>
        </div>
      </div>
    </MockupShell>
  )
}

function GrammarCheckerPreview() {
  return (
    <MockupShell className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[11px] leading-relaxed">
          Led a team of 5 developers to{' '}
          <span className="border-b-2 border-destructive/60 text-destructive">deliverd</span>{' '}
          a product that{' '}
          <span className="border-b-2 border-amber-500/60 text-amber-500">increased user engagement</span>{' '}
          by 40%.
        </p>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-[10px]">
          <AppIcon name="check" className="size-3 text-destructive" />
          <span>
            <span className="line-through text-muted-foreground">deliverd</span>
            {' → '}
            <span className="font-semibold text-emerald-500">delivered</span>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[10px]">
          <AppIcon name="check" className="size-3 text-amber-500" />
          <span>Suggest: &ldquo;boosted user engagement&rdquo;</span>
        </div>
      </div>
    </MockupShell>
  )
}

const PREVIEWS = {
  dashboard: DashboardPreview,
  'resume-builder': ResumeBuilderPreview,
  'resume-builder-hero': ResumeBuilderHeroPreview,
  'job-matching': JobMatchingPreview,
  'ai-coach': AiCoachPreview,
  'interview-prep': InterviewPrepPreview,
  'app-tracker': AppTrackerPreview,
  'cover-letter': CoverLetterPreview,
  'grammar-checker': GrammarCheckerPreview,
}

export function LandingMockupPreview({ preview, src, className }) {
  const key = preview || getLandingPreviewKey(src)
  const Preview = PREVIEWS[key] || DashboardPreview
  return (
    <div className={cn('w-full', className)} aria-hidden>
      <Preview />
    </div>
  )
}

export function LandingMockupCard({ preview, src, className }) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
      <div className="flex gap-1.5 border-b border-border px-3 py-2">
        <span className="size-2 rounded-full bg-destructive/80" />
        <span className="size-2 rounded-full bg-amber-500/80" />
        <span className="size-2 rounded-full bg-emerald-500/80" />
      </div>
      <LandingMockupPreview preview={preview} src={src} />
    </div>
  )
}
