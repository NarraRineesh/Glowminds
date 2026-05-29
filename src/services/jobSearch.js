import { apiFetch } from '@/services/apiClient'

/**
 * Backend job search. Reads `ACTIVE` jobs from Firestore (`jobs/`) populated
 * by the sync worker — no external job-board APIs are called. Match scores
 * use the user's Firestore profile skills.
 */
export async function searchJobs({
  search = '',
  category = '',
  page = 1,
  pageSize = 10,
  useProfile = true,
  filters = {},
} = {}) {
  const trimmed = String(search || '').trim()
  return apiFetch('/jobs/search', {
    body: {
      search,
      category,
      page,
      pageSize,
      useProfile: trimmed ? false : useProfile,
      filters,
    },
  })
}

/** Fetch a single job by Firestore document id. */
export async function getJobById(jobId) {
  const params = new URLSearchParams()
  params.set('jobId', jobId)
  return apiFetch(`/jobs/detail?${params.toString()}`, { method: 'GET' })
}

/**
 * Returns the top N jobs ranked by match score against the caller's profile.
 */
export async function getTopMatches({ limit = 5, category = '' } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (category) params.set('category', category)
  const qs = params.toString()
  return apiFetch(`/jobs/top-matches${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  })
}

/**
 * Returns the count of jobs that would match `searchJobs` with the same params.
 */
export async function getJobsCount({
  search = '',
  category = '',
  useProfile = true,
} = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (category) params.set('category', category)
  if (useProfile === false) params.set('useProfile', 'false')
  const qs = params.toString()
  return apiFetch(`/jobs/count${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  })
}
