import { useLocation, useNavigate } from 'react-router-dom'
import NotificationsBell from '@/components/layout/NotificationsBell'
import AppIcon from '@/components/icons/AppIcon'
import { Input } from '@/components/ui'

/** Titles/subtitles aligned with Design Lab META (static defaults — no fake counts). */
const TITLE_MAP = [
  { match: /^\/dashboard\/jobs\/.+/, title: 'Job details', subtitle: 'Fit, requirements, and apply kit' },
  { match: /^\/dashboard\/jobs/, title: 'Jobs', subtitle: 'Discover and save matching roles' },
  { match: /^\/dashboard\/applications/, title: 'Applications', subtitle: 'Track your pipeline' },
  { match: /^\/dashboard\/salary/, title: 'Salary', subtitle: 'Bands and market context' },
  { match: /^\/dashboard\/linkedin/, title: 'LinkedIn', subtitle: 'Install Assist, import, audit, then AI rewrites' },
  { match: /^\/dashboard\/profile\/public/, title: 'Public profile', subtitle: 'What others see on your portfolio page' },
  { match: /^\/dashboard\/profile/, title: 'Profile', subtitle: 'Career identity and preferences' },
  { match: /^\/dashboard\/vault/, title: 'Vault', subtitle: 'Resumes, offers, and documents' },
  { match: /^\/dashboard\/skills/, title: 'Skills', subtitle: 'Gap analysis for your preferred role' },
  { match: /^\/dashboard\/learning/, title: 'Learning', subtitle: 'Paths and daily progress' },
  { match: /^\/dashboard\/interview/, title: 'Interview prep', subtitle: 'Mocks and company prep' },
  { match: /^\/dashboard\/ai/, title: 'Copilot', subtitle: 'Career guidance with context' },
  { match: /^\/dashboard\/analytics/, title: 'Analytics', subtitle: 'Last 30 days' },
  { match: /^\/dashboard\/cover-letters/, title: 'Cover letter', subtitle: 'Tailored letters for roles' },
  { match: /^\/dashboard\/grammar-check/, title: 'Grammar', subtitle: 'Polish writing before you send' },
  { match: /^\/dashboard\/paraphrase/, title: 'Rewrite', subtitle: 'Tone-controlled rewrites for About, bullets, and letters' },
  { match: /^\/dashboard\/timeline/, title: 'Timeline', subtitle: 'Activity across your career OS' },
  { match: /^\/dashboard\/notifications/, title: 'Notifications', subtitle: 'Inbox and priorities' },
  { match: /^\/dashboard\/settings/, title: 'Settings', subtitle: 'Account, appearance, and gamification' },
  { match: /^\/dashboard\/resume/, title: 'Resume', subtitle: 'Create and edit resumes — synced to your account' },
  { match: /^\/dashboard$/, title: 'Dashboard', subtitle: null },
]

function workspaceMeta(pathname) {
  for (const row of TITLE_MAP) {
    if (row.match.test(pathname)) return { title: row.title, subtitle: row.subtitle || null }
  }
  return { title: 'Dashboard', subtitle: null }
}

/** Persistent top chrome — only title/subtitle change on navigation. Brand + avatar live in the sidebar. */
export default function DashboardTopbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { title, subtitle } = workspaceMeta(pathname)

  return (
    <header className="sticky top-0 z-30 mb-4 flex flex-wrap items-center gap-3 border-b border-border bg-background/90 pb-3 pt-1 backdrop-blur md:pt-0">
      <div className="min-w-0 flex-1 pl-10 md:pl-0">
        <h1 className="m-0 truncate text-base font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 mb-0 truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <form
        className="relative hidden min-w-[200px] flex-1 max-w-md sm:block"
        onSubmit={(e) => {
          e.preventDefault()
          const q = new FormData(e.currentTarget).get('q')
          if (q) navigate(`/dashboard/jobs?q=${encodeURIComponent(String(q))}`)
        }}
      >
        <AppIcon name="search" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          placeholder="Search jobs, apps, skills…"
          className="h-9 pl-8 text-sm"
          aria-label="Search"
        />
      </form>
      <NotificationsBell />
    </header>
  )
}
