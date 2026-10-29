/** Normalize API skill entries (string | { name }) to a display label. */
export function skillLabel(skill) {
  if (skill == null) return ''
  if (typeof skill === 'string') return skill
  return String(skill.name || skill.skill || skill.skill_name || '').trim()
}

export function skillKey(skill, index = 0) {
  return skillLabel(skill) || `skill-${index}`
}
