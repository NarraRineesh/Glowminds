import { create } from 'zustand'
import { updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { auth } from '@/services/firebase'
import { apiFetch } from '@/services/apiClient'
import { APPLICATION_STATUS, normalizeApplicationStatus } from '@/constants/schema'
import { applicationDocRef, loadApplications } from '@/utils/firestoreCollections'

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

  loadApps: async ({ force = false } = {}) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    if (!force && get().loaded) return
    set({ loading: true })
    try {
      const apps = (await loadApplications(uid)).map((raw) => normalizeApp(raw))
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
      const created = await apiFetch('/applications', { body: payload })
      const newApp = normalizeApp({
        id: created.id,
        ...payload,
        ...created,
        createdAt: created.createdAt || new Date(),
        updatedAt: created.updatedAt || new Date(),
      })
      set((s) => ({ apps: [newApp, ...s.apps] }))
      return newApp
    } catch (err) {
      console.error('Add app failed:', err)
      throw err
    }
  },

  updateApp: async (appId, updates) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const safe = { ...updates }
    if (safe.status) safe.status = normalizeApplicationStatus(safe.status)
    try {
      await updateDoc(applicationDocRef(appId), {
        ...safe,
        updatedAt: serverTimestamp(),
      })
      const nextApps = get().apps.map((a) => (a.id === appId ? { ...a, ...safe, updatedAt: new Date() } : a))
      set({ apps: nextApps })
    } catch (err) {
      console.error('Update app failed:', err)
    }
  },

  deleteApp: async (appId) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      await deleteDoc(applicationDocRef(appId))
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
