import { create } from 'zustand'
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

const useNotifStore = create((set, get) => ({
  notifs: [],
  loading: true,
  unsubscribe: null,

  /** Start real-time listener for user's notifications */
  listen: (uid) => {
    if (!uid) return
    // Unsubscribe previous listener if any
    const prev = get().unsubscribe
    if (prev) prev()

    const q = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      set({ notifs, loading: false })
    }, (err) => {
      console.error('Notif listener error:', err)
      set({ loading: false })
    })

    set({ unsubscribe: unsub })
  },

  /** Stop listener */
  stopListening: () => {
    const unsub = get().unsubscribe
    if (unsub) unsub()
    set({ unsubscribe: null, notifs: [], loading: true })
  },

  /** Mark a single notification as read */
  markRead: async (uid, notifId) => {
    if (!uid || !notifId) return
    try {
      await updateDoc(doc(db, 'users', uid, 'notifications', notifId), { read: true })
    } catch (e) {
      console.error('Mark read error:', e)
    }
  },

  /** Mark all notifications as read */
  markAllRead: async (uid) => {
    if (!uid) return
    const unread = get().notifs.filter(n => !n.read)
    if (!unread.length) return
    try {
      const batch = writeBatch(db)
      for (const n of unread) {
        batch.update(doc(db, 'users', uid, 'notifications', n.id), { read: true })
      }
      await batch.commit()
    } catch (e) {
      console.error('Mark all read error:', e)
    }
  },

  /** Delete a single notification */
  deleteNotif: async (uid, notifId) => {
    if (!uid || !notifId) return
    try {
      await deleteDoc(doc(db, 'users', uid, 'notifications', notifId))
    } catch (e) {
      console.error('Delete notif error:', e)
    }
  },

  /** Clear all notifications */
  clearAll: async (uid) => {
    if (!uid) return
    const all = get().notifs
    if (!all.length) return
    try {
      const batch = writeBatch(db)
      for (const n of all) {
        batch.delete(doc(db, 'users', uid, 'notifications', n.id))
      }
      await batch.commit()
    } catch (e) {
      console.error('Clear all error:', e)
    }
  },

  /** Add a notification (used by other parts of the app) */
  addNotif: async (uid, { icon, title, desc, color, type }) => {
    if (!uid) return
    try {
      await addDoc(collection(db, 'users', uid, 'notifications'), {
        icon: icon || '🔔',
        title,
        desc: desc || '',
        color: color || 'var(--color-blu)',
        type: type || 'general',
        read: false,
        createdAt: serverTimestamp(),
      })
    } catch (e) {
      console.error('Add notif error:', e)
    }
  },

  /** Unread count selector */
  unreadCount: () => get().notifs.filter(n => !n.read).length,
}))

export default useNotifStore
