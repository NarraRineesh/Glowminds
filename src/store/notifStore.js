import { create } from 'zustand'
import {
  collection,
  writeBatch,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { loadNotifications, notificationDocRef } from '@/utils/firestoreCollections'

const useNotifStore = create((set, get) => ({
  notifs: [],
  loading: true,
  loaded: false,

  loadNotifs: async (uid, { force = false } = {}) => {
    if (!uid) return
    if (!force && get().loaded) return

    set({ loading: true })
    try {
      const notifs = await loadNotifications(uid, 50)
      set({ notifs, loading: false, loaded: true })
    } catch (err) {
      console.error('Notif load error:', err)
      set({ loading: false })
    }
  },

  reset: () => set({ notifs: [], loading: true, loaded: false }),

  listen: (uid) => get().loadNotifs(uid),

  stopListening: () => get().reset(),

  markRead: async (uid, notifId) => {
    if (!uid || !notifId) return
    set((s) => ({
      notifs: s.notifs.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
    }))
    try {
      await updateDoc(notificationDocRef(notifId), { read: true })
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
        batch.update(notificationDocRef(n.id), { read: true })
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
      await deleteDoc(notificationDocRef(notifId))
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
        batch.delete(notificationDocRef(n.id))
      }
      await batch.commit()
    } catch (e) {
      console.error('Clear all error:', e)
    }
  },

  addNotif: async (uid, { icon, title, description, desc, color, type, link }) => {
    if (!uid) return
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: uid,
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
