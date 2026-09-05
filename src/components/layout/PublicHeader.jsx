import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import BrandLogo, { GlowmindsWordmark } from '@/components/BrandLogo'
import AppIcon from '@/components/icons/AppIcon'
import useTheme from '@/hooks/useTheme'
import useIsLg from '@/hooks/useIsLg'
import { PUBLIC_NAV_LINKS } from '@/constants/publicNav'
import { AppAuthLink, ChromeHomeLink } from '@/components/HostLinks'
import { appHref, isLocalHost } from '@/config/hosts'
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
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

export default function PublicHeader() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const isLg = useIsLg()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isLg) setOpen(false)
  }, [isLg])

  const closeAndGoApp = (path) => {
    setOpen(false)
    if (isLocalHost()) navigate(path)
    else window.location.assign(appHref(path))
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
        <ChromeHomeLink className="flex min-w-0 shrink-0 items-center gap-2" aria-label="Glowminds home">
          <BrandLogo size={32} alt="" aria-hidden className="rounded-lg" />
          {isLg ? <GlowmindsWordmark className="text-sm text-foreground" /> : null}
        </ChromeHomeLink>

        {isLg ? (
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

          {isLg ? (
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
              <SheetContent side="right" className="w-[min(100vw-2rem,320px)] gap-0 px-4 py-4">
                <SheetHeader className="p-0 pr-10">
                  <SheetTitle className="flex items-center gap-2 overflow-visible leading-none">
                    <ChromeHomeLink
                      className="flex min-w-0 items-center gap-2"
                      aria-label="Glowminds home"
                      onClick={() => setOpen(false)}
                    >
                      <BrandLogo
                        size={32}
                        alt=""
                        aria-hidden
                        className="rounded-md object-contain p-0.5"
                      />
                      <GlowmindsWordmark className="text-sm text-foreground" />
                    </ChromeHomeLink>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
                  {PUBLIC_NAV_LINKS.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      className={navLinkClass}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
                  <Button className="w-full" variant="outline" onClick={() => closeAndGoApp('/login')}>Log in</Button>
                  <Button className="w-full" onClick={() => closeAndGoApp('/signup')}>Get started free</Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}
