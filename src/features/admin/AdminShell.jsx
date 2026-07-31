import { NavLink, Outlet, Link } from 'react-router-dom'
import { BrandLogo } from '@/components/BrandLogo'
import useAppStore from '@/store/authStore'

const NAV = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/jobs', label: 'Jobs' },
  { to: '/admin/usage/tokens', label: 'Tokens' },
  { to: '/admin/usage/credits', label: 'Credits' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/pricing', label: 'Pricing' },
  { to: '/admin/feature-comparison', label: 'Feature Comparison' },
  { to: '/admin/pricing-faqs', label: 'Pricing FAQs' },
]

export default function AdminShell() {
  const user = useAppStore((s) => s.user)

  return (
    <div className="min-h-svh bg-[var(--color-bg,#f6f4f1)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/admin" className="shrink-0">
            <BrandLogo size={28} />
          </Link>
          <span className="rounded bg-foreground/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
            Admin
          </span>
          <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline truncate max-w-[200px]">{user?.email}</span>
            <Link to="/dashboard" className="underline-offset-2 hover:underline">
              App
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </div>
    </div>
  )
}
