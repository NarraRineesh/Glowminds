import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation, Link, NavLink } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useNotifStore from '@/store/notifStore'
import useDashboardNav from '@/hooks/useDashboardNav'
import useTheme from '@/hooks/useTheme'
import useIsLg from '@/hooks/useIsLg'
import NotificationsBell from '@/components/layout/NotificationsBell'
import { PUBLIC_NAV_LINKS, DASH_NAV_LINKS } from '@/constants/navbarLinks'

const NAV_LINK_ACTIVE =
  'rounded-xl px-3.5 py-2 text-sm font-medium transition-colors bg-[var(--color-blu3)] font-semibold text-[var(--color-blu2)]'
const NAV_LINK_IDLE =
  'rounded-xl px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer text-[var(--color-txt2)] hover:bg-[var(--color-blu3)] hover:text-[var(--color-txt)]'

const THEME_BTN =
  'items-center justify-center rounded-xl border border-[var(--color-bdr)] px-2.5 py-1.5 text-base text-[var(--color-txt)] transition-colors hover:bg-[var(--color-bg3)]'

function HamburgerIcon({ open }) {
  const extras = [
    open ? 'translate-y-[6px] rotate-45' : '',
    open ? 'opacity-0' : '',
    open ? '-translate-y-[6px] -rotate-45' : '',
  ]
  return extras.map((extra, i) => (
    <span
      key={i}
      className={`block h-0.5 w-5 rounded-full bg-[var(--color-txt)] duration-300 ease-out ${
        i === 1 ? 'transition-opacity' : 'transition-all'
      } ${extra}`}
    />
  ))
}

