import { create } from 'zustand'
import { searchJobs } from '@/services/jobSearch'
import { doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'

function buildJobSnapshot(job) {
  return {
    id: job.id,
    title: job.title || '',
    company: job.company || job.co || '',
    logo: job.logo || '💼',
    location: job.location || job.loc || '',
    remote: !!job.remote,
    type: job.type || '',
    salary: job.salary || job.sal || '',
    description: job.description || job.desc || '',
    tags: Array.isArray(job.tags) ? job.tags : [],
    url: job.url || '',
    publishedAt: job.publishedAt || null,
    source: job.source || 'ats',
  }
}

// Treat a cache fresher than this as "good enough" — callers asking for the
// same query within the window get the cached results without re-hitting
// the API. Tune if jobs need to feel more "live".
const FETCH_FRESHNESS_MS = 60_000

function cacheKey({ search = '', category = '' } = {}) {
  return `${String(search).trim().toLowerCase()}|${String(category).trim().toLowerCase()}`
}

// Module-scoped in-flight registry. Two parallel callers (e.g. OverviewSection
// + JobsSection mounting in quick succession) collapse onto the same Promise
// instead of firing duplicate HTTP requests.
let inflightPromise = null
let inflightKey = null

const useJobStore = create((set, get) => ({
  jobs: [],
  savedJobs: [],
  savedJobsLoaded: false,
  loading: false,
  error: null,
  lastFetched: null,
  lastFetchedKey: null,
  searchQuery: '',
  queryUsed: '',
  skillTerms: [],
  sources: {},

  reset: () => set({
    jobs: [],
    savedJobs: [],
    savedJobsLoaded: false,
    loading: false,
    error: null,
    lastFetched: null,
    lastFetchedKey: null,
    searchQuery: '',
    queryUsed: '',
    skillTerms: [],
    sources: {},
  }),

  fetchJobs: async ({ search = '', category = '', force = false } = {}) => {
    const key = cacheKey({ search, category })

    // 1. Coalesce concurrent callers onto the same Promise.
    if (inflightPromise && inflightKey === key) {
      return inflightPromise
    }

    // 2. Serve from cache if a recent fetch for THIS query already populated
    //    the store. Skip when `force: true`.
    if (!force) {
      const { lastFetched, lastFetchedKey, jobs } = get()
      const fresh = lastFetched && Date.now() - lastFetched < FETCH_FRESHNESS_MS
      if (fresh && lastFetchedKey === key && jobs.length > 0) {
        return { jobs, fromCache: true }
      }
    }

    set({ loading: true, error: null, searchQuery: search })
    inflightKey = key
    inflightPromise = (async () => {
      try {
        const data = await searchJobs({ search, category, limit: 30 })
        set({
          jobs: data.jobs || [],
          queryUsed: data.queryUsed || '',
          skillTerms: data.skillTerms || [],
          sources: data.sources || {},
          loading: false,
          lastFetched: Date.now(),
          lastFetchedKey: key,
        })
        return data
      } catch (err) {
        console.error('Job fetch failed:', err)
        set({ error: err.message || 'Failed to load jobs', loading: false })
        throw err
      } finally {
        inflightPromise = null
        inflightKey = null
      }
    })()
    return inflightPromise
  },

  saveJob: async (job) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const snapshot = buildJobSnapshot(job)
    try {
      await setDoc(doc(db, 'users', uid, 'savedJobs', snapshot.id), {
        ...snapshot,
        savedAt: serverTimestamp(),
      })
      set((s) => ({ savedJobs: [...s.savedJobs, { ...snapshot, savedAt: new Date() }] }))
    } catch (err) {
      console.error('Save job failed:', err)
    }
  },

  unsaveJob: async (jobId) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      await deleteDoc(doc(db, 'users', uid, 'savedJobs', jobId))
      set((s) => ({ savedJobs: s.savedJobs.filter((j) => j.id !== jobId) }))
    } catch (err) {
      console.error('Unsave job failed:', err)
    }
  },

  isJobSaved: (jobId) => {
    return get().savedJobs.some((j) => j.id === jobId)
  },

  // Cached by default. The store stays in sync via saveJob/unsaveJob, so
  // re-mounting JobsSection / OverviewSection doesn't have to rescan the
  // collection on every navigation.
  loadSavedJobs: async ({ force = false } = {}) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    if (!force && get().savedJobsLoaded) return
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'savedJobs'))
      const saved = snap.docs.map((d) => ({ ...d.data(), id: d.id }))
      set({ savedJobs: saved, savedJobsLoaded: true })
    } catch (err) {
      console.error('Load saved jobs failed:', err)
    }
  },
}))

export default useJobStore
