import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useNotifStore from '@/store/notifStore'
import useProfileStore from '@/store/profileStore'
import { NotificationsPanel } from '@/components/layout/NotificationsBell'
import {
  AiRail,
  FilterBar,
  SectionCard,
  SplitRail,
  Toolbar,
} from '@/features/dashboard/components/v2'
import { AppIcon, Button, Switch, cn } from '@/components/ui'

const FILTERS = ['All', 'Unread', 'Jobs', 'Interviews', 'Learning', 'System']

function matchesFilter(n, filter) {
  if (filter === 'All') return true
  if (filter === 'Unread') return !n.read
  const t = String(n.type || n.category || '').toLowerCase()
  if (filter === 'Jobs') return t.includes('job') || t.includes('match') || t.includes('apply')
  if (filter === 'Interviews') return t.includes('interview')
  if (filter === 'Learning') return t.includes('learn') || t.includes('streak')
  if (filter === 'System') return !t || t.includes('system') || t.includes('billing')
  return true
}

function isActionable(n) {
  if (n.read) return false
  if (n.priority === 'high' || n.actionRequired) return true
  const t = String(n.type || n.category || '').toLowerCase()
  return t.includes('interview') || t.includes('learn') || t.includes('streak') || t.includes('offer')
}

export default function NotificationsSection() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const { notifs, markRead, markAllRead } = useNotifStore()
  const profile = useProfileStore((s) => s.profile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const [filter, setFilter] = useState('Unread')

  const prefs = profile?.notificationPrefs || {}

  const filtered = useMemo(
    () => notifs.filter((n) => matchesFilter(n, filter)),
    [notifs, filter],
  )

  const needsAction = useMemo(
    () => notifs.filter(isActionable).slice(0, 5),
    [notifs],
  )

  const unreadCount = useMemo(() => notifs.filter((n) => !n.read).length, [notifs])
  const topPriority = needsAction[0] || notifs.find((n) => !n.read) || null

  const setPref = (key, value) => {
    const next = { ...prefs, [key]: value }
    updateProfile?.({ notificationPrefs: next }).catch?.(() => {})
  }

  const openNotif = (n) => {
    if (user?.uid) markRead(user.uid, n.id)
    if (n.link) navigate(n.link)
    else if (String(n.type || '').toLowerCase().includes('interview')) navigate('/dashboard/interview')
    else if (String(n.type || '').toLowerCase().includes('learn')) navigate('/dashboard/learning')
    else if (String(n.type || '').toLowerCase().includes('job')) navigate('/dashboard/jobs')
  }

  return (
    <div className="space-y-4">
      <Toolbar
        left={<FilterBar options={FILTERS} value={filter} onChange={setFilter} />}
        right={(
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              disabled={!unreadCount}
              onClick={() => markAllRead(user?.uid)}
            >
              Mark all read
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => navigate('/dashboard/settings')}
            >
              Preferences
            </Button>
          </>
        )}
      />

      <SplitRail
        main={(
          <>
            {needsAction.length > 0 && (
              <SectionCard
                title="Needs action"
                action={<span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-xs font-medium text-warning">{needsAction.length}</span>}
              >
                <ul className="space-y-2">
                  {needsAction.map((n) => (
                    <li
                      key={n.id}
                      className={cn('flex items-start gap-2 rounded-lg border border-border px-3 py-2.5', !n.read && 'bg-accent/40')}
                    >
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-warning" />
                      <div className="min-w-0 flex-1">
                        <strong className="text-sm">{n.title || n.message}</strong>
                        {(n.body || n.message) && n.title && (
                          <p className="m-0 text-xs text-muted-foreground">{n.body || n.message}</p>
                        )}
                      </div>
                      <Button type="button" size="sm" onClick={() => openNotif(n)}>
                        Open
                      </Button>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            <SectionCard
              title="Inbox"
              action={<span className="text-xs text-muted-foreground">{unreadCount} unread · {filtered.length}</span>}
            >
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <AppIcon name="bell-slash" className="mx-auto mb-2 size-8 opacity-50" />
                  <p className="text-sm">No notifications in this filter</p>
                </div>
              ) : (
                <NotificationsPanel
                  scrollClassName="max-h-[28rem]"
                  filterFn={(n) => matchesFilter(n, filter)}
                  hideHeader
                />
              )}
            </SectionCard>
          </>
        )}
        rail={(
          <>
            <AiRail
              title="Prioritize"
              body={
                topPriority
                  ? `${topPriority.title || topPriority.message || 'Next unread'} — highest leverage in your inbox right now.`
                  : 'You’re caught up. New matches and interview reminders will surface here.'
              }
              cta={topPriority ? 'Open priority' : 'Browse jobs'}
              onCta={() => {
                if (topPriority) openNotif(topPriority)
                else navigate('/dashboard/jobs')
              }}
            />
            <SectionCard title="Preferences">
              <ul className="space-y-3">
                {[
                  ['interviewReminders', 'Interview reminders', true],
                  ['jobMatchesHigh', 'Job matches ≥85%', true],
                  ['weeklyDigest', 'Weekly digest', true],
                  ['marketing', 'Marketing', false],
                ].map(([key, label, defaultOn]) => (
                  <li key={key} className="flex items-center justify-between gap-3 text-sm">
                    <span>{label}</span>
                    <Switch
                      checked={prefs[key] ?? defaultOn}
                      onCheckedChange={(v) => setPref(key, v)}
                      aria-label={label}
                    />
                  </li>
                ))}
              </ul>
            </SectionCard>
          </>
        )}
      />
    </div>
  )
}
