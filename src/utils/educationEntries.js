import { buildDegreeLabel, EDUCATION_LEVELS } from '@/constants/educationCatalog'

function newEducationId() {
  return Math.random().toString(36).slice(2, 11)
}

export function createEmptyEducationEntry() {
  return {
    id: newEducationId(),
    educationLevel: '',
    course: '',
    courseOther: '',
    specialization: '',
    specializationOther: '',
    college: '',
    board: '',
    stream: '',
    educationStart: '',
    educationEnd: '',
    courseType: '',
    gradingSystem: '',
    marks: '',
    primaryGraduation: false,
    degree: '',
  }
}

const LEVEL_SORT = {
  class10: 0,
  class12: 1,
  diploma: 2,
  bachelors: 3,
  masters: 4,
  phd: 5,
}

function educationLevelLabel(levelId) {
  return EDUCATION_LEVELS.find((l) => l.id === levelId)?.label || levelId || ''
}

export function isSchoolLevel(levelId) {
  return levelId === 'class10' || levelId === 'class12'
}

export function entryHasContent(entry) {
  if (!entry) return false
  if (isSchoolLevel(entry.educationLevel)) {
    return !!(entry.college?.trim() || entry.board?.trim() || entry.marks?.trim())
  }
  return !!(
    entry.educationLevel
    && (entry.course?.trim() || entry.degree?.trim())
    && entry.college?.trim()
  )
}

export function sortEducationEntries(list) {
  return [...list].sort((a, b) => {
    const oa = LEVEL_SORT[a.educationLevel] ?? 99
    const ob = LEVEL_SORT[b.educationLevel] ?? 99
    if (oa !== ob) return oa - ob
    return String(b.educationEnd || '').localeCompare(String(a.educationEnd || ''))
  })
}

/** Normalize profile.educationList (or a raw array) to the canonical entry shape. */
export function normalizeEducationList(source) {
  const raw = Array.isArray(source)
    ? source
    : (Array.isArray(source?.educationList) ? source.educationList : [])
  return raw.map((e) => ({
    ...createEmptyEducationEntry(),
    ...e,
    id: e.id || newEducationId(),
  }))
}

export function getPrimaryEducationEntry(list) {
  if (!list?.length) return null
  return list.find((e) => e.primaryGraduation && !isSchoolLevel(e.educationLevel))
    || list.find((e) => !isSchoolLevel(e.educationLevel) && entryHasContent(e))
    || list[0]
}

export function educationEntryTitle(entry) {
  if (!entry) return ''
  if (entry.degree?.trim()) return entry.degree.trim()
  if (isSchoolLevel(entry.educationLevel)) {
    return educationLevelLabel(entry.educationLevel)
  }
  const course = entry.course === 'Other' ? entry.courseOther : entry.course
  const spec = entry.specialization === 'Other' ? entry.specializationOther : entry.specialization
  return buildDegreeLabel(course, spec, '') || educationLevelLabel(entry.educationLevel)
}

export function educationEntrySubtitle(entry) {
  const parts = []
  const place = entry.college?.trim()
  if (place) parts.push(place)
  if (entry.board?.trim() && isSchoolLevel(entry.educationLevel)) {
    parts.push(entry.board.trim())
  }
  if (entry.stream?.trim() && entry.educationLevel === 'class12') {
    parts.push(entry.stream.trim())
  }
  return parts.join(' · ')
}

/** One-line primary degree for cover letters, job cards, etc. */
export function formatPrimaryEducationSummary(profile) {
  const list = sortEducationEntries(normalizeEducationList(profile))
  const primary = getPrimaryEducationEntry(list)
  if (!primary || !entryHasContent(primary)) return ''
  const degree = educationEntryTitle(primary)
  const college = primary.college?.trim()
  if (degree && college) return `${degree} from ${college}`
  return degree || college
}

export function finalizeEducationEntry(form) {
  const courseFinal = form.course === 'Other' ? (form.courseOther || '').trim() : (form.course || '').trim()
  const specFinal = form.specialization === 'Other'
    ? (form.specializationOther || '').trim()
    : (form.specialization || '').trim()

  let degree = form.degree || ''
  if (!isSchoolLevel(form.educationLevel)) {
    degree = buildDegreeLabel(courseFinal, specFinal, degree)
  } else if (!degree) {
    degree = educationLevelLabel(form.educationLevel)
  }

  return {
    ...form,
    id: form.id || newEducationId(),
    course: courseFinal || form.course,
    specialization: specFinal,
    degree,
    primaryGraduation: isSchoolLevel(form.educationLevel) ? false : !!form.primaryGraduation,
  }
}

export function profileHasEducation(profile) {
  const list = normalizeEducationList(profile)
  return list.some(entryHasContent)
}
