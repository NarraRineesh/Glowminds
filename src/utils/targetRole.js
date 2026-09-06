const ROLE_STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'seeking', 'looking', 'aspiring',
  'passionate', 'motivated', 'experienced', 'results', 'driven',
  'at', 'as', 'in', 'to', 'of', 'a', 'an', 'or',
])

const ROLE_NOUNS = new Set([
  'developer', 'engineer', 'designer', 'analyst', 'scientist', 'manager',
  'intern', 'internship', 'architect', 'programmer', 'consultant',
])

const ROLE_QUALIFIERS = new Set([
  'software', 'frontend', 'front', 'backend', 'back', 'fullstack', 'full',
  'stack', 'senior', 'junior', 'staff', 'principal', 'lead', 'associate',
  'data', 'product', 'project', 'program', 'android', 'ios', 'mobile', 'web',
  'cloud', 'devops', 'sre', 'ml', 'ai', 'qa', 'sdet', 'sde', 'ui', 'ux',
  'react', 'python', 'java', 'node', 'golang', 'rust',
])

/** Longer phrases first so "front end developer" wins over "developer". */
const KNOWN_ROLES = [
  'software development engineer',
  'machine learning engineer',
  'full stack developer',
  'fullstack developer',
  'full-stack developer',
  'front end developer',
  'front-end developer',
  'frontend developer',
  'back end developer',
  'back-end developer',
  'backend developer',
  'software engineer',
  'software developer',
  'data scientist',
  'data engineer',
  'data analyst',
  'product manager',
  'project manager',
  'devops engineer',
  'android developer',
  'ios developer',
  'mobile developer',
  'ui ux designer',
  'ux designer',
  'ui developer',
  'qa engineer',
  'sde intern',
  'sde',
  'fresher internship',
]

/**
 * Insert spaces where role titles were concatenated ("developerFrontend" → "developer Frontend").
 */
export function splitConcatenatedWords(value) {
  return String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])([+#])/g, '$1$2')
    .replace(/([+#])([a-zA-Z])/g, '$1 $2')
    .replace(/[_/|·,;:]+/g, ' ')
    .replace(/[—–]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripToken(word) {
  return String(word || '').replace(/[^a-zA-Z0-9+#]/g, '')
}

function findKnownRole(text) {
  const hay = ` ${String(text || '').toLowerCase()} `
  for (const phrase of KNOWN_ROLES) {
    if (hay.includes(` ${phrase} `) || hay.includes(` ${phrase.replace(/-/g, ' ')} `)) {
      return phrase.replace(/-/g, ' ')
    }
  }
  return ''
}

function extractRoleNounPhrase(text) {
  const tokens = String(text || '').split(/\s+/).map(stripToken).filter(Boolean)
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const noun = tokens[i].toLowerCase()
    if (!ROLE_NOUNS.has(noun)) continue
    const prev = tokens[i - 1] || ''
    const prevKey = prev.toLowerCase()
    if (prev && prev.length >= 2 && !ROLE_STOP.has(prevKey)) {
      if (prev.length <= 3 && !ROLE_QUALIFIERS.has(prevKey)) {
        return noun
      }
      return `${prev} ${tokens[i]}`
    }
    return tokens[i]
  }
  return ''
}

function firstMeaningfulWords(text, maxWords = 4) {
  const words = String(text || '')
    .split(/\s+/)
    .map(stripToken)
    .filter((w) => w.length >= 2 && !ROLE_STOP.has(w.toLowerCase()))
  return words.slice(0, maxWords).join(' ').trim()
}

/**
 * Turn a messy headline / preferred-role blob into a short catalog query.
 * "Sof developer Soft developerFrontend developer" → "frontend developer"
 */
export function cleanJobSearchQuery(raw, { maxWords = 4 } = {}) {
  const spaced = splitConcatenatedWords(raw)
  if (!spaced) return ''

  const known = findKnownRole(spaced)
  if (known) return known

  const fromNoun = extractRoleNounPhrase(spaced)
  if (fromNoun) return fromNoun

  return firstMeaningfulWords(spaced, maxWords)
}

function fallbackRole(profile) {
  return profile?.isFresher || profile?.careerLevel === 'fresher'
    ? 'fresher internship'
    : 'software engineer'
}

function preferredRoleText(profile) {
  const prefs = profile?.preferences || {}
  const single = String(prefs.preferredRole || '').trim()
  if (single) return single
  if (Array.isArray(prefs.preferredRoles)) {
    return prefs.preferredRoles.map((r) => String(r || '').trim()).filter(Boolean).join(' ')
  }
  return ''
}

/**
 * Turn profile target role / headline into a short job-search query.
 * Prefers preferences.preferredRole, then a cleaned headline.
 */
export function cleanTargetRole(profile) {
  const fromPreferred = cleanJobSearchQuery(preferredRoleText(profile))
  if (fromPreferred) return fromPreferred

  const headline = String(profile?.headline || '').trim()
  if (!headline) return fallbackRole(profile)

  return cleanJobSearchQuery(headline) || fallbackRole(profile)
}

export function hasUsableProfile(profile) {
  if (!profile || typeof profile !== 'object') return false
  const technical = Array.isArray(profile.skills?.technical) ? profile.skills.technical.filter(Boolean) : []
  const location = String(profile.personal?.location || '').trim()
  const headline = String(profile.headline || '').trim()
  const experience = Array.isArray(profile.experience) ? profile.experience.filter((e) => e?.company || e?.role) : []
  return technical.length >= 3 || !!headline || !!location || experience.length > 0
}
