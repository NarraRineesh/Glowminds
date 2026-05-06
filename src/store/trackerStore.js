import { create } from 'zustand'
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'

const useTrackerStore = create((set, get) => ({
  apps: [],
  loading: false,

  loadApps: async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    set({ loading: true })
    try {
      const q = query(collection(db, 'users', uid, 'applications'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      set({ apps, loading: false })
    } catch (err) {
      console.error('Load apps failed:', err)
      set({ loading: false })
    }
  },

  addApp: async (app) => {
    const uid = auth.currentUser?.uid
    if (!uid) return null
    try {
      const docRef = await addDoc(collection(db, 'users', uid, 'applications'), {
        ...app,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      const newApp = { id: docRef.id, ...app, createdAt: new Date(), updatedAt: new Date() }
      set((s) => ({ apps: [newApp, ...s.apps] }))
      return newApp
    } catch (err) {
      console.error('Add app failed:', err)
      return null
    }
  },

  updateApp: async (appId, updates) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      await updateDoc(doc(db, 'users', uid, 'applications', appId), {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      set((s) => ({
        apps: s.apps.map(a => a.id === appId ? { ...a, ...updates } : a),
      }))
    } catch (err) {
      console.error('Update app failed:', err)
    }
  },

  deleteApp: async (appId) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      await deleteDoc(doc(db, 'users', uid, 'applications', appId))
      set((s) => ({ apps: s.apps.filter(a => a.id !== appId) }))
    } catch (err) {
      console.error('Delete app failed:', err)
    }
  },

  updateStatus: async (appId, status) => {
    return get().updateApp(appId, { status })
  },
}))

export default useTrackerStore
