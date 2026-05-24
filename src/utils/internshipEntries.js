import { formatDateRange } from '@/utils/profileDates'

function newInternshipId() {
  return Math.random().toString(36).slice(2, 11)
}

export function createEmptyInternshipEntry() {
  return {
    id: newInternshipId(),
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    duration: '',
    description: '',
    bullets: '',
  }
}

export function internshipHasContent(entry) {
  return !!(entry?.company?.trim() || entry?.role?.trim())
}

export function normalizeInternshipList(profile) {
  const raw = profile?.internships
  if (!Array.isArray(raw)) return []
  return raw.map((e) => ({
    ...createEmptyInternshipEntry(),
    ...e,
    id: e.id || newInternshipId(),
  }))
}

export function sortInternshipEntries(list) {
  return [...list].sort((a, b) => {
    const endA = a.endDate || a.startDate || ''
    const endB = b.endDate || b.startDate || ''
    if (endA !== endB) return String(endB).localeCompare(String(endA))
    return String(b.startDate || '').localeCompare(String(a.startDate || ''))
  })
}

export function internshipEntrySubtitle(entry) {
  const parts = []
  if (entry.role?.trim()) parts.push(entry.role.trim())
  const range = formatDateRange(entry.startDate, entry.endDate, entry.duration || '')
  if (range) parts.push(range)
  return parts.join(' · ')
}

export function finalizeInternshipEntry(form) {
  const startDate = form.startDate || ''
  const endDate = form.endDate || ''
  return {
    ...form,
    id: form.id || newInternshipId(),
    company: String(form.company || '').trim(),
    role: String(form.role || '').trim(),
    startDate,
    endDate,
    duration: formatDateRange(startDate, endDate, form.duration || ''),
    description: String(form.description || '').trim(),
    bullets: String(form.bullets || '').trim(),
  }
}

export function internshipEntryPreview(entry, maxLen = 100) {
  const raw = [entry?.description, entry?.bullets].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  if (!raw) return ''
  if (raw.length <= maxLen) return raw
  return `${raw.slice(0, maxLen).trim()}…`
}

export function internshipHasDetails(entry) {
  return !!(entry?.description?.trim() || entry?.bullets?.trim())
}
