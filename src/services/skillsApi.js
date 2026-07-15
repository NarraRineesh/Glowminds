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

/** Free skill-gap analysis for a target role. */
export async function getSkillGap({ role = '' } = {}) {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  const qs = params.toString()
  return apiFetch(`/skills/gap${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export async function getLearningPath() {
  return apiFetch('/skills/learning-path', { method: 'GET' })
}

export async function generateLearningPath({
  targetRole,
  focusSkills,
  hoursPerWeek = 8,
  level = 'beginner',
} = {}) {
  return apiFetch('/skills/learning-path', {
    method: 'POST',
    body: { targetRole, focusSkills, hoursPerWeek, level },
  })
}

export async function updateLearningPathProgress({ itemId, done }) {
  return apiFetch('/skills/learning-path/progress', {
    method: 'PATCH',
    body: { itemId, done },
  })
}
