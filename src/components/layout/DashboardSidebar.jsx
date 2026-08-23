import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useNotifStore from '@/store/notifStore'
import useEntitlements from '@/hooks/useEntitlements'
import SidebarProfileMenu from '@/components/layout/SidebarProfileMenu'
import BrandLogo, { GlowmindsWordmark } from '@/components/BrandLogo'
import AppIcon from '@/components/icons/AppIcon'
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  cn,
  useSidebarState,
} from '@/components/ui'
import {
  SIDEBAR_GROUPS as NAV_GROUPS,
  SIDEBAR_GROUPS_STORAGE_KEY,
  SIDEBAR_TOP_ITEMS,
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

function isNavActive(pathname, item) {
  if (item.end) return pathname === item.path
  return pathname === item.path || pathname.startsWith(`${item.path}/`)
}

export default function DashboardSidebar() {
  const { pathname } = useLocation()
  const { user } = useAppStore()
  const { loadNotifs, reset: resetNotifs } = useNotifStore()
  const { isPro, loading: entitlementsLoading, entitlements } = useEntitlements()
  const { setOpenMobile, state } = useSidebarState()
  const iconCollapsed = state === 'collapsed'

  const closeDrawer = useCallback(() => {
    setOpenMobile(false)
  }, [setOpenMobile])

  useEffect(() => {
    if (user?.uid) loadNotifs(user.uid)
    return () => resetNotifs()
  }, [user?.uid, loadNotifs, resetNotifs])

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

  useEffect(() => {
    NAV_GROUPS.forEach((group) => {
      if (!group.collapsibleId) return
      const matches = group.items.some((it) => isNavActive(pathname, it))
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

  const visibleGroups = useMemo(
    () => NAV_GROUPS.filter((group) => group.items.length > 0),
    [],
  )

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

  useEffect(() => {
    closeDrawer()
  }, [pathname, closeDrawer])

  const renderNavItem = (item) => {
    const active = isNavActive(pathname, item)
    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          isActive={active}
          tooltip={item.label}
          render={
            <NavLink
              to={item.path}
              end={item.end}
              onClick={closeDrawer}
            />
          }
        >
          <AppIcon name={item.icon} className="size-4 shrink-0" />
          <span className="truncate">{item.label}</span>
          {item.proOnly && !isPro && (
            <AppIcon name="lock" className="ml-auto size-3 shrink-0 text-muted-foreground" />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar id="dashboardSidebar" collapsible="icon">
      <SidebarHeader className="flex flex-row items-center gap-1 border-b border-sidebar-border p-2">
        <SidebarMenuButton
          size="lg"
          tooltip="Glowminds"
          render={<Link to="/dashboard" onClick={closeDrawer} />}
          className="min-w-0 flex-1"
        >
          <BrandLogo size={32} alt="" aria-hidden className="rounded-lg" />
          <GlowmindsWordmark className="text-sidebar-foreground" />
        </SidebarMenuButton>
        <SidebarTrigger className="hidden md:inline-flex" />
      </SidebarHeader>

      <SidebarContent>
        {SIDEBAR_TOP_ITEMS.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>{SIDEBAR_TOP_ITEMS.map(renderNavItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {visibleGroups.map((group) => {
          const open = isGroupOpen(group)
          const showItems = open || iconCollapsed
          return (
            <SidebarGroup key={group.label}>
              {group.collapsibleId ? (
                <SidebarGroupLabel
                  className={cn(
                    'h-8 text-sm font-semibold tracking-wide text-sidebar-foreground/85',
                    iconCollapsed && 'md:hidden',
                  )}
                  render={
                    <button
                      type="button"
                      className="w-full cursor-pointer"
                      onClick={() => toggleGroup(group)}
                      aria-expanded={open}
                      aria-controls={`navgroup-${group.collapsibleId}`}
                    />
                  }
                >
                  <span className="flex flex-1 items-center justify-between gap-2">
                    <span>{group.label}</span>
                    {!iconCollapsed && (
                      <AppIcon
                        name="caret-down"
                        className={cn(
                          'size-3.5 shrink-0 text-muted-foreground transition-transform',
                          open ? 'rotate-0' : '-rotate-90',
                        )}
                      />
                    )}
                  </span>
                </SidebarGroupLabel>
              ) : (
                <SidebarGroupLabel
                  className={cn(
                    'h-8 text-sm font-semibold tracking-wide text-sidebar-foreground/85',
                    iconCollapsed && 'md:hidden',
                  )}
                >
                  {group.label}
                </SidebarGroupLabel>
              )}
              {showItems && (
                <SidebarGroupContent id={group.collapsibleId ? `navgroup-${group.collapsibleId}` : undefined}>
                  <SidebarMenu>{group.items.map(renderNavItem)}</SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="gap-1">
        {!entitlementsLoading && isPro ? (
          <div
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border border-primary/25 bg-primary/10 p-2.5',
              iconCollapsed && 'justify-center px-2',
            )}
          >
            <AppIcon name="star" className="size-5 shrink-0 text-primary" weight="fill" />
            {!iconCollapsed && (
              <span className="min-w-0 flex-1">
                <span className="block text-[0.82rem] font-bold text-foreground">Glowminds Pro</span>
                <span className="block text-[10.5px] text-muted-foreground">All features unlocked</span>
              </span>
            )}
          </div>
        ) : !entitlementsLoading ? (
        <Button
          type="button"
          variant="default"
          nativeButton={false}
          render={<Link to="/dashboard/plans" onClick={closeDrawer} />}
          className={cn(
            'h-auto w-full justify-start gap-3 p-2.5 text-left',
            iconCollapsed && 'justify-center px-2',
          )}
        >
          <AppIcon name="sparkle" className="size-5 shrink-0" />
          {!iconCollapsed && (
            <span className="min-w-0 flex-1">
              <span className="block text-[0.82rem] font-bold">Upgrade</span>
              <span className="block text-[10.5px] font-normal opacity-90">
                Compare plans & choose
              </span>
            </span>
          )}
        </Button>
        ) : null}

        {typeof entitlements?.credits?.balance === 'number' && (
          <Link
            to="/dashboard/settings?tab=usage"
            onClick={closeDrawer}
            className={cn(
              'block rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2 text-left transition-colors hover:border-primary/40',
              iconCollapsed && 'px-2 text-center',
            )}
          >
            {!iconCollapsed ? (
              <>
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-primary">AI credits</p>
                <p className="text-sm font-black tabular-nums text-foreground">{entitlements.credits.balance} left</p>
                <p className="text-[10px] text-muted-foreground">Usage & billing</p>
              </>
            ) : (
              <AppIcon name="sparkle" className="mx-auto size-4 text-primary" aria-label={`${entitlements.credits.balance} AI credits`} />
            )}
          </Link>
        )}

        <SidebarProfileMenu
          user={user}
          initials={initials}
          iconCollapsed={iconCollapsed}
          onCloseDrawer={closeDrawer}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
