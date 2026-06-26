import { apiFetch } from '@/services/apiClient'

/** Autocomplete skills from Supabase skill intelligence DB. */
export async function searchSkills(query, limit = 10) {
  const params = new URLSearchParams()
  params.set('q', query)
  if (limit) params.set('limit', String(limit))
  return apiFetch(`/skills/search?${params.toString()}`, { method: 'GET' })
}

/** Top demanded or fastest-growing skills for dashboard. */
export async function getSkillTrends({ limit = 8, mode = 'demand' } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (mode) params.set('mode', mode)
  return apiFetch(`/skills/trends?${params.toString()}`, { method: 'GET' })
}