export default function Navbar() {
  const { loggedIn, user, doLogout, addToast } = useAppStore()
  const { listen, stopListening } = useNotifStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const dashNav = useDashboardNav()
  const { theme, toggleTheme } = useTheme()
  const isLg = useIsLg()
  const [mobOpen, setMobOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [avatarPos, setAvatarPos] = useState({ top: 0, right: 16 })
  const menuRef = useRef(null)
  const mobileNavBtnRef = useRef(null)
  const avatarBtnRef = useRef(null)
  const avatarMenuRef = useRef(null)

  const isDashboard = loggedIn && pathname.startsWith('/dashboard')
  const links = loggedIn ? DASH_NAV_LINKS : PUBLIC_NAV_LINKS
  /** Desktop / non-dashboard mobile: theme + bell + avatar in bar. Dashboard mobile: sidebar only. */
  const showBarExtras = !isDashboard || isLg
  const themeBarClass = `${THEME_BTN} ${!loggedIn ? 'theme-toggle hidden md:flex' : isDashboard ? 'flex' : 'hidden md:flex'}`
  const isDark = theme === 'dark'

  useEffect(() => {
    if (user?.uid) listen(user.uid)
    return () => stopListening()
  }, [user?.uid, listen, stopListening])

  useEffect(() => {
    if (!mobOpen) return
    const onDown = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        mobileNavBtnRef.current?.contains(e.target)
      )
        return
      setMobOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [mobOpen])

  useEffect(() => {
    const id = requestAnimationFrame(() => setMobOpen(false))
    return () => cancelAnimationFrame(id)
  }, [pathname])

  // Close avatar menu on route change
  useEffect(() => { setAvatarOpen(false) }, [pathname])

  // Position the avatar menu via portal so it overlays everything
  useLayoutEffect(() => {
    if (!avatarOpen || !avatarBtnRef.current) return
    const update = () => {
      const r = avatarBtnRef.current?.getBoundingClientRect()
      if (!r) return
      setAvatarPos({
        top: Math.round(r.bottom + 10),
        right: Math.max(8, Math.round(window.innerWidth - r.right)),
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [avatarOpen])

  // Click-outside + Esc to close avatar menu
  useEffect(() => {
    if (!avatarOpen) return
    const onDown = (e) => {
      if (avatarBtnRef.current?.contains(e.target)) return
      if (avatarMenuRef.current?.contains(e.target)) return
      setAvatarOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setAvatarOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [avatarOpen])

  const handleLogout = useCallback(() => {
    doLogout()
    addToast('info', '👋 Logged out. See you soon!')
    navigate('/')
  }, [doLogout, addToast, navigate])

  const navDrawerOpen = Boolean(isDashboard && dashNav?.mobileSidebarOpen)
  const burgerOpen = navDrawerOpen || mobOpen
  const burgerHide = isDashboard && loggedIn ? 'lg:hidden' : 'md:hidden'

  const primaryNavLinks = useMemo(
    () =>
      links.map((l) => (
        <NavLink
          key={l.path}
          to={l.path}
          end={l.end}
          className={({ isActive }) => (isActive ? NAV_LINK_ACTIVE : NAV_LINK_IDLE)}
          onClick={() => setMobOpen(false)}
        >
          {l.label}
        </NavLink>
      )),
    [links],
  )

  const avatarInitial = (user?.firstName?.[0] || user?.displayName?.[0] || 'U').toUpperCase()

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-[200] flex h-16 items-center gap-3 border-b border-[var(--color-bdr)] bg-[var(--color-surf)]/90 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--color-surf)]/80 sm:gap-4 sm:px-6 lg:px-10">
        <Link
          to={loggedIn ? '/dashboard' : '/'}
          className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-[var(--color-blu)] to-[var(--color-grn)] shadow-[0_0_22px_var(--color-glow)]">
            <svg width="22" height="22" viewBox="0 0 48 48" fill="none" aria-hidden>
              <path
                d="M36 17 A 14 14 0 1 0 36 31 L 36 24 L 27 24"
                stroke="#fff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <span className="truncate text-lg font-black tracking-tight text-[var(--color-txt)]">
            Glow
            <span className="bg-gradient-to-r from-[var(--color-blu2)] to-[var(--color-grn)] bg-clip-text text-transparent">
              minds
            </span>
          </span>
        </Link>

        {!loggedIn && (
          <div className="ml-2 hidden flex-1 items-center gap-1 md:ml-6 md:flex lg:gap-1">{primaryNavLinks}</div>
        )}
        {loggedIn && <div className="hidden flex-1 lg:block" aria-hidden />}

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          {showBarExtras && (
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className={themeBarClass}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          )}

          {!loggedIn ? (
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl border border-[var(--color-bdr2)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--color-txt)] transition-colors hover:bg-[var(--color-bg3)]"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="rounded-xl bg-gradient-to-br from-[var(--color-blu)] to-[#1a5ae0] px-5 py-2 text-sm font-bold text-white shadow-[0_4px_20px_rgba(56,139,253,0.35)] transition hover:opacity-[0.96]"
              >
                Get Started
              </button>
            </div>
          ) : (
            showBarExtras && (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <NotificationsBell variant="nav" />
                <button
                  ref={avatarBtnRef}
                  type="button"
                  className="nav-av"
                  onClick={() => setAvatarOpen((p) => !p)}
                  aria-label="Open account menu"
                  aria-haspopup="true"
                  aria-expanded={avatarOpen}
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    avatarInitial
                  )}
                </button>
              </div>
            )
          )}
        </div>

        <button
          ref={mobileNavBtnRef}
          type="button"
          className={`ml-1 flex flex-col justify-center gap-1 p-1.5 ${burgerHide}`}
          aria-label={burgerOpen ? 'Close menu' : isDashboard ? 'Open dashboard menu' : 'Open menu'}
          aria-expanded={burgerOpen}
          aria-controls={isDashboard && dashNav ? 'dashboardSidebar' : undefined}
          onClick={() =>
            isDashboard && dashNav ? dashNav.toggleMobileSidebar() : setMobOpen((o) => !o)
          }
        >
          <HamburgerIcon open={burgerOpen} />
        </button>
      </nav>

      {mobOpen && !isDashboard && (
        <div
          ref={menuRef}
          className="mobile-menu fixed inset-x-0 top-16 z-[190] flex flex-col gap-1 border-b border-[var(--color-bdr)] bg-[var(--color-surf)] p-3 md:hidden"
        >
          <div className="flex flex-col gap-0.5">{primaryNavLinks}</div>
          <button
            type="button"
            className="mt-1 flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm text-[var(--color-txt2)] hover:bg-[var(--color-bg3)]"
            onClick={toggleTheme}
          >
            {isDark ? '☀️' : '🌙'} {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          {!loggedIn ? (
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn btn-o btn-w" onClick={() => { navigate('/login'); setMobOpen(false) }}>
                Log In
              </button>
              <button type="button" className="btn btn-p btn-w" onClick={() => { navigate('/signup'); setMobOpen(false) }}>
                Sign Up
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-gh btn-w mt-2"
              onClick={() => {
                handleLogout()
                setMobOpen(false)
              }}
            >
              Log Out
            </button>
          )}
        </div>
      )}

      {/* Avatar dropdown menu — portaled to body so position:fixed is true viewport-fixed */}
      {loggedIn && avatarOpen && createPortal(
        <div
          ref={avatarMenuRef}
          role="menu"
          aria-label="Account menu"
          className="overflow-hidden rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
          style={{
            position: 'fixed',
            top: avatarPos.top,
            right: avatarPos.right,
            width: 240,
            zIndex: 1000,
            animation: 'ndd-in .15s ease',
          }}
        >
          <div className="flex items-center gap-2.5 border-b border-[var(--color-bdr)] px-3.5 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--color-blu)] to-[var(--color-grn)] text-[0.78rem] font-extrabold text-white">
              {user?.photoURL
                ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                : avatarInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.84rem] font-bold text-[var(--color-txt)]">
                {user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
              </div>
              {user?.email && (
                <div className="truncate text-[0.7rem] text-[var(--color-muted)]">{user.email}</div>
              )}
            </div>
          </div>
          <div className="py-1.5">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.84rem] text-[var(--color-txt)] transition-colors hover:bg-[var(--color-bg3)]"
              onClick={() => { setAvatarOpen(false); navigate('/dashboard/profile') }}
            >
              <span aria-hidden>👤</span>
              <span>View profile</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.84rem] text-[var(--color-txt)] transition-colors hover:bg-[var(--color-bg3)]"
              onClick={() => { setAvatarOpen(false); navigate('/dashboard/settings') }}
            >
              <span aria-hidden>⚙️</span>
              <span>Settings</span>
            </button>
          </div>
          <div className="border-t border-[var(--color-bdr)] py-1.5">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.84rem] font-semibold text-[var(--color-red)] transition-colors hover:bg-[var(--color-red2)]"
              onClick={() => { setAvatarOpen(false); handleLogout() }}
            >
              <span aria-hidden>🚪</span>
              <span>Log out</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
