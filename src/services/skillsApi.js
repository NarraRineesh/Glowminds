import { apiFetch } from '@/services/apiClient'
import { dedupeAsync } from '@/utils/dedupeAsync'
import { searchCatalogSkills, getTrendingSkills } from '@/services/jobsApi'

/** Autocomplete skills from the jobs catalog. */
export async function searchSkills(query, limit = 10) {
  const items = await searchCatalogSkills(query, limit)
  return {
    skills: items.map((row) => ({
      id: row.id || row.normalized_name || row.name,
      name: row.name || row.normalized_name || '',
      jobCount: row.active_job_count || 0,
    })),
    query,
  }
}

/** Top demanded skills from the jobs catalog. */
export async function getSkillTrends({ limit = 8 } = {}) {
  return dedupeAsync(`skills/trends|${limit}`, async () => {
    const items = await getTrendingSkills({ limit })
    return {
      trends: items.map((row) => ({
        name: row.skill_name || row.name,
        jobCount: row.active_job_count || 0,
        growth: '',
        importanceScore: 50,
        category: 'Catalog',
      })),
      mode: 'demand',
      domain: { label: 'Catalog', categories: [] },
    }
  })
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

export async function reportUnknownSkills() {
  return { queued: 0, unknown: [] }
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
