import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useDashboardNav from '@/hooks/useDashboardNav'
import useIsLg from '@/hooks/useIsLg'
import useTheme from '@/hooks/useTheme'
import useUpgradePro from '@/hooks/useUpgradePro'
import {
  SIDEBAR_GROUPS as NAV_GROUPS,
  SIDEBAR_FOOTER_NAV as FOOTER_NAV,
  SIDEBAR_GROUPS_STORAGE_KEY,
} from '@/constants/sidebarNav'

function loadGroupState() {
  try {
    const raw = localStorage.getItem(SIDEBAR_GROUPS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveGroupState(state) {
  try {
    localStorage.setItem(SIDEBAR_GROUPS_STORAGE_KEY, JSON.stringify(state))
  } catch { /* swallow */ }
}

const SIDEBAR_FONT = "'Outfit', 'Inter', system-ui, -apple-system, sans-serif"

const DRAWER_SHELL =
  'w-[min(264px,84vw)] px-3 py-4 sm:w-[min(272px,82vw)] sm:px-4 sm:py-5'

function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

function navItemClass(isActive, desktopCollapsed) {
  return cx(
    'group flex min-h-[40px] items-center gap-3 rounded-lg text-[0.92rem] transition-colors',
    desktopCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
    isActive
      ? 'bg-[var(--color-prp2)] font-semibold text-[var(--color-prp)]'
      : 'font-medium text-[var(--color-txt)] hover:bg-[var(--color-bg3)] hover:text-[var(--color-txt)]',
  )
}

export default function DashboardSidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, doLogout } = useAppStore()
  const { theme, toggleTheme } = useTheme()
  const { mobileSidebarOpen, closeMobileSidebar } = useDashboardNav() ?? {}
  const { startUpgrade, loading: upgradeLoading } = useUpgradePro()

  const closeDrawer = useCallback(() => closeMobileSidebar?.(), [closeMobileSidebar])
  const mobileOpen = mobileSidebarOpen ?? false
  const isLg = useIsLg()
  const desktopCollapsed = collapsed && isLg
  const labelCls = (base) => (desktopCollapsed ? `${base} lg:hidden` : base)

  // Persisted collapsible-group open/closed state.
  const [groupState, setGroupState] = useState(loadGroupState)
  const isGroupOpen = useCallback(
    (group) => {
      if (!group.collapsibleId) return true
      const stored = groupState[group.collapsibleId]
      return typeof stored === 'boolean' ? stored : group.defaultOpen !== false
    },
    [groupState],
  )
  const toggleGroup = useCallback((group) => {
    if (!group.collapsibleId) return
    setGroupState((prev) => {
      const current = typeof prev[group.collapsibleId] === 'boolean'
        ? prev[group.collapsibleId]
        : group.defaultOpen !== false
      const next = { ...prev, [group.collapsibleId]: !current }
      saveGroupState(next)
      return next
    })
  }, [])

  // Auto-expand a group if the active route matches one of its items.
  useEffect(() => {
    NAV_GROUPS.forEach((group) => {
      if (!group.collapsibleId) return
      const matches = group.items.some((it) => pathname.startsWith(it.path))
      if (matches && groupState[group.collapsibleId] === false) {
        setGroupState((prev) => {
          const next = { ...prev, [group.collapsibleId]: true }
          saveGroupState(next)
          return next
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Strip out admin-only groups/items unless the signed-in user has the
  // `admin: true` custom claim (surfaced as user.isAdmin in useAuthListener).
  const visibleGroups = useMemo(() => {
    const isAdmin = !!user?.isAdmin
    return NAV_GROUPS
      .filter((g) => !g.requiresAdmin || isAdmin)
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => !it.requiresAdmin || isAdmin),
      }))
      .filter((g) => g.items.length > 0)
  }, [user?.isAdmin])

  const initials = useMemo(() => {
    const name = user?.displayName
    if (!name?.trim()) return 'U'
    return name
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [user?.displayName])

  const go = useCallback(
    (path) => {
      navigate(path)
      closeDrawer()
    },
    [navigate, closeDrawer],
  )

  // Close drawer on route change — depend on stable `closeDrawer`, not full context object.
  useEffect(() => {
    closeDrawer()
  }, [pathname, closeDrawer])

  useEffect(() => {
    if (!mobileOpen || isLg) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', onKey)
    const html = document.documentElement
    const body = document.body
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      overscroll: html.style.overscrollBehavior,
    }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    return () => {
      window.removeEventListener('keydown', onKey)
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      html.style.overscrollBehavior = prev.overscroll
    }
  }, [mobileOpen, isLg, closeDrawer])

  const handleLogout = async () => {
    await doLogout()
    closeDrawer()
    navigate('/login')
  }

  const asideWidth = desktopCollapsed
    ? cx(
        DRAWER_SHELL,
        'lg:w-[72px] lg:min-w-[72px] lg:max-w-[72px] lg:overflow-x-hidden lg:px-2 lg:py-6',
      )
    : cx(DRAWER_SHELL, 'lg:w-[260px] lg:min-w-[260px] lg:max-w-[260px] lg:px-3.5 lg:py-6')

  const mobileDrawer = mobileOpen && !isLg
  const drawerInert = !isLg && !mobileOpen

  const renderNavItem = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.end}
      onClick={closeDrawer}
      className={({ isActive }) => navItemClass(isActive, desktopCollapsed)}
    >
      <span className="shrink-0 text-[1.05rem] leading-none" aria-hidden>
        {item.icon}
      </span>
      <span className={labelCls('min-w-0 flex-1 truncate text-left')}>{item.label}</span>
    </NavLink>
  )

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        className={cx(
          'fixed inset-0 top-16 z-[55] bg-[var(--color-txt)]/30 backdrop-blur-[2px] transition-opacity duration-300 ease-out lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeDrawer}
      />

      <aside
        id="dashboardSidebar"
        inert={drawerInert}
        aria-modal={mobileDrawer ? 'true' : undefined}
        aria-hidden={mobileDrawer ? undefined : !isLg ? true : undefined}
        style={{ fontFamily: SIDEBAR_FONT }}
        className={cx(
          'fixed bottom-0 left-0 top-16 z-[60] flex flex-col border-r border-[var(--color-bdr)] bg-[var(--color-surf)] shadow-[2px_0_16px_rgba(0,0,0,0.06)]',
          'max-lg:transition-transform max-lg:duration-300 max-lg:ease-[cubic-bezier(0.32,0.72,0,1)]',
          'lg:transition-[transform,width,padding,min-width,max-width] lg:duration-300 lg:ease-[cubic-bezier(0.32,0.72,0,1)]',
          asideWidth,
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <button
          type="button"
          className="absolute -right-3 top-6 z-10 hidden h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--color-surf)] bg-gradient-to-br from-[var(--color-blu)] to-[var(--color-grn)] text-[10px] font-bold text-white shadow-md transition hover:scale-105 lg:flex"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>

        <nav className="mt-2 flex max-h-[55vh] flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:mt-3 lg:max-h-none lg:min-h-0 lg:pb-3 [&::-webkit-scrollbar]:hidden">
          {visibleGroups.map((group) => {
            const open = isGroupOpen(group)
            const headingCommon =
              'px-3 pb-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]'
            return (
              <div key={group.label} className="flex flex-col gap-0.5">
                {group.collapsibleId ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className={cx(
                      headingCommon,
                      'flex w-full items-center justify-between rounded-md text-left transition-colors hover:text-[var(--color-txt2)]',
                      desktopCollapsed && 'lg:hidden',
                    )}
                    aria-expanded={open}
                    aria-controls={`navgroup-${group.collapsibleId}`}
                  >
                    <span>{group.label}</span>
                    <span aria-hidden className="text-[0.7rem] text-[var(--color-muted)] transition-transform" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
                  </button>
                ) : (
                  <div
                    className={cx(headingCommon, desktopCollapsed && 'lg:hidden')}
                    aria-hidden={desktopCollapsed}
                  >
                    {group.label}
                  </div>
                )}
                {(open || desktopCollapsed) && (
                  <div
                    id={group.collapsibleId ? `navgroup-${group.collapsibleId}` : undefined}
                    className="flex flex-col gap-0.5"
                  >
                    {group.items.map(renderNavItem)}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-[var(--color-bdr)] pt-3">
          {!isLg && (
            <div className="mb-3 flex flex-col gap-0.5">{FOOTER_NAV.map(renderNavItem)}</div>
          )}

          <div className={cx('mb-2 flex items-center gap-2', desktopCollapsed && 'justify-center')}>
            <button
              type="button"
              onClick={() => go('/dashboard/profile')}
              className={cx(
                'flex items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[var(--color-bg3)]',
                desktopCollapsed ? 'justify-center' : isLg ? 'w-full' : 'min-w-0 flex-1',
              )}
              aria-label="Open profile"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--color-blu)] to-[var(--color-prp)] text-xs font-bold text-white ring-2 ring-[var(--color-bdr)]">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className={labelCls('min-w-0 flex-1 text-left')}>
                <div className="truncate text-[0.82rem] font-semibold text-[var(--color-txt)]">
                  {user?.displayName || 'User'}
                </div>
                <div className="truncate text-[0.7rem] text-[var(--color-txt2)]">
                  {user?.email || ''}
                </div>
              </div>
            </button>

            {!isLg && (
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base text-[var(--color-txt)] transition-colors hover:bg-[var(--color-bg3)]"
              >
                <span aria-hidden>{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={upgradeLoading}
            onClick={() => {
              closeDrawer()
              startUpgrade({ plan: 'yearly' })
            }}
            className={cx(
              'mb-2 flex w-full items-center gap-3 rounded-xl bg-gradient-to-br from-[var(--color-blu)] to-[var(--color-prp)] p-2.5 text-left text-white shadow-lg shadow-[var(--color-blu)]/20 transition hover:opacity-[0.96] disabled:cursor-not-allowed disabled:opacity-70',
              desktopCollapsed && 'justify-center',
            )}
          >
            <span className="text-lg leading-none" aria-hidden>
              ✨
            </span>
            <span className={labelCls('min-w-0 flex-1')}>
              <span className="block text-[0.82rem] font-bold">
                {upgradeLoading ? 'Processing...' : 'Upgrade to Pro'}
              </span>
              <span className="block text-[10.5px] font-normal opacity-90">
                {upgradeLoading ? 'Opening checkout' : 'Unlock all features'}
              </span>
            </span>
          </button>

          {!isLg && (
            <button
              type="button"
              onClick={handleLogout}
              className={cx(
                'flex w-full items-center gap-3 rounded-lg py-2 text-[0.88rem] text-[var(--color-txt2)] transition-colors hover:bg-[var(--color-bg3)] hover:text-[var(--color-txt)]',
                desktopCollapsed ? 'justify-center px-2' : 'px-3',
              )}
            >
              <span className="text-base leading-none" aria-hidden>
                🚪
              </span>
              <span className={labelCls('font-medium')}>Logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
