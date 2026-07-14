/** Profile must include skills before Best Match / Top Matches run. */
export function profileReadyForJobMatches(profile) {
  const technical = Array.isArray(profile?.skills?.technical)
    ? profile.skills.technical.map((s) => String(s).trim()).filter(Boolean)
    : []
  if (technical.length > 0) return true
  if (Array.isArray(profile?.skills)) {
    return profile.skills.map((s) => String(s).trim()).filter(Boolean).length > 0
  }
  return false
}
