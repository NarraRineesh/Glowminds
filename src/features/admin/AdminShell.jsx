import { NavLink, Outlet, Link } from 'react-router-dom'
import { BrandLogo, GlowmindsWordmark } from '@/components/BrandLogo'
import useAppStore from '@/store/authStore'
import { cn } from '@/components/ui'

const NAV = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/jobs', label: 'Jobs' },
  { to: '/admin/usage/tokens', label: 'Tokens' },
  { to: '/admin/usage/credits', label: 'Credits' },
  { to: '/admin/messages', label: 'Inbox' },
  { to: '/admin/pricing', label: 'Pricing' },
  { to: '/admin/feature-comparison', label: 'Compare' },
  { to: '/admin/pricing-faqs', label: 'FAQs' },
]

export default function AdminShell() {
  const user = useAppStore((s) => s.user)

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/admin" className="flex min-w-0 items-center gap-2 no-underline">
            <BrandLogo size={28} alt="" />
            <GlowmindsWordmark className="hidden sm:inline text-foreground" />
          </Link>
          <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
            Admin
          </span>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden max-w-[220px] truncate text-muted-foreground md:inline">{user?.email}</span>
            <Link
              to="/dashboard"
              className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium no-underline hover:bg-muted"
            >
              App
            </Link>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium no-underline transition-colors',
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </div>
    </div>
  )
}
