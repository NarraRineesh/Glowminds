import { create } from 'zustand'
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, writeBatch, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

const useNotifStore = create((set, get) => ({
  notifs: [],
  loading: true,
  loaded: false,

  /** One-shot load — avoids a persistent snapshot listener (each listener bills reads on every change). */
  loadNotifs: async (uid, { force = false } = {}) => {
    if (!uid) return
    if (!force && get().loaded) return

    set({ loading: true })
    try {
      const q = query(
        collection(db, 'users', uid, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(50),
      )
      const snap = await getDocs(q)
      const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      set({ notifs, loading: false, loaded: true })
    } catch (err) {
      console.error('Notif load error:', err)
      set({ loading: false })
    }
  },

  reset: () => set({ notifs: [], loading: true, loaded: false }),

  /** @deprecated Use loadNotifs — kept so older callers still work */
  listen: (uid) => get().loadNotifs(uid),

  /** @deprecated No persistent listener anymore */
  stopListening: () => get().reset(),

  markRead: async (uid, notifId) => {
    if (!uid || !notifId) return
    set((s) => ({
      notifs: s.notifs.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
    }))
    try {
      await updateDoc(doc(db, 'users', uid, 'notifications', notifId), { read: true })
    } catch (e) {
      console.error('Mark read error:', e)
    }
  },

  markAllRead: async (uid) => {
    if (!uid) return
    const unread = get().notifs.filter((n) => !n.read)
    if (!unread.length) return
    set((s) => ({
      notifs: s.notifs.map((n) => ({ ...n, read: true })),
    }))
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

  deleteNotif: async (uid, notifId) => {
    if (!uid || !notifId) return
    set((s) => ({ notifs: s.notifs.filter((n) => n.id !== notifId) }))
    try {
      await deleteDoc(doc(db, 'users', uid, 'notifications', notifId))
    } catch (e) {
      console.error('Delete notif error:', e)
    }
  },

  clearAll: async (uid) => {
    if (!uid) return
    const all = get().notifs
    if (!all.length) return
    set({ notifs: [] })
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

  addNotif: async (uid, { icon, title, description, desc, color, type, link }) => {
    if (!uid) return
    try {
      await addDoc(collection(db, 'users', uid, 'notifications'), {
        icon: icon || 'bell',
        title,
        description: description || desc || '',
        color: color || '#388bfd',
        type: type || 'general',
        read: false,
        link: link || null,
        createdAt: serverTimestamp(),
      })
      await get().loadNotifs(uid, { force: true })
    } catch (e) {
      console.error('Add notif error:', e)
    }
  },

  unreadCount: () => get().notifs.filter((n) => !n.read).length,
}))

export default useNotifStore
