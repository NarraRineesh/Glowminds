import { useEffect, useState } from 'react'
import useAppStore from '@/store/authStore'
import useNotifStore from '@/store/notifStore'
import { OPEN_NOTIFS_EVENT } from '@/constants/events'
import AppIcon from '@/components/icons/AppIcon'
import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@/components/ui'

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function NotificationsPanel({ className, scrollClassName }) {
  const { user } = useAppStore()
  const { notifs, markRead, markAllRead, deleteNotif, clearAll } = useNotifStore()
  const unread = notifs.filter((n) => !n.read).length

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="text-sm font-bold text-foreground">
          Notifications{' '}
          {unread > 0 && (
            <Badge variant="secondary" className="ms-1 font-mono text-primary">
              {unread}
            </Badge>
          )}
        </span>
        <div className="flex gap-1.5">
          {unread > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => markAllRead(user?.uid)}>
              <AppIcon name="check" className="me-1 size-3.5" />
              Read all
            </Button>
          )}
          {notifs.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => clearAll(user?.uid)}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className={scrollClassName || 'max-h-80'}>
        {notifs.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <AppIcon name="bell-slash" className="mx-auto mb-2 size-8 opacity-50" />
            <div className="text-xs">No notifications yet</div>
            <div className="mx-auto mt-1 max-w-[220px] text-[11px] leading-relaxed">
              Turn on Job matches ≥85% in Settings to be notified when a role hits that match score.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifs.map((n) => (
              <li key={n.id}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                    !n.read ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => {
                    if (!n.read) markRead(user?.uid, n.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (!n.read) markRead(user?.uid, n.id)
                    }
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    style={n.color ? { backgroundColor: `${n.color}18`, color: n.color } : undefined}
                  >
                    <AppIcon name={n.icon || 'bell'} className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{n.title}</div>
                    {(n.description || n.desc) && (
                      <div className="text-xs text-muted-foreground">{n.description || n.desc}</div>
                    )}
                    <div className="mt-0.5 text-[0.7rem] text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!n.read && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotif(user?.uid, n.id)
                      }}
                      title="Delete"
                    >
                      <AppIcon name="x" className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}

export function useNotificationUnreadCount() {
  const { notifs } = useNotifStore()
  return notifs.filter((n) => !n.read).length
}

/** Standalone bell + popover. Sidebar uses profile menu instead. */
export default function NotificationsBell({ variant = 'nav' }) {
  const { user } = useAppStore()
  const { loadNotifs, notifs } = useNotifStore()
  const unread = notifs.filter((n) => !n.read).length
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const openNotifs = () => setOpen(true)
    window.addEventListener(OPEN_NOTIFS_EVENT, openNotifs)
    return () => window.removeEventListener(OPEN_NOTIFS_EVENT, openNotifs)
  }, [])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next && user?.uid) loadNotifs(user.uid, { force: true })
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative shrink-0"
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
          >
            <AppIcon name="bell" className="size-5" />
            {unread > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-popover" />
            )}
          </Button>
        }
      />
      <PopoverContent
        align={variant === 'drawer' ? 'start' : 'end'}
        side="bottom"
        sideOffset={10}
        className={variant === 'drawer' ? 'w-full max-w-none p-0 sm:w-80' : 'w-80 p-0'}
      >
        <NotificationsPanel scrollClassName={variant === 'drawer' ? 'max-h-64' : 'max-h-80'} />
      </PopoverContent>
    </Popover>
  )
}
