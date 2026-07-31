import { apiFetch } from '@/services/apiClient'
import { dedupeAsync } from '@/utils/dedupeAsync'

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
  const qs = params.toString()
  return dedupeAsync(`skills/trends|${qs}`, () =>
    apiFetch(`/skills/trends?${qs}`, { method: 'GET' }),
  )
}

/** Free skill-gap analysis for a target role. */
export async function getSkillGap({ role = '' } = {}) {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  const qs = params.toString()
  return dedupeAsync(`skills/gap|${qs}`, () =>
    apiFetch(`/skills/gap${qs ? `?${qs}` : ''}`, { method: 'GET' }),
  )
}

/**
 * Queue skills not in the skill DB for the next enrich run.
 * Safe to call fire-and-forget after profile skill save.
 */
export async function reportUnknownSkills(skills = []) {
  const list = (Array.isArray(skills) ? skills : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
  if (!list.length) return { queued: 0, unknown: [] }
  return apiFetch('/skills/unknown', {
    method: 'POST',
    body: { skills: list },
  })
}

export async function getLearningPath() {
  return dedupeAsync('skills/learning-path', () =>
    apiFetch('/skills/learning-path', { method: 'GET' }),
  )
}

export async function getLearningPathHistory({ limit = 20 } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  const qs = params.toString()
  return dedupeAsync(`skills/learning-path/history|${qs}`, () =>
    apiFetch(`/skills/learning-path/history?${qs}`, { method: 'GET' }),
  )
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

export async function resumeLearningPath(pathId) {
  return apiFetch(`/skills/learning-path/${encodeURIComponent(pathId)}/resume`, {
    method: 'POST',
  })
}

export async function deleteLearningPath(pathId) {
  return apiFetch(`/skills/learning-path/${encodeURIComponent(pathId)}`, {
    method: 'DELETE',
  })
}
