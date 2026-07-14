import { apiFetch } from '@/services/apiClient'

/** Job board — browse/search; pageSize docs + count per page. No profile merge. */
export async function searchBoardJobs({
  search = '',
  category = '',
  page = 1,
  pageSize = 12,
  cursor = null,
  filters = {},
} = {}) {
  return apiFetch('/jobs/board', {
    body: {
      search,
      category,
      page,
      pageSize,
      cursor,
      filters,
    },
  })
}

/** @deprecated Use searchBoardJobs */
export async function searchJobs(params) {
  return searchBoardJobs(params)
}

/** Fetch a single job by Firestore document id. */
export async function getJobById(jobId) {
  const params = new URLSearchParams()
  params.set('jobId', jobId)
  return apiFetch(`/jobs/detail?${params.toString()}`, { method: 'GET' })
}

/** Profile top matches — dual skills + title Firestore queries, ranked top N. */
export async function getTopMatches({ limit = 10, category = '' } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (category) params.set('category', category)
  const qs = params.toString()
  return apiFetch(`/jobs/top-matches${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  })
}

/** Count jobs matching the board query (Firestore aggregation). */
export async function getJobsCount({ search = '', category = '' } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (category) params.set('category', category)
  const qs = params.toString()
  return apiFetch(`/jobs/count${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  })
}
