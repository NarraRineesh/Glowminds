function newProjectId() {
  return Math.random().toString(36).slice(2, 11)
}

export function createEmptyProjectEntry() {
  return {
    id: newProjectId(),
    title: '',
    tech: '',
    description: '',
    url: '',
  }
}

export function projectHasContent(entry) {
  return !!entry?.title?.trim()
}

export function normalizeProjectList(profile) {
  const raw = profile?.projects
  if (!Array.isArray(raw)) return []
  return raw.map((e) => ({
    ...createEmptyProjectEntry(),
    ...e,
    id: e.id || newProjectId(),
    title: e.title || '',
    tech: e.tech || '',
    description: e.description || e.desc || '',
    url: e.url || '',
  }))
}

/** Alphabetical by title for stable display. */
export function sortProjectEntries(list) {
  return [...list].sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
}

export function projectEntrySubtitle(entry) {
  return entry.tech?.trim() || ''
}

export function finalizeProjectEntry(form) {
  return {
    ...form,
    id: form.id || newProjectId(),
    title: String(form.title || '').trim(),
    tech: String(form.tech || '').trim(),
    description: String(form.description || '').trim(),
    url: String(form.url || '').trim(),
  }
}

export function projectEntryPreview(entry, maxLen = 100) {
  const raw = String(entry?.description || '').replace(/\s+/g, ' ').trim()
  if (!raw) return ''
  if (raw.length <= maxLen) return raw
  return `${raw.slice(0, maxLen).trim()}…`
}

export function projectHasDetails(entry) {
  return !!String(entry?.description || '').trim()
}
