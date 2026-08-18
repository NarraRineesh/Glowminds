const ROLE_STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'seeking', 'looking', 'aspiring',
  'passionate', 'motivated', 'experienced', 'results', 'driven',
])

/**
 * Turn a long profile headline into a short job-search query.
 * "B.Tech CS · aspiring SDE at Google | React, TS" → "SDE"
 */
export function cleanTargetRole(profile) {
  const headline = String(profile?.headline || '').trim()
  if (!headline) {
    return profile?.isFresher || profile?.careerLevel === 'fresher'
      ? 'fresher internship'
      : 'software engineer'
  }
  const first = headline.split(/\s*[·|,—–]\s*/)[0].trim()
  const words = first
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9+#]/g, ''))
    .filter((w) => w.length >= 2 && !ROLE_STOP.has(w.toLowerCase()))
  const role = words.slice(0, 4).join(' ').trim()
  return role || (profile?.isFresher ? 'fresher internship' : 'software engineer')
}

export function hasUsableProfile(profile) {
  if (!profile || typeof profile !== 'object') return false
  const technical = Array.isArray(profile.skills?.technical) ? profile.skills.technical.filter(Boolean) : []
  const location = String(profile.personal?.location || '').trim()
  const headline = String(profile.headline || '').trim()
  const experience = Array.isArray(profile.experience) ? profile.experience.filter((e) => e?.company || e?.role) : []
  return technical.length >= 3 || !!headline || !!location || experience.length > 0
}
