import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import BrandLogo, { GlowmindsWordmark } from '@/components/BrandLogo'
import AppIcon from '@/components/icons/AppIcon'
import useTheme from '@/hooks/useTheme'
import useIsLg from '@/hooks/useIsLg'
import { PUBLIC_NAV_LINKS } from '@/constants/publicNav'
import { AppAuthLink, ChromeHomeLink } from '@/components/HostLinks'
import { appHref, isSingleOriginHost } from '@/config/hosts'
import useAppStore from '@/store/authStore'
import {
  Button,
  Sheet,
  SheetContent,
  SheetTitle,
  cn,
} from '@/components/ui'

const navLinkClass = ({ isActive }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
  )

/** 44px rows inside the 20px drawer gutter. */
const mobileNavLinkClass = ({ isActive }) =>
  cn(
    'flex min-h-11 items-center rounded-[var(--radius-panel)] border px-3 text-sm font-semibold transition-colors',
    isActive
      ? 'border-border bg-primary/10 text-primary'
      : 'border-border bg-card text-foreground hover:border-foreground/55',
  )

export default function PublicHeader() {
  const navigate = useNavigate()
  const loggedIn = useAppStore((s) => s.loggedIn)
  const { theme, toggleTheme } = useTheme()
  const isLg = useIsLg()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isLg) setOpen(false)
  }, [isLg])

  const closeAndGoApp = (path) => {
    setOpen(false)
    if (isSingleOriginHost()) navigate(path)
    else window.location.assign(appHref(path))
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
        <ChromeHomeLink className="flex min-w-0 shrink-0 items-center gap-2" aria-label="Glowminds home">
          <BrandLogo size={32} alt="" aria-hidden className="rounded-lg" />
          {isLg ? <GlowmindsWordmark className="text-sm text-foreground" /> : null}
        </ChromeHomeLink>

        {isLg && !loggedIn ? (
          <nav className="flex flex-1 items-center justify-center gap-1" aria-label="Main">
            {PUBLIC_NAV_LINKS.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}

        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} className="size-4" />
          </Button>

          {loggedIn ? (
            <Button type="button" size="sm" nativeButton={false} render={<Link to="/dashboard" />}>
              Dashboard
            </Button>
          ) : isLg ? (
            <>
              <Button type="button" variant="ghost" size="sm" nativeButton={false} render={<AppAuthLink to="/login" />}>
                Log in
              </Button>
              <Button type="button" size="sm" nativeButton={false} render={<AppAuthLink to="/signup" />}>
                Get started
              </Button>
            </>
          ) : (
            <Sheet open={open} onOpenChange={setOpen}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Open menu"
                onClick={() => setOpen(true)}
              >
                <AppIcon name="menu" className="size-4" />
              </Button>
              <SheetContent
                side="right"
                showCloseButton={false}
                className="w-[min(20rem,100%)] gap-0 border-s border-border bg-card p-0 shadow-none"
              >
                <div className="flex h-full min-h-0 flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <div className="flex items-center gap-3 border-b border-border px-5 py-3">
                    <ChromeHomeLink
                      className="flex min-h-11 min-w-0 flex-1 items-center gap-3"
                      aria-label="Glowminds home"
                      onClick={() => setOpen(false)}
                    >
                      <BrandLogo size={32} alt="" aria-hidden className="rounded-lg" />
                      <GlowmindsWordmark className="text-sm leading-none text-foreground" />
                    </ChromeHomeLink>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0"
                      aria-label="Close menu"
                      onClick={() => setOpen(false)}
                    >
                      <AppIcon name="x" className="size-4" />
                    </Button>
                  </div>
                  <nav className="flex flex-col gap-2 overflow-y-auto px-5 py-4" aria-label="Mobile">
                    {PUBLIC_NAV_LINKS.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={mobileNavLinkClass}
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>
                  <div className="mt-auto flex flex-col gap-2 border-t border-border px-5 py-4">
                    {loggedIn ? (
                      <Button className="h-11 w-full" nativeButton={false} render={<Link to="/dashboard" onClick={() => setOpen(false)} />}>
                        Dashboard
                      </Button>
                    ) : (
                      <>
                        <Button className="h-11 w-full" variant="outline" onClick={() => closeAndGoApp('/login')}>Log in</Button>
                        <Button className="h-11 w-full" onClick={() => closeAndGoApp('/signup')}>Get started free</Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}
