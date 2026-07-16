import { apiFetch } from '@/services/apiClient'
import { formatCompanyDisplayName } from '@/utils/companyName'

function normalizeJobCompany(job) {
  if (!job) return job
  const company = formatCompanyDisplayName(job.company || job.co || '')
  return { ...job, company, co: company }
}

function withNormalizedJobs(data) {
  if (!data) return data
  const out = { ...data }
  if (Array.isArray(data.jobs)) out.jobs = data.jobs.map(normalizeJobCompany)
  if (data.job) out.job = normalizeJobCompany(data.job)
  return out
}

/** Job board — browse/search; pageSize docs + count per page. No profile merge. */
export async function searchBoardJobs({
  search = '',
  category = '',
  page = 1,
  pageSize = 12,
  cursor = null,
  filters = {},
} = {}) {
  const data = await apiFetch('/jobs/board', {
    body: {
      search,
      category,
      page,
      pageSize,
      cursor,
      filters,
    },
  })
  return withNormalizedJobs(data)
}

/** @deprecated Use searchBoardJobs */
export async function searchJobs(params) {
  return searchBoardJobs(params)
}

/** Fetch a single job by Firestore document id. */
export async function getJobById(jobId) {
  const params = new URLSearchParams()
  params.set('jobId', jobId)
  const data = await apiFetch(`/jobs/detail?${params.toString()}`, { method: 'GET' })
  return withNormalizedJobs(data)
}

/** Profile top matches — dual skills + title Firestore queries, ranked top N. */
export async function getTopMatches({ limit = 10, category = '' } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (category) params.set('category', category)
  const qs = params.toString()
  const data = await apiFetch(`/jobs/top-matches${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  })
  return withNormalizedJobs(data)
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
