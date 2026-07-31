import { Link, useLocation } from 'react-router-dom'
import NotificationsBell from '@/components/layout/NotificationsBell'
import AppIcon from '@/components/icons/AppIcon'
import { SidebarTrigger, cn } from '@/components/ui'
import useEntitlements from '@/hooks/useEntitlements'

/** Titles/subtitles aligned with Design Lab META (static defaults — no fake counts). */
const TITLE_MAP = [
  { match: /^\/dashboard\/jobs\/.+/, title: 'Job details', subtitle: 'Fit, requirements, and apply kit' },
  { match: /^\/dashboard\/jobs/, title: 'Jobs', subtitle: 'Discover and save matching roles' },
  { match: /^\/dashboard\/applications/, title: 'Applications', subtitle: 'Track your pipeline' },
  { match: /^\/dashboard\/salary/, title: 'Salary', subtitle: 'Bands and market context' },
  { match: /^\/dashboard\/linkedin/, title: 'LinkedIn', subtitle: 'Install Assist, import, audit, then AI rewrites' },
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

/** Full-bleed pinned top chrome — padding lives here so the bar spans the inset width. */
export default function DashboardTopbar() {
  const { pathname } = useLocation()
  const { title, subtitle } = workspaceMeta(pathname)
  const { credits } = useEntitlements()
  const balance = credits?.balance

  return (
    <header
      className={cn(
        'relative z-30 w-full shrink-0',
        'border-b border-border/80',
        'bg-background/80 backdrop-blur-xl',
        'shadow-[0_8px_24px_-16px_color-mix(in_srgb,var(--foreground)_22%,transparent)]',
        'pt-[max(0.35rem,env(safe-area-inset-top))]',
      )}
    >
      {/* Soft primary wash + bottom hairline sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--primary)_35%,transparent)_20%,color-mix(in_srgb,var(--ai)_30%,transparent)_80%,transparent)]"
      />

      <div className="relative flex w-full items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5 lg:pr-9 lg:pl-7">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <SidebarTrigger className="size-9 shrink-0 md:hidden" />
          <div className="min-w-0">
            <h1 className="m-0 truncate text-base font-semibold leading-none tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 mb-0 hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {typeof balance === 'number' ? (
          <Link
            to="/dashboard/settings"
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-border/80 bg-muted/50 px-2.5 text-xs font-medium text-foreground no-underline shadow-sm backdrop-blur-sm hover:bg-muted"
            title="AI credits"
          >
            <AppIcon name="ai" className="size-3.5 text-ai" />
            <span className="tabular-nums">{balance}</span>
            <span className="hidden text-muted-foreground sm:inline">credits</span>
          </Link>
        ) : null}
        <NotificationsBell />
      </div>
    </header>
  )
}
