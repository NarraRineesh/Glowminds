import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import useAppStore from '@/store/authStore'
import useNotifStore from '@/store/notifStore'
import { OPEN_NOTIFS_EVENT } from '@/constants/events'

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

/**
 * @param {'nav' | 'drawer'} variant — dropdown alignment (toolbar vs sidebar drawer)
 */
export default function NotificationsBell({ variant = 'nav' }) {
  const { user } = useAppStore()
  const { notifs, markRead, markAllRead, deleteNotif, clearAll } = useNotifStore()
  const unread = notifs.filter((n) => !n.read).length
  const [bellOpen, setBellOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 16 })
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const openNotifs = () => setBellOpen(true)
    window.addEventListener(OPEN_NOTIFS_EVENT, openNotifs)
    return () => window.removeEventListener(OPEN_NOTIFS_EVENT, openNotifs)
  }, [])

  // Compute portal position from trigger rect (nav variant only)
  useLayoutEffect(() => {
    if (!bellOpen || variant !== 'nav' || !triggerRef.current) return
    const update = () => {
      const r = triggerRef.current?.getBoundingClientRect()
      if (!r) return
      setPos({
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
  }, [bellOpen, variant])

  // Click-outside (works for both inline and portaled dropdown)
  useEffect(() => {
    if (!bellOpen) return
    const handler = (e) => {
      if (triggerRef.current?.contains(e.target)) return
      if (dropdownRef.current?.contains(e.target)) return
      setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  // Esc to close
  useEffect(() => {
    if (!bellOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setBellOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [bellOpen])

  const dropdownClass =
    variant === 'drawer' ? 'notif-dropdown notif-dropdown--drawer' : 'notif-dropdown'

  const dropdown = (
    <div
      ref={dropdownRef}
      className={dropdownClass}
      style={
        variant === 'nav'
          ? { position: 'fixed', top: pos.top, right: pos.right, left: 'auto', zIndex: 1000 }
          : undefined
      }
    >
      <div className="notif-dd-header">
        <span className="text-[0.82rem] font-extrabold">
          Notifications{' '}
          {unread > 0 && <span className="font-mono text-[var(--color-blu2)]">({unread})</span>}
        </span>
        <div className="flex gap-1.5">
          {unread > 0 && (
            <button type="button" className="notif-dd-btn" onClick={() => markAllRead(user?.uid)}>
              ✓ Read all
            </button>
          )}
          {notifs.length > 0 && (
            <button
              type="button"
              className="notif-dd-btn"
              onClick={() => {
                clearAll(user?.uid)
                setBellOpen(false)
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="notif-dd-list">
        {notifs.length === 0 ? (
          <div className="px-4 py-8 text-center text-[var(--color-muted)]">
            <div className="mb-1 text-2xl">🔕</div>
            <div className="text-[0.74rem]">No notifications</div>
          </div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              className={`notif-dd-item${!n.read ? ' unread' : ''}`}
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
                className="notif-dd-ic"
                style={{ background: `${n.color || 'var(--color-blu)'}18` }}
              >
                {n.icon || '🔔'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="notif-dd-title">{n.title}</div>
                {(n.description || n.desc) && <div className="notif-dd-desc">{n.description || n.desc}</div>}
                <div className="notif-dd-time">{timeAgo(n.createdAt)}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!n.read && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blu)]" />}
                <button
                  type="button"
                  className="notif-dd-del"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNotif(user?.uid, n.id)
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base text-[var(--color-txt)] transition-colors hover:bg-[var(--color-bg3)]"
        onClick={() => setBellOpen((p) => !p)}
        aria-expanded={bellOpen}
        aria-haspopup="true"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
      >
        🔔
        {unread > 0 && <span className="ndot" />}
      </button>

      {bellOpen && (
        variant === 'nav' ? createPortal(dropdown, document.body) : dropdown
      )}
    </div>
  )
}
