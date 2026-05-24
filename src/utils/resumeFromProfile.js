import { SECTION_TYPES, LAYOUTS } from '@/constants/resumeTemplates'
import {
  RESUME_SECTION_PROFILE_KEYS,
  buildResumeProfileSnapshot,
} from '@/constants/resumeProfileSchema'
import { formatDateRange, formatYearOrMonthDisplay } from '@/utils/profileDates'
import {
  sortEducationEntries,
  entryHasContent as educationEntryHasContent,
  educationEntryTitle,
  educationEntrySubtitle,
} from '@/utils/educationEntries'

const SECTION_ID_ALIASES = {
  summary: ['summary'],
  skills: ['skills'],
  experience: ['experience', 'cx-leadership', 'work-experience'],
  internships: ['internships', 'internship'],
  projects: ['projects', 'my-projects'],
  education: ['education'],
  certifications: ['certifications', 'certs', 'certification'],
}

function sectionMeta(profileKey) {
  return profileKey ? { profileKey } : {}
}

/** True when the profile snapshot has meaningful resume data. */
export function profileHasResumeData(authUser, profile, userDoc) {
  if (!profile || typeof profile !== 'object') return false
  if (profile.summary?.trim() || profile.headline?.trim()) return true
  if (profile.skills?.technical?.length || profile.skills?.soft?.length) return true
  if ((profile.experience || []).some((e) => e?.company?.trim() || e?.role?.trim())) return true
  if ((profile.projects || []).some((p) => p?.title?.trim())) return true
  if ((profile.educationList || []).some(educationEntryHasContent)) return true

  const snap = buildResumeProfileSnapshot(authUser, profile, userDoc)
  if (snap.displayName && snap.displayName !== 'User') return true
  if (snap.headline?.trim() || snap.summary?.trim()) return true
  if (snap.personal?.phone?.trim() || snap.personal?.location?.trim()) return true
  if (snap.links?.linkedin?.trim() || snap.links?.github?.trim() || snap.links?.portfolio?.trim()) return true
  if (snap.skills.technical.length || snap.skills.soft.length) return true
  if (!snap.isFresher && snap.experience.some((e) => e?.company?.trim() || e?.role?.trim())) return true
  if (snap.internships.some((e) => e?.company?.trim() || e?.role?.trim())) return true
  if (snap.projects.some((p) => p?.title?.trim())) return true
  if (snap.certifications.some((c) => c?.name?.trim())) return true
  if (snap.educationList.some(educationEntryHasContent)) return true
  return false
}

function parseBulletLines(raw) {
  if (Array.isArray(raw)) {
    return raw.map((b) => String(b).replace(/^[-•·*]\s*/, '').trim()).filter(Boolean)
  }
  return String(raw || '')
    .split(/\n+/)
    .map((b) => b.replace(/^[-•·*]\s*/, '').trim())
    .filter(Boolean)
}

/** Map profile experience / internship entry → resume experience item (+ profile fields for round-trip). */
function mapRoleItem(entry) {
  const bulletLines = parseBulletLines(entry.bullets)
  const descLines = parseBulletLines(entry.description)
  return {
    id: entry.id || '',
    company: entry.company || '',
    role: entry.role || '',
    startDate: entry.startDate || '',
    endDate: entry.endDate || '',
    duration: entry.duration || '',
    dates: formatDateRange(entry.startDate, entry.endDate, entry.duration || ''),
    location: entry.location || '',
    description: entry.description || '',
    bullets: [...descLines, ...bulletLines],
  }
}

function formatCertLine(c) {
  const parts = [c.name?.trim()].filter(Boolean)
  if (c.issuer?.trim()) parts.push(c.issuer.trim())
  const year = formatYearOrMonthDisplay(c.year)
  if (year) parts.push(year)
  return parts.join(' — ')
}

function buildHeader(user, snap) {
  const contact = [
    snap.email,
    snap.personal.phone,
    snap.personal.location,
    snap.links.linkedin,
    snap.links.github,
    snap.links.portfolio,
  ].filter(Boolean).join(' • ')

  return {
    name: snap.displayName === 'User' ? '' : snap.displayName,
    headline: snap.headline?.trim() || '',
    contact,
    profileKey: 'header',
  }
}

/**
 * Build v3 resume content from a profile snapshot (same shape as users/{uid}.profile).
 */
