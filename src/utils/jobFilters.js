/** Drop ATS junk: domain-looking "companies" and single-letter skills like "R". */
export function isJunkLabel(value) {
  const t = String(value || '').trim()
  if (!t || t.length < 2) return true
  if (/^[a-z]$/i.test(t)) return true
  if (/\.(com|io|net|org|cloud)$/i.test(t)) return true
  if (/oraclecloud/i.test(t)) return true
  if (/^www\./i.test(t)) return true
  return false
}

export function filterJobTags(tags) {
  if (!Array.isArray(tags)) return []
  return tags.map((t) => String(t).trim()).filter((t) => t && !isJunkLabel(t))
}

const JOB_COUNTRY_STORAGE_KEY = 'gm_jobs_country'

/** Country filter values. Catalog search uses `country=` (full name) or `work_mode=remote`. */
export const JOB_COUNTRY_OPTIONS = [
  { value: '', label: 'All countries' },
  { value: 'India', label: 'India' },
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Australia', label: 'Australia' },
  { value: 'UAE', label: 'UAE' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Remote', label: 'Remote' },
]

/** Catalog `/v1/jobs` expects these exact `country` strings (not ISO codes). */
export const CATALOG_COUNTRY_NAME = {
  UAE: 'United Arab Emirates',
}

const ISO_CODES_BY_COUNTRY = {
  India: ['in', 'ind'],
  'United States': ['us', 'usa'],
  'United Kingdom': ['gb', 'uk'],
  Canada: ['ca'],
  Germany: ['de'],
  Singapore: ['sg'],
  Australia: ['au'],
  UAE: ['ae'],
  Netherlands: ['nl'],
  Ireland: ['ie'],
}

const COUNTRY_ALIASES = {
  India: ['india', 'bharat', 'bengaluru', 'bangalore', 'banglore', 'hyderabad', 'mumbai', 'delhi', 'new delhi', 'pune', 'chennai', 'noida', 'gurgaon', 'gurugram', 'kolkata', 'ahmedabad', 'kochi', 'jaipur'],
  'United States': ['united states', 'usa', 'u.s.', 'u.s.a', 'america', 'united states of america'],
  'United Kingdom': ['united kingdom', 'uk', 'u.k.', 'england', 'britain', 'great britain', 'scotland', 'wales'],
  Canada: ['canada'],
  Germany: ['germany', 'deutschland'],
  Singapore: ['singapore'],
  Australia: ['australia'],
  UAE: ['uae', 'u.a.e', 'united arab emirates', 'dubai', 'abu dhabi'],
  Netherlands: ['netherlands', 'holland'],
  Ireland: ['ireland'],
  Remote: ['remote', 'anywhere', 'worldwide', 'work from home', 'wfh'],
}

function normalizeLocation(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\bbanglore\b/g, 'bangalore')
}

function mentionsAlias(text, aliases) {
  const loc = normalizeLocation(text)
  if (!loc) return false
  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(?:^|[^a-z])${escaped}(?:[^a-z]|$)`).test(loc)
  })
}

export function matchCountryFromText(text) {
  const loc = normalizeLocation(text)
  if (!loc) return ''
  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (country === 'Remote') continue
    if (mentionsAlias(loc, aliases)) return country
  }
  if (mentionsAlias(loc, COUNTRY_ALIASES.Remote)) return 'Remote'
  return ''
}

export function inferCountryFromProfile(profile) {
  const candidates = [
    profile?.personal?.location,
    ...(Array.isArray(profile?.preferences?.preferredLocations)
      ? profile.preferences.preferredLocations
      : []),
  ]
  for (const candidate of candidates) {
    const country = matchCountryFromText(candidate)
    if (country) return country
  }
  return 'India'
}

export function readStoredJobCountry() {
  try {
    const value = localStorage.getItem(JOB_COUNTRY_STORAGE_KEY)
    return value == null ? null : value
  } catch {
    return null
  }
}

export function persistJobCountry(value) {
  try {
    localStorage.setItem(JOB_COUNTRY_STORAGE_KEY, String(value ?? ''))
  } catch {
    /* ignore quota / private mode */
  }
}

function mentionsOtherCountry(locationText, selected) {
  const loc = normalizeLocation(locationText)
  if (!loc) return false
  return Object.entries(COUNTRY_ALIASES).some(([country, aliases]) => {
    if (country === selected || country === 'Remote') return false
    return aliases.some((alias) => loc.includes(alias))
  })
}

export function catalogCountryName(country) {
  if (!country || country === 'Remote') return ''
  return CATALOG_COUNTRY_NAME[country] || country
}

/** Query params for `GET /v1/jobs`. Remote is a work mode, not a country name. */
export function catalogSearchParams(country) {
  if (!country) return {}
  if (country === 'Remote') return { work_mode: 'remote' }
  return { country: catalogCountryName(country) }
}

function countryFieldMatches(jobCountry, selected) {
  const n = normalizeLocation(jobCountry)
  if (!n || !selected) return false
  if (n === normalizeLocation(selected)) return true
  if (n === normalizeLocation(catalogCountryName(selected))) return true
  return (ISO_CODES_BY_COUNTRY[selected] || []).includes(n)
}

function locationHasIsoCode(locationText, selected) {
  const loc = String(locationText || '').trim()
  const codes = ISO_CODES_BY_COUNTRY[selected] || []
  if (!loc || !codes.length) return false
  return codes.some((code) => {
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Only treat ISO codes as country when they stand alone or follow a comma
    // so "in" does not match "Indiana" / "remote in Texas".
    return new RegExp(`(?:^|,\\s*)${escaped}\\s*$`, 'i').test(loc)
  })
}

/**
 * Client-side country match for Saved (and as a safety net).
 * Browse search sends `country` / `work_mode` to the catalog and trusts the response.
 */
export function jobMatchesCountry(job, country) {
  if (!country) return true
  const loc = job?.location || job?.loc || ''
  const remote = !!job?.remote || mentionsAlias(loc, COUNTRY_ALIASES.Remote)

  if (country === 'Remote') return remote

  if (countryFieldMatches(job?.country, country)) return true
  if (job?.country && !countryFieldMatches(job.country, country)) return false
  if (locationHasIsoCode(loc, country)) return true

  const aliases = COUNTRY_ALIASES[country] || [normalizeLocation(country)]
  if (mentionsAlias(loc, aliases)) return true

  // India-first catalog: unlabeled jobs and remotes that don't name another country count as India.
  if (country === 'India') {
    if (!normalizeLocation(loc) && !normalizeLocation(job?.country)) return true
    if (remote && !mentionsOtherCountry(loc, 'India')) return true
  }

  return false
}
