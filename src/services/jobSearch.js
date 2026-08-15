import { apiFetch } from '@/services/apiClient'
import {
  getCatalogJob,
  searchJobs,
} from '@/services/jobsApi'

export async function getQueryHeader() {
  return apiFetch('/jobs/query-header', { method: 'GET' })
}

/** Job board — catalog search by q only. */
export async function searchBoardJobs({
  search = '',
  page = 1,
  pageSize = 12,
} = {}) {
  return searchJobs({ q: search, page, limit: pageSize })
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
    q = String(header?.q || '').trim()
  } catch {
    q = ''
  }
  const data = await searchJobs({ q, page: 1, limit })
  return { ...data, queryUsed: q }
}
