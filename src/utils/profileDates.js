/** Format ISO date (yyyy-mm-dd) for display in profile / resume. */
function formatIsoDate(iso) {
  if (!iso || typeof iso !== 'string') return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const dt = new Date(y, m - 1, d)
  if (Number.isNaN(dt.getTime())) return iso
  return dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' })
}

/** Human-readable range for experience / education from ISO start/end or legacy `duration` string. */
export function formatDateRange(startIso, endIso, legacyDuration) {
  if (startIso || endIso) {
    const a = formatIsoDate(startIso)
    const b = endIso ? formatIsoDate(endIso) : 'Present'
    if (a && b) return `${a} – ${b}`
    if (a) return `${a} – ${b}`
    if (b && b !== 'Present') return b
  }
  return legacyDuration || ''
}

/** Value for `<input type="month" />` from stored "2024" or "2024-03". */
export function toMonthInputValue(raw) {
  if (!raw) return ''
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}$/.test(s)) return s
  if (/^\d{4}$/.test(s)) return `${s}-01`
  return ''
}

/** Display stored year or YYYY-MM for profile cards. */
export function formatYearOrMonthDisplay(raw) {
  if (!raw) return ''
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-').map(Number)
    const dt = new Date(y, m - 1, 1)
    if (Number.isNaN(dt.getTime())) return s
    return dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }
  if (/^\d{4}$/.test(s)) return s
  return s
}