function buildProfileResumeContent(authUser, profile, layout = LAYOUTS.SINGLE, userDoc) {
  const snap = buildResumeProfileSnapshot(authUser, profile, userDoc)
  const allSkills = [...snap.skills.technical, ...snap.skills.soft].filter(Boolean)

  const summarySection = snap.summary?.trim()
    ? {
      id: 'summary',
      title: 'Summary',
      type: SECTION_TYPES.PARAGRAPH,
      variant: 'highlight',
      body: snap.summary.trim(),
      ...sectionMeta(RESUME_SECTION_PROFILE_KEYS.summary),
    }
    : null

  const experienceItems = snap.isFresher
    ? []
    : snap.experience
      .filter((e) => e?.company?.trim() || e?.role?.trim())
      .map(mapRoleItem)

  const experienceSection = experienceItems.length > 0
    ? {
      id: 'experience',
      title: 'Experience',
      type: SECTION_TYPES.EXPERIENCE,
      items: experienceItems,
      ...sectionMeta(RESUME_SECTION_PROFILE_KEYS.experience),
    }
    : null

  const internshipItems = snap.internships
    .filter((e) => e?.company?.trim() || e?.role?.trim())
    .map(mapRoleItem)

  const internshipsSection = internshipItems.length > 0
    ? {
      id: 'internships',
      title: 'Internships',
      type: SECTION_TYPES.EXPERIENCE,
      items: internshipItems,
      ...sectionMeta(RESUME_SECTION_PROFILE_KEYS.internships),
    }
    : null

  const projectItems = snap.projects
    .filter((p) => p?.title?.trim())
    .map((p) => ({
      id: p.id || '',
      title: p.title.trim(),
      tech: p.tech || '',
      description: p.description || '',
      url: p.url || '',
      icon: '🚀',
      profile: { ...p },
    }))

  const projectsSection = projectItems.length > 0
    ? {
      id: 'projects',
      title: 'Projects',
      type: SECTION_TYPES.ACHIEVEMENTS,
      items: projectItems.map((p) => ({
        icon: p.icon,
        title: p.title,
        description: [p.tech, p.description].filter(Boolean).join(' — ') || p.url || '',
        id: p.id,
        profile: p.profile,
      })),
      ...sectionMeta(RESUME_SECTION_PROFILE_KEYS.projects),
    }
    : null

  const educationItems = sortEducationEntries(snap.educationList)
    .filter(educationEntryHasContent)
    .map((e) => ({
      id: e.id || '',
      degree: educationEntryTitle(e),
      school: educationEntrySubtitle(e) || e.college || '',
      location: '',
      dates: formatDateRange(e.educationStart, e.educationEnd, ''),
      profile: { ...e },
    }))

  const educationSection = educationItems.length > 0
    ? {
      id: 'education',
      title: 'Education',
      type: SECTION_TYPES.EDUCATION,
      items: educationItems,
      ...sectionMeta(RESUME_SECTION_PROFILE_KEYS.education),
    }
    : null

  const certItems = snap.certifications
    .filter((c) => c?.name?.trim())
    .map((c) => ({
      id: c.id || '',
      name: c.name.trim(),
      issuer: c.issuer || '',
      year: c.year || '',
      label: formatCertLine(c),
      profile: { ...c },
    }))

  const certificationsSection = certItems.length > 0
    ? {
      id: 'certifications',
      title: 'Certifications',
      type: SECTION_TYPES.LIST,
      items: certItems.map((c) => c.label),
      profileItems: certItems,
      ...sectionMeta(RESUME_SECTION_PROFILE_KEYS.certifications),
    }
    : null

  const header = buildHeader(authUser, snap)

  if (layout === LAYOUTS.TWO_COLUMN) {
    const skillsSection = allSkills.length > 0
      ? {
        id: 'skills',
        title: 'Skills',
        type: SECTION_TYPES.LIST,
        items: allSkills,
        profileSkills: { ...snap.skills },
        ...sectionMeta(RESUME_SECTION_PROFILE_KEYS.skills),
      }
      : null

    return {
      header,
      sections: [],
      main: [summarySection, experienceSection, internshipsSection, projectsSection].filter(Boolean),
      sidebar: [skillsSection, educationSection, certificationsSection].filter(Boolean),
    }
  }

  const skillsSection = allSkills.length > 0
    ? {
      id: 'skills',
      title: 'Skills',
      type: SECTION_TYPES.INLINE,
      body: allSkills.join(' · '),
      profileSkills: { ...snap.skills },
      ...sectionMeta(RESUME_SECTION_PROFILE_KEYS.skills),
    }
    : null

  return {
    header,
    sections: [
      summarySection,
      skillsSection,
      experienceSection,
      internshipsSection,
      projectsSection,
      educationSection,
      certificationsSection,
    ].filter(Boolean),
    main: [],
    sidebar: [],
  }
}

