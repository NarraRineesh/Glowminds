import { formatDateRange } from '@/utils/profileDates'

function newExperienceId() {
  return Math.random().toString(36).slice(2, 11)
}

export function createEmptyExperienceEntry() {
  return {
    id: newExperienceId(),
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    duration: '',
    description: '',
    bullets: '',
  }
}

export function entryHasContent(entry) {
  return !!(entry?.company?.trim() || entry?.role?.trim())
}

export function normalizeExperienceList(profile) {
  const raw = profile?.experience
  if (!Array.isArray(raw)) return []
  return raw.map((e) => ({
    ...createEmptyExperienceEntry(),
    ...e,
    id: e.id || newExperienceId(),
  }))
}

/** Most recent roles first (by end date, then start). */
export function sortExperienceEntries(list) {
  return [...list].sort((a, b) => {
    const endA = a.endDate || a.startDate || ''
    const endB = b.endDate || b.startDate || ''
    if (endA !== endB) return String(endB).localeCompare(String(endA))
    return String(b.startDate || '').localeCompare(String(a.startDate || ''))
  })
}

export function experienceEntrySubtitle(entry) {
  const parts = []
  if (entry.role?.trim()) parts.push(entry.role.trim())
  const range = formatDateRange(entry.startDate, entry.endDate, entry.duration || '')
  if (range) parts.push(range)
  return parts.join(' · ')
}

export function finalizeExperienceEntry(form) {
  const startDate = form.startDate || ''
  const endDate = form.endDate || ''
  return {
    ...form,
    id: form.id || newExperienceId(),
    company: String(form.company || '').trim(),
    role: String(form.role || '').trim(),
    startDate,
    endDate,
    duration: formatDateRange(startDate, endDate, form.duration || ''),
    description: String(form.description || '').trim(),
    bullets: String(form.bullets || '').trim(),
  }
}

export function profileHasExperience(profile) {
  if (profile?.isFresher) return true
  return normalizeExperienceList(profile).some(entryHasContent)
}

/** One-line teaser for compact list cards (max ~100 chars). */
export function experienceEntryPreview(entry, maxLen = 100) {
  const raw = [entry?.description, entry?.bullets].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  if (!raw) return ''
  if (raw.length <= maxLen) return raw
  return `${raw.slice(0, maxLen).trim()}…`
}

export function experienceHasDetails(entry) {
  return !!(entry?.description?.trim() || entry?.bullets?.trim())
}
