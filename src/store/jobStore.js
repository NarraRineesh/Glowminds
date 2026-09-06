import { create } from 'zustand'
import { searchBoardJobs, getTopMatches } from '@/services/jobSearch'
import { setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { auth } from '@/services/firebase'
import { savedJobRef, loadSavedJobs } from '@/utils/firestoreCollections'
import { formatCompanyDisplayName } from '@/utils/companyName'
import { filterJobTags } from '@/utils/jobFilters'

function normalizeJob(job) {
  if (!job) return job
  const company = formatCompanyDisplayName(job.company || job.co || '')
  return {
    ...job,
    company,
    co: company,
  }
}

function buildJobSnapshot(job) {
  const company = formatCompanyDisplayName(job.company || job.co || '')
  return {
    id: job.id,
    title: job.title || '',
    company,
    logo: job.logo || 'jobs',
    location: job.location || job.loc || '',
    country: job.country || '',
    remote: !!job.remote,
    type: job.type || '',
    salary: job.salary || job.sal || '',
    description: job.description || job.desc || '',
    tags: filterJobTags(Array.isArray(job.tags) ? job.tags : []),
    url: job.url || '',
    publishedAt: job.publishedAt || null,
    source: job.source || 'ats',
  }
}

const FETCH_FRESHNESS_MS = 60_000
const DEFAULT_PAGE_SIZE = 12

const emptyPagination = () => ({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasMore: false,
  nextCursor: null,
  from: 0,
  to: 0,
  totalExact: true,
})

function requestCacheKey({ search = '', page = 1, pageSize = DEFAULT_PAGE_SIZE, country = '' } = {}) {
  return `${String(search).trim().toLowerCase()}|${String(country || '').trim()}|${page}|${pageSize}`
}

let inflightPromise = null
let inflightKey = null
let topMatchesInflight = null
let topMatchesInflightKey = null

const useJobStore = create((set, get) => ({
  jobs: [],
  pagination: emptyPagination(),
  topMatches: [],
  topMatchesLoading: false,
  topMatchesQueryUsed: '',
  topMatchesError: null,
  topMatchesLastFetched: null,
  topMatchesRequestKey: null,
  savedJobs: [],
  savedJobsLoaded: false,
  loading: false,
  error: null,
  lastFetched: null,
  lastRequestKey: null,
  searchQuery: '',
  queryUsed: '',

  reset: () => set({
    jobs: [],
    pagination: emptyPagination(),
    topMatches: [],
    topMatchesLoading: false,
    topMatchesQueryUsed: '',
    topMatchesError: null,
    topMatchesLastFetched: null,
    topMatchesRequestKey: null,
    savedJobs: [],
    savedJobsLoaded: false,
    loading: false,
    error: null,
    lastFetched: null,
    lastRequestKey: null,
    searchQuery: '',
    queryUsed: '',
  }),

  fetchJobs: async ({
    search = '',
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    country = '',
    force = false,
  } = {}) => {
    const safePage = Math.max(1, Math.trunc(page) || 1)
    const requestKey = requestCacheKey({ search, page: safePage, pageSize, country })

    if (
      !force
      && get().lastRequestKey === requestKey
      && get().lastFetched
      && Date.now() - get().lastFetched < FETCH_FRESHNESS_MS
    ) {
      return { jobs: get().jobs, pagination: get().pagination, fromCache: true }
    }

    if (inflightPromise && inflightKey === requestKey) {
      return inflightPromise
    }

    set({ loading: true, error: null, searchQuery: search })
    inflightKey = requestKey
    inflightPromise = (async () => {
      try {
        const data = await searchBoardJobs({
          search,
          page: safePage,
          pageSize,
          country,
        })
        set({
          jobs: (data.jobs || []).map(normalizeJob),
          pagination: data.pagination || emptyPagination(),
          queryUsed: data.queryUsed || search,
          loading: false,
          lastFetched: Date.now(),
          lastRequestKey: requestKey,
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

  fetchTopMatches: async ({ limit = 10, force = false } = {}) => {
    const requestKey = `top|${limit}`
    if (
      !force
      && get().topMatchesRequestKey === requestKey
      && get().topMatches.length > 0
      && get().topMatchesLastFetched
      && Date.now() - get().topMatchesLastFetched < FETCH_FRESHNESS_MS
    ) {
      return { jobs: get().topMatches, fromCache: true }
    }

    if (!force && topMatchesInflight && topMatchesInflightKey === requestKey) {
      return topMatchesInflight
    }

    set({ topMatchesLoading: true, topMatchesError: null })
    topMatchesInflightKey = requestKey
    topMatchesInflight = (async () => {
      try {
        const data = await getTopMatches({ limit })
        set({
          topMatches: (data.jobs || []).map(normalizeJob),
          topMatchesQueryUsed: data.queryUsed || '',
          topMatchesLoading: false,
          topMatchesError: null,
          topMatchesLastFetched: Date.now(),
          topMatchesRequestKey: requestKey,
        })
        return data
      } catch (err) {
        console.error('Top matches fetch failed:', err)
        set({
          topMatchesLoading: false,
          topMatchesError: err.message || 'Failed to load top matches',
        })
        throw err
      } finally {
        topMatchesInflight = null
        topMatchesInflightKey = null
      }
    })()
    return topMatchesInflight
  },

  saveJob: async (job) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const snapshot = buildJobSnapshot(job)
    try {
      await setDoc(savedJobRef(uid, snapshot.id), {
        ...snapshot,
        userId: uid,
        jobId: snapshot.id,
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
      await deleteDoc(savedJobRef(uid, jobId))
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
      const saved = await loadSavedJobs(uid)
      set({ savedJobs: (saved || []).map(normalizeJob), savedJobsLoaded: true })
    } catch (err) {
      console.error('Load saved jobs failed:', err)
    }
  },
}))

export default useJobStore
