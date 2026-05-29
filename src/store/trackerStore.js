import { create } from 'zustand'
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import { APPLICATION_STATUS, normalizeApplicationStatus } from '@/constants/schema'
import useGamificationStore from '@/store/gamificationStore'

// Normalize a doc into the v2 application shape. Handles legacy docs that
// still use abbreviated keys (co/rl/st/dt/sal/nt) until migration runs.
function normalizeApp(raw) {
  if (!raw) return raw
  return {
    id: raw.id,
    company: raw.company || raw.co || '',
    role: raw.role || raw.rl || '',
    status: normalizeApplicationStatus(raw.status || raw.st),
    appliedDate: raw.appliedDate || raw.date || raw.dt || '',
    salary: raw.salary || raw.sal || '',
    notes: raw.notes || raw.nt || '',
    logo: raw.logo || 'jobs',
    source: raw.source || '',
    jobUrl: raw.jobUrl || '',
    jobId: raw.jobId || null,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  }
}

function buildAppPayload(input = {}) {
  return {
    company: input.company || '',
    role: input.role || '',
    status: normalizeApplicationStatus(input.status || APPLICATION_STATUS.APPLIED),
    appliedDate: input.appliedDate || new Date().toISOString().split('T')[0],
    salary: input.salary || '',
    notes: input.notes || '',
    logo: input.logo || 'jobs',
    source: input.source || '',
    jobUrl: input.jobUrl || '',
    jobId: input.jobId || null,
  }
}

const useTrackerStore = create((set, get) => ({
  apps: [],
  loading: false,
  loaded: false,

  reset: () => set({ apps: [], loading: false, loaded: false }),

  // Defaults to a cached load — sections call this on mount but we only hit
  // Firestore the first time per session (or when callers pass force:true).
  // Mutations below keep `apps` in sync without needing a refetch.
  loadApps: async ({ force = false } = {}) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    if (!force && get().loaded) return
    set({ loading: true })
    try {
      const q = query(collection(db, 'users', uid, 'applications'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const apps = snap.docs.map((d) => normalizeApp({ id: d.id, ...d.data() }))
      set({ apps, loading: false, loaded: true })
    } catch (err) {
      console.error('Load apps failed:', err)
      set({ loading: false })
    }
  },

  addApp: async (input) => {
    const uid = auth.currentUser?.uid
    if (!uid) return null
    const payload = buildAppPayload(input)
    if (payload.jobId) {
      const existing = get().apps.find((a) => a.jobId === payload.jobId)
      if (existing) return existing
    }
    try {
      const docRef = await addDoc(collection(db, 'users', uid, 'applications'), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      const newApp = normalizeApp({ id: docRef.id, ...payload, createdAt: new Date(), updatedAt: new Date() })
      set((s) => ({ apps: [newApp, ...s.apps] }))
      useGamificationStore.getState().syncEligibleBadges({ applicationCount: get().apps.length }).catch(() => {})
      return newApp
    } catch (err) {
      console.error('Add app failed:', err)
      return null
    }
  },

  updateApp: async (appId, updates) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const safe = { ...updates }
    if (safe.status) safe.status = normalizeApplicationStatus(safe.status)
    try {
      await updateDoc(doc(db, 'users', uid, 'applications', appId), {
        ...safe,
        updatedAt: serverTimestamp(),
      })
      const nextApps = get().apps.map((a) => (a.id === appId ? { ...a, ...safe, updatedAt: new Date() } : a))
      set({ apps: nextApps })
      useGamificationStore.getState().syncEligibleBadges({
        applicationCount: nextApps.length,
        hasOffer: nextApps.some((a) => a.status === 'offer'),
      }).catch(() => {})
    } catch (err) {
      console.error('Update app failed:', err)
    }
  },

  deleteApp: async (appId) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      await deleteDoc(doc(db, 'users', uid, 'applications', appId))
      set((s) => ({ apps: s.apps.filter((a) => a.id !== appId) }))
    } catch (err) {
      console.error('Delete app failed:', err)
    }
  },

  updateStatus: async (appId, status) => {
    return get().updateApp(appId, { status: normalizeApplicationStatus(status) })
  },

  findAppByJobId: (jobId) => {
    if (!jobId) return null
    return get().apps.find((a) => a.jobId === jobId) || null
  },
}))

export default useTrackerStore
