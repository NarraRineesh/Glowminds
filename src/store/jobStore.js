import { create } from 'zustand'
import { searchJobs } from '@/services/jobSearch'
import { doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'

function buildJobSnapshot(job) {
  return {
    id: job.id,
    title: job.title || '',
    company: job.company || job.co || '',
    logo: job.logo || 'jobs',
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

const FETCH_FRESHNESS_MS = 60_000
const DEFAULT_PAGE_SIZE = 10

const emptyPagination = () => ({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasMore: false,
  from: 0,
  to: 0,
})

/** Cache key for a search — excludes page and filters so both reuse one ranked list. */
function listCacheKey({ search = '', category = '' } = {}) {
  return `${String(search).trim().toLowerCase()}|${String(category).trim().toLowerCase()}`
}

function applyJobFilters(jobs, filters = {}) {
  let out = jobs
  if (filters.type) {
    out = out.filter((j) => j.type === filters.type)
  }
  if (filters.minMatch != null && Number.isFinite(Number(filters.minMatch))) {
    const min = Number(filters.minMatch)
    out = out.filter((j) => (j.match || 0) >= min)
  }
  if (filters.newToday) {
    out = out.filter((j) => j.isNew)
  }
  return out
}

function paginateList(allJobs, { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const size = Math.max(1, pageSize)
  const total = allJobs.length
  const totalPages = Math.max(1, Math.ceil(total / size))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * size
  const jobs = allJobs.slice(start, start + size)
  return {
    jobs,
    pagination: {
      page: safePage,
      pageSize: size,
      total,
      totalPages,
      hasMore: safePage < totalPages,
      from: total === 0 ? 0 : start + 1,
      to: start + jobs.length,
    },
  }
}

let inflightPromise = null
let inflightKey = null

const useJobStore = create((set, get) => ({
  jobs: [],
  pagination: emptyPagination(),
  allRankedJobs: [],
  rankedListKey: null,
  savedJobs: [],
  savedJobsLoaded: false,
  loading: false,
  error: null,
  lastFetched: null,
  searchQuery: '',
  queryUsed: '',
  skillTerms: [],
  sources: {},

  reset: () => set({
    jobs: [],
    pagination: emptyPagination(),
    allRankedJobs: [],
    rankedListKey: null,
    savedJobs: [],
    savedJobsLoaded: false,
    loading: false,
    error: null,
    lastFetched: null,
    searchQuery: '',
    queryUsed: '',
    skillTerms: [],
    sources: {},
  }),

  /** Paginate locally when we already have the ranked list for this search. */
  setPageFromCache: (page, pageSize = DEFAULT_PAGE_SIZE, filters = {}) => {
    const { allRankedJobs, rankedListKey } = get()
    if (!rankedListKey || !allRankedJobs.length) return false
    const filtered = applyJobFilters(allRankedJobs, filters)
    const { jobs, pagination } = paginateList(filtered, { page, pageSize })
    set({ jobs, pagination })
    return true
  },

  fetchJobs: async ({
    search = '',
    category = '',
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    filters = {},
    force = false,
  } = {}) => {
    const rankedKey = listCacheKey({ search, category })

    if (!force && get().rankedListKey === rankedKey && get().allRankedJobs.length > 0) {
      const filtered = applyJobFilters(get().allRankedJobs, filters)
      const { jobs, pagination } = paginateList(filtered, { page, pageSize })
      set({ jobs, pagination, loading: false, error: null })
      return { jobs, pagination, fromCache: true }
    }

    const requestKey = `${rankedKey}|${page}|${pageSize}`

    if (inflightPromise && inflightKey === requestKey) {
      return inflightPromise
    }

    if (get().rankedListKey !== rankedKey) {
      set({
        allRankedJobs: [],
        rankedListKey: null,
        jobs: [],
        loading: true,
        error: null,
        searchQuery: search,
      })
    } else {
      set({ loading: true, error: null, searchQuery: search })
    }
    inflightKey = requestKey
    inflightPromise = (async () => {
      try {
        const data = await searchJobs({
          search,
          category,
          page: 1,
          pageSize,
          includeRankedList: true,
        })

        const ranked = Array.isArray(data.rankedJobs) && data.rankedJobs.length > 0
          ? data.rankedJobs
          : (data.jobs || [])

        const filtered = applyJobFilters(ranked, filters)
        const { jobs, pagination } = paginateList(filtered, { page, pageSize })

        set({
          allRankedJobs: ranked,
          rankedListKey: rankedKey,
          jobs,
          pagination,
          queryUsed: data.queryUsed || '',
          skillTerms: data.skillTerms || [],
          sources: data.sources || {},
          loading: false,
          lastFetched: Date.now(),
        })
        return { ...data, jobs, pagination }
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