function findSectionIndex(arr, profileSection) {
  if (!Array.isArray(arr) || !profileSection) return -1
  const aliases = SECTION_ID_ALIASES[profileSection.id] || [profileSection.id]
  let idx = arr.findIndex((s) => aliases.includes(s.id))
  if (idx >= 0) return idx

  if (profileSection.profileKey === 'experience' || profileSection.id === 'experience') {
    idx = arr.findIndex((s) => s.type === SECTION_TYPES.EXPERIENCE && s.profileKey !== 'internships')
    if (idx >= 0) return idx
  }
  if (profileSection.profileKey === 'internships' || profileSection.id === 'internships') {
    idx = arr.findIndex((s) => s.id === 'internships' || s.profileKey === 'internships')
    if (idx >= 0) return idx
  }
  if (profileSection.type === SECTION_TYPES.EXPERIENCE) {
    idx = arr.findIndex((s) => s.type === SECTION_TYPES.EXPERIENCE)
    if (idx >= 0) return idx
  }
  if (profileSection.type === SECTION_TYPES.EDUCATION) {
    idx = arr.findIndex((s) => s.type === SECTION_TYPES.EDUCATION)
    if (idx >= 0) return idx
  }
  if (profileSection.id === 'projects') {
    idx = arr.findIndex(
      (s) => s.id === 'projects'
        || (s.type === SECTION_TYPES.ACHIEVEMENTS && /project/i.test(s.title || '')),
    )
    if (idx >= 0) return idx
  }
  if (profileSection.id === 'certifications') {
    idx = arr.findIndex(
      (s) => SECTION_ID_ALIASES.certifications.includes(s.id)
        || (s.type === SECTION_TYPES.LIST && /certif/i.test(s.title || '')),
    )
    if (idx >= 0) return idx
  }
  if (profileSection.id === 'summary') {
    idx = arr.findIndex((s) => s.type === SECTION_TYPES.PARAGRAPH && /summary/i.test(s.title || ''))
    if (idx >= 0) return idx
  }
  if (profileSection.id === 'skills' || profileSection.profileKey === 'skills') {
    idx = arr.findIndex((s) => s.id === 'skills' || s.profileKey === 'skills')
    if (idx >= 0) return idx
    idx = arr.findIndex(
      (s) => s.type === SECTION_TYPES.LIST || s.type === SECTION_TYPES.INLINE,
    )
    if (idx >= 0) return idx
  }
  return -1
}

function adaptSectionToTemplateType(profileSection, templateSection) {
  if (!templateSection) return profileSection
  const next = { ...profileSection, title: profileSection.title || templateSection.title }

  if (templateSection.type === SECTION_TYPES.LIST && profileSection.type === SECTION_TYPES.INLINE) {
    const items = profileSection.body
      ? profileSection.body.split('·').map((s) => s.trim()).filter(Boolean)
      : (profileSection.items || [])
    return { ...next, type: SECTION_TYPES.LIST, items, body: undefined }
  }
  if (templateSection.type === SECTION_TYPES.INLINE && profileSection.type === SECTION_TYPES.LIST) {
    return {
      ...next,
      type: SECTION_TYPES.INLINE,
      body: (profileSection.items || []).join(' · '),
      items: undefined,
    }
  }
  return { ...next, type: templateSection.type }
}

function upsertSection(columns, colKey, profileSection) {
  const arr = [...(columns[colKey] || [])]
  const idx = findSectionIndex(arr, profileSection)
  if (idx >= 0) {
    const adapted = adaptSectionToTemplateType(profileSection, arr[idx])
    arr[idx] = { ...arr[idx], ...adapted, id: arr[idx].id }
  } else {
    arr.push({ ...profileSection })
  }
  columns[colKey] = arr
}

/** Profile-only resume JSON for the active template layout (no sample/dummy copy). */
export function buildSyncedResumeContent(template, authUser, profile, userDoc) {
  const layout = template?.layout || LAYOUTS.SINGLE
  const built = buildProfileResumeContent(authUser, profile, layout, userDoc)
  return {
    header: built.header,
    sections: layout === LAYOUTS.TWO_COLUMN ? [] : (built.sections || []),
    main: layout === LAYOUTS.TWO_COLUMN ? (built.main || []) : [],
    sidebar: layout === LAYOUTS.TWO_COLUMN ? (built.sidebar || []) : [],
  }
}

/** Merge profile into a template's content (keeps template layout & design slots). */
export function mergeProfileIntoTemplate(template, authUser, profile, userDoc) {
  const layout = template.layout || LAYOUTS.SINGLE
  const base = JSON.parse(JSON.stringify(template.content))

  if (!profileHasResumeData(authUser, profile, userDoc)) {
    return base
  }

  const profileContent = buildProfileResumeContent(authUser, profile, layout, userDoc)

  base.header = {
    ...base.header,
    ...profileContent.header,
  }

  const columns = {
    sections: base.sections || [],
    main: base.main || [],
    sidebar: base.sidebar || [],
  }

  const profileSections = layout === LAYOUTS.TWO_COLUMN
    ? [
      ...(profileContent.main || []).map((s) => ({ section: s, col: 'main' })),
      ...(profileContent.sidebar || []).map((s) => ({ section: s, col: 'sidebar' })),
    ]
    : (profileContent.sections || []).map((s) => ({ section: s, col: 'sections' }))

  for (const { section, col } of profileSections) {
    upsertSection(columns, col, section)
  }

  return {
    header: base.header,
    sections: columns.sections,
    main: columns.main,
    sidebar: columns.sidebar,
  }
}

