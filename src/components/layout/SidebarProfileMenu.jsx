import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useNotifStore from '@/store/notifStore'
import useTheme from '@/hooks/useTheme'
import useIsLg from '@/hooks/useIsLg'
import AppIcon from '@/components/icons/AppIcon'
import {
  NotificationsPanel,
  useNotificationUnreadCount,
} from '@/components/layout/NotificationsBell'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  SidebarMenuButton,
  cn,
} from '@/components/ui'

export default function SidebarProfileMenu({ user, initials, iconCollapsed, onCloseDrawer }) {
  const navigate = useNavigate()
  const { doLogout } = useAppStore()
  const { loadNotifs } = useNotifStore()
  const { theme, toggleTheme } = useTheme()
  const isLg = useIsLg()
  const unread = useNotificationUnreadCount()

  const go = useCallback(
    (path) => {
      navigate(path)
      onCloseDrawer?.()
    },
    [navigate, onCloseDrawer],
  )

  const handleLogout = async () => {
    await doLogout()
    onCloseDrawer?.()
    navigate('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            tooltip={iconCollapsed ? (user?.displayName || 'Account') : undefined}
            className={cn(
              'h-auto w-full data-[state=open]:bg-sidebar-accent',
              iconCollapsed ? 'justify-center' : 'justify-start',
            )}
          >
            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-sidebar-border">
              {user?.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!iconCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-semibold text-sidebar-foreground">
                  {user?.displayName || 'User'}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {user?.email || ''}
                </div>
              </div>
            )}
            {!iconCollapsed && unread > 0 && (
              <Badge variant="secondary" className="ms-auto shrink-0 font-mono text-primary">
                {unread}
              </Badge>
            )}
          </SidebarMenuButton>
        }
      />
      <DropdownMenuContent
        side={isLg ? 'right' : 'top'}
        align={isLg ? (iconCollapsed ? 'center' : 'end') : 'start'}
        sideOffset={isLg ? 12 : 8}
        className="w-56"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">{user?.displayName || 'User'}</span>
              <span className="text-xs text-muted-foreground">{user?.email || ''}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => go('/dashboard/profile')}>
          <AppIcon name="user" className="me-2 size-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSub
          onOpenChange={(open) => {
            if (open && user?.uid) loadNotifs(user.uid, { force: true })
          }}
        >
          <DropdownMenuSubTrigger>
            <AppIcon name="bell" className="me-2 size-4" />
            Notifications
            {unread > 0 && (
              <Badge variant="secondary" className="ms-auto font-mono text-primary">
                {unread}
              </Badge>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent side="right" align="start" sideOffset={8} className="w-80 p-0">
            <NotificationsPanel scrollClassName="max-h-72" />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem onClick={() => go('/dashboard/settings')}>
          <AppIcon name="settings" className="me-2 size-4" />
          Settings
        </DropdownMenuItem>

        {user?.isAdmin === true && (
          <DropdownMenuItem onClick={() => go('/admin')}>
            <AppIcon name="shield" className="me-2 size-4" />
            Admin dashboard
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={toggleTheme}>
          <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} className="me-2 size-4" />
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <AppIcon name="logout" className="me-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
