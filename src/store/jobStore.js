import { create } from 'zustand'
import { fetchRemotiveJobs, calculateMatchScore } from '@/services/jobApis'
import { doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'

const useJobStore = create((set, get) => ({
  jobs: [],
  savedJobs: [],
  loading: false,
  error: null,
  lastFetched: null,
  searchQuery: '',
  userSkills: [],

  setUserSkills: (skills) => set({ userSkills: skills }),

  fetchJobs: async ({ search = '', category = '' } = {}) => {
    set({ loading: true, error: null, searchQuery: search })
    try {
      const raw = await fetchRemotiveJobs({ search, category, limit: 40 })
      const { userSkills } = get()
      const jobs = raw.map(j => ({
        ...j,
        match: calculateMatchScore(j, userSkills),
      })).sort((a, b) => b.match - a.match)

      set({ jobs, loading: false, lastFetched: Date.now() })
    } catch (err) {
      console.error('Job fetch failed:', err)
      set({ error: err.message, loading: false })
    }
  },

  saveJob: async (job) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      await setDoc(doc(db, 'users', uid, 'savedJobs', job.id), {
        ...job,
        savedAt: serverTimestamp(),
      })
      set((s) => ({ savedJobs: [...s.savedJobs, job] }))
    } catch (err) {
      console.error('Save job failed:', err)
    }
  },

  unsaveJob: async (jobId) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      await deleteDoc(doc(db, 'users', uid, 'savedJobs', jobId))
      set((s) => ({ savedJobs: s.savedJobs.filter(j => j.id !== jobId) }))
    } catch (err) {
      console.error('Unsave job failed:', err)
    }
  },

  isJobSaved: (jobId) => {
    return get().savedJobs.some(j => j.id === jobId)
  },

  loadSavedJobs: async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'savedJobs'))
      const saved = snap.docs.map(d => ({ ...d.data(), id: d.id }))
      set({ savedJobs: saved })
    } catch (err) {
      console.error('Load saved jobs failed:', err)
    }
  },
}))

export default useJobStore
