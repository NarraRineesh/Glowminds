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
