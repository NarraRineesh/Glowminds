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

/**
 * Dashboard "top matches". Callers should pass the profile query.
 * An empty q used to hit /jobs/query-header, which fills "software"
 * when no headline is saved.
 */
export async function getTopMatches({ limit = 10, q = '', country = '' } = {}) {
  let query = cleanJobSearchQuery(q) || String(q || '').trim()
  if (!query) {
    try {
      const header = await getQueryHeader()
      query = cleanJobSearchQuery(header?.q) || String(header?.q || '').trim()
    } catch {
      query = ''
    }
    // Server fills "software" when the profile has no headline.
    if (!query || /^software$/i.test(query)) query = 'intern'
  }
  const data = await searchJobs({ q: query, page: 1, limit, country })
  return { ...data, queryUsed: query }
}
