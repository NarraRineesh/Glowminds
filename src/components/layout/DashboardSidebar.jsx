import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useNotifStore from '@/store/notifStore'
import useUpgradePro from '@/hooks/useUpgradePro'
import useIsPro from '@/hooks/useIsPro'
import useEntitlements from '@/hooks/useEntitlements'
import { useYearlyPriceLabel } from '@/hooks/usePricingConfig'
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
import ProFeatureLockTooltip, { proNavCollapsedTooltip } from '@/components/ProFeatureLockTooltip'

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
  const { startUpgrade, loading: upgradeLoading } = useUpgradePro()
  const isPro = useIsPro()
  const { creditBalance, creditCosts } = useEntitlements()
  const yearlyPriceLabel = useYearlyPriceLabel()
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

  useEffect(() => {
    closeDrawer()
  }, [pathname, closeDrawer])

  const renderNavItem = (item) => {
    const active = isNavActive(pathname, item)
    const creditCost = item.creditAction ? creditCosts?.[item.creditAction] : null
    const hasCreditsForItem =
      typeof creditBalance === 'number' &&
      typeof creditCost === 'number' &&
      creditBalance >= creditCost
    const locked = item.proOnly && !isPro && !hasCreditsForItem
    const collapsedTooltip = locked
      ? proNavCollapsedTooltip(item.label, item.proHint || 'Premium AI tool.', yearlyPriceLabel)
      : item.label

    const menuItem = (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          isActive={active}
          tooltip={collapsedTooltip}
          className={cn(locked && !active && 'text-muted-foreground')}
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
          {locked && (
            <AppIcon
              name="lock"
              className="ms-auto size-3.5 shrink-0 text-muted-foreground"
              aria-label="Pro feature"
            />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )

    if (locked && !iconCollapsed) {
      return (
        <ProFeatureLockTooltip
          key={item.path}
          label={item.label}
          hint={item.proHint || 'Premium feature.'}
        >
          {menuItem}
        </ProFeatureLockTooltip>
      )
    }

    return menuItem
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
                  render={
                    <button
                      type="button"
                      className={cn(
                        'w-full cursor-pointer',
                        iconCollapsed && 'md:hidden',
                      )}
                      onClick={() => toggleGroup(group)}
                      aria-expanded={open}
                      aria-controls={`navgroup-${group.collapsibleId}`}
                    />
                  }
                >
                  <span className="flex flex-1 items-center justify-between">
                    <span>{group.label}</span>
                    {!iconCollapsed && (
                      <AppIcon
                        name="caret-down"
                        className={cn(
                          'size-3 text-muted-foreground transition-transform',
                          open ? 'rotate-0' : '-rotate-90',
                        )}
                      />
                    )}
                  </span>
                </SidebarGroupLabel>
              ) : (
                <SidebarGroupLabel className={iconCollapsed ? 'md:hidden' : undefined}>
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
        {!isPro && (
          <>
            {typeof creditBalance === 'number' && (
              <Link
                to="/dashboard/settings?tab=billing"
                onClick={closeDrawer}
                className={cn(
                  'block rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2 text-left transition-colors hover:border-primary/40',
                  iconCollapsed && 'px-2 text-center',
                )}
              >
                {!iconCollapsed ? (
                  <>
                    <p className="text-[10.5px] font-bold uppercase tracking-wide text-primary">AI credits</p>
                    <p className="text-sm font-black tabular-nums text-foreground">{creditBalance} left</p>
                    <p className="text-[10px] text-muted-foreground">Usage & billing</p>
                  </>
                ) : (
                  <AppIcon name="sparkle" className="mx-auto size-4 text-primary" aria-label={`${creditBalance} AI credits`} />
                )}
              </Link>
            )}
            <Button
            type="button"
            variant="default"
            disabled={upgradeLoading}
            onClick={() => {
              closeDrawer()
              startUpgrade({ plan: 'yearly' })
            }}
            className={cn(
              'h-auto w-full justify-start gap-3 p-2.5 text-left',
              iconCollapsed && 'justify-center px-2',
            )}
          >
            <AppIcon name="sparkle" className="size-5 shrink-0" />
            {!iconCollapsed && (
              <span className="min-w-0 flex-1">
                <span className="block text-[0.82rem] font-bold">
                  {upgradeLoading ? 'Processing...' : 'Upgrade to Pro'}
                </span>
                <span className="block text-[10.5px] font-normal opacity-90">
                  {upgradeLoading ? 'Opening checkout' : `${yearlyPriceLabel} · Unlock all`}
                </span>
              </span>
            )}
          </Button>
          </>
        )}

        {isPro && typeof creditBalance === 'number' && !iconCollapsed && (
          <Link to="/dashboard/settings?tab=billing" onClick={closeDrawer} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-2 transition-colors hover:border-emerald-500/40">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Pro credits</p>
            <p className="text-sm font-black tabular-nums text-foreground">{creditBalance} remaining</p>
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
