import { apiFetch } from '@/services/apiClient'

/**
 * Backend job search. Reads `ACTIVE` jobs from Firestore (`jobs/`) populated
 * by the sync worker — no external job-board APIs are called. Match scores
 * use the user's Firestore profile skills.
 */
export async function searchJobs({
  search = '',
  category = '',
  limit = 30,
  useProfile = true,
} = {}) {
  return apiFetch('/jobs/search', {
    body: { search, category, limit, useProfile },
  })
}

/**
 * Returns the top N jobs ranked by match score against the caller's profile.
 * Defaults to 5 (max 25). Same Firestore-only data path as /jobs/search.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.limit=5]   1..25
 * @param {string}  [opts.category]  optional role filter (e.g. "data", "frontend")
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
 * Returns the count of jobs that would match `searchJobs` with the same
 * params — runs the same Firestore + in-memory filter pipeline but skips
 * scoring/sorting and only ships the size.
 *
 * `count` is capped server-side; `saturated: true` means the true number
 * could be higher and the value should be treated as a lower bound.
 *
 * @param {object}  [opts]
 * @param {string}  [opts.search]              free-text override (else profile-derived query is used)
 * @param {string}  [opts.category]            role filter (e.g. "data", "frontend")
 * @param {boolean} [opts.useProfile=true]     when false, ignore profile and use `search` only
 * @returns {Promise<{
 *   count: number,
 *   saturated: boolean,
 *   queryUsed: string,
 *   locationUsed: string,
 *   category: string|null,
 *   sources: { firestore: number },
 *   partialErrors?: string[],
 * }>}
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
