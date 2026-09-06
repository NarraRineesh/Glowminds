import { apiFetch } from '@/services/apiClient'
import {
  getCatalogJob,
  searchJobs,
} from '@/services/jobsApi'
import { cleanJobSearchQuery } from '@/utils/targetRole'

export async function getQueryHeader() {
  const header = await apiFetch('/jobs/query-header', { method: 'GET' })
  const q = cleanJobSearchQuery(header?.q) || String(header?.q || '').trim()
  return { ...header, q }
}

/** Job board — catalog search by q + optional country / remote work mode. */
export async function searchBoardJobs({
  search = '',
  page = 1,
  pageSize = 12,
  country = '',
} = {}) {
  return searchJobs({ q: search, page, limit: pageSize, country })
}

/** @deprecated Use searchBoardJobs */
export async function searchJobsAlias(params) {
  return searchBoardJobs(params)
}

export async function getJobById(jobId) {
  return getCatalogJob(jobId)
}

/** Prefill q from query-header, then search catalog. */
export async function getTopMatches({ limit = 10 } = {}) {
  let q = ''
  try {
    const header = await getQueryHeader()
    q = cleanJobSearchQuery(header?.q) || String(header?.q || '').trim()
  } catch {
    q = ''
  }
  const data = await searchJobs({ q, page: 1, limit })
  return { ...data, queryUsed: q }
}
