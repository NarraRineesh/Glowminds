/** Coerce Firestore timestamps, Date, ISO, or {seconds} into a Date. */
export function parseDate(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null
  if (typeof value?.toDate === 'function') {
    try {
      const d = value.toDate()
      return d instanceof Date && Number.isFinite(d.getTime()) ? d : null
    } catch {
      return null
    }
  }
  if (typeof value === 'object') {
    const seconds = value.seconds ?? value._seconds
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      const d = new Date(seconds * 1000)
      return Number.isFinite(d.getTime()) ? d : null
    }
  }
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d : null
}
