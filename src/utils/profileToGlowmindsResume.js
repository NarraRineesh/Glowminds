import { buildResumeProfileSnapshot } from '@/constants/resumeProfileSchema'
import { getCopilotThemeTokens } from '@/constants/copilotThemeTokens'
import { profileHasResumeData } from '@/utils/resumeFromProfile'
import { formatDateRange } from '@/utils/profileDates'
import {
  sortEducationEntries,
  entryHasContent as educationEntryHasContent,
  educationEntryTitle,
  educationEntrySubtitle,
} from '@/utils/educationEntries'

const PRIMARY_GLOWMINDS_RESUME_ID = 'glowminds-primary'

function uid() {
  return crypto.randomUUID()
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function linesToHtml(lines) {
  const items = (Array.isArray(lines) ? lines : String(lines || '').split(/\n+/))
    .map((line) => line.replace(/^[-•·*]\s*/, '').trim())
    .filter(Boolean)

  if (items.length === 0) return ''
  return `<ul>${items.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`
}

function createEmptyResumeData() {
  return {
    picture: {
      hidden: false,
      url: '',
      size: 80,
      rotation: 0,
      aspectRatio: 1,
      borderRadius: 0,
      borderColor: 'rgba(0, 0, 0, 0.5)',
      borderWidth: 0,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowWidth: 0,
    },
    basics: {
      name: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      website: { url: '', label: '' },
      customFields: [],
    },
    summary: {
      title: '',
      columns: 1,
      hidden: false,
      content: '',
    },
    sections: {
      profiles: { title: '', columns: 1, hidden: false, items: [] },
      experience: { title: '', columns: 1, hidden: false, items: [] },
      education: { title: '', columns: 1, hidden: false, items: [] },
      projects: { title: '', columns: 1, hidden: false, items: [] },
      skills: { title: '', columns: 1, hidden: false, items: [] },
      languages: { title: '', columns: 1, hidden: false, items: [] },
      interests: { title: '', columns: 1, hidden: false, items: [] },
      awards: { title: '', columns: 1, hidden: false, items: [] },
      certifications: { title: '', columns: 1, hidden: false, items: [] },
      publications: { title: '', columns: 1, hidden: false, items: [] },
      volunteer: { title: '', columns: 1, hidden: false, items: [] },
      references: { title: '', columns: 1, hidden: false, items: [] },
    },
    customSections: [],
    metadata: {
      template: 'onyx',
      layout: {
        sidebarWidth: 35,
        pages: [
          {
            fullWidth: false,
            main: ['profiles', 'summary', 'education', 'experience', 'projects', 'volunteer', 'references'],
            sidebar: ['skills', 'certifications', 'awards', 'languages', 'interests', 'publications'],
          },
        ],
      },
      page: {
        gapX: 4,
        gapY: 6,
        marginX: 14,
        marginY: 12,
        format: 'a4',
        locale: 'en-US',
        hideIcons: false,
      },
      design: {
        colors: {
          primary: 'rgba(220, 38, 38, 1)',
          text: 'rgba(0, 0, 0, 1)',
          background: 'rgba(255, 255, 255, 1)',
        },
        level: {
          icon: 'star',
          type: 'circle',
        },
      },
      typography: {
        body: {
          fontFamily: 'IBM Plex Serif',
          fontWeights: ['400', '500'],
          fontSize: 10,
          lineHeight: 1.5,
        },
        heading: {
          fontFamily: 'IBM Plex Serif',
          fontWeights: ['600'],
          fontSize: 14,
          lineHeight: 1.5,
        },
      },
      notes: '',
      styleRules: [],
    },
  }
}

function mapProfileItems(snap) {
  const items = []

  if (snap.links?.linkedin?.trim()) {
    items.push({
      id: uid(),
      hidden: false,
      icon: 'linkedin-logo',
      iconColor: '',
      network: 'LinkedIn',
      username: '',
      website: { url: snap.links.linkedin.trim(), label: 'LinkedIn', inlineLink: false },
    })
  }

  if (snap.links?.github?.trim()) {
    items.push({
      id: uid(),
      hidden: false,
      icon: 'github-logo',
      iconColor: '',
      network: 'GitHub',
      username: '',
      website: { url: snap.links.github.trim(), label: 'GitHub', inlineLink: false },
    })
  }

  if (snap.links?.portfolio?.trim()) {
    items.push({
      id: uid(),
      hidden: false,
      icon: 'globe',
      iconColor: '',
      network: 'Portfolio',
      username: '',
      website: { url: snap.links.portfolio.trim(), label: 'Portfolio', inlineLink: false },
    })
  }

  return items
}

function mapExperienceItems(entries) {
  return entries
    .filter((entry) => entry?.company?.trim() || entry?.role?.trim())
    .map((entry) => {
      const bullets = [
        ...(Array.isArray(entry.bullets) ? entry.bullets : []),
        ...String(entry.description || '').split(/\n+/).filter(Boolean),
      ]

      return {
        id: entry.id || uid(),
        hidden: false,
        company: entry.company?.trim() || 'Company',
        position: entry.role?.trim() || '',
        location: entry.location?.trim() || '',
        period: entry.dates || formatDateRange(entry.startDate, entry.endDate, entry.duration || ''),
        website: { url: '', label: '', inlineLink: false },
        description: linesToHtml(bullets),
        roles: [],
      }
    })
}

function mapProjectItems(projects) {
  return projects
    .filter((project) => project?.title?.trim())
    .map((project) => ({
      id: project.id || uid(),
      hidden: false,
      name: project.title.trim(),
      period: '',
      website: project.url?.trim()
        ? { url: project.url.trim(), label: project.title.trim(), inlineLink: false }
        : { url: '', label: '', inlineLink: false },
      description: linesToHtml([project.tech, project.description].filter(Boolean)),
    }))
}

function mapEducationItems(educationList) {
  return sortEducationEntries(educationList)
    .filter(educationEntryHasContent)
    .map((entry) => ({
      id: entry.id || uid(),
      hidden: false,
      school: educationEntrySubtitle(entry) || entry.college?.trim() || 'School',
      degree: educationEntryTitle(entry) || '',
      area: entry.field?.trim() || '',
      grade: entry.grade?.trim() || '',
      location: '',
      period: formatDateRange(entry.educationStart, entry.educationEnd, ''),
      website: { url: '', label: '', inlineLink: false },
      description: '',
    }))
}

function mapCertificationItems(certifications) {
  return certifications
    .filter((cert) => cert?.name?.trim())
    .map((cert) => ({
      id: cert.id || uid(),
      hidden: false,
      title: cert.name.trim(),
      issuer: cert.issuer?.trim() || '',
      date: cert.year ? String(cert.year) : '',
      website: { url: '', label: '', inlineLink: false },
      description: '',
    }))
}

function mapSkillItems(snap) {
  const technical = snap.skills?.technical ?? []
  const soft = snap.skills?.soft ?? []
  const items = []

  if (technical.length) {
    items.push({
      id: uid(),
      hidden: false,
      icon: '',
      iconColor: '',
      name: 'Technical Skills',
      proficiency: '',
      level: 0,
      keywords: technical.filter(Boolean),
    })
  }

  if (soft.length) {
    items.push({
      id: uid(),
      hidden: false,
      icon: '',
      iconColor: '',
      name: 'Soft Skills',
      proficiency: '',
      level: 0,
      keywords: soft.filter(Boolean),
    })
  }

  return items
}

export function profileToGlowmindsResume(authUser, profile, userDoc) {
  const snap = buildResumeProfileSnapshot(authUser, profile, userDoc)
  const data = createEmptyResumeData()
  const displayName = snap.displayName === 'User' ? '' : snap.displayName

  data.basics.name = displayName
  data.basics.headline = snap.headline?.trim() || ''
  data.basics.email = snap.email?.trim() || ''
  data.basics.phone = snap.personal?.phone?.trim() || ''
  data.basics.location = snap.personal?.location?.trim() || ''

  if (snap.links?.portfolio?.trim()) {
    data.basics.website = { url: snap.links.portfolio.trim(), label: 'Portfolio' }
  }

  if (snap.summary?.trim()) {
    data.summary.content = `<p>${escapeHtml(snap.summary.trim())}</p>`
  }

  data.sections.profiles.items = mapProfileItems(snap)
  data.sections.experience.items = mapExperienceItems([
    ...(snap.isFresher ? [] : snap.experience ?? []),
    ...(snap.internships ?? []),
  ])
  data.sections.projects.items = mapProjectItems(snap.projects ?? [])
  data.sections.education.items = mapEducationItems(snap.educationList ?? [])
  data.sections.certifications.items = mapCertificationItems(snap.certifications ?? [])
  data.sections.skills.items = mapSkillItems(snap)

  const name = displayName ? `${displayName} — Glowminds Resume` : 'Glowminds Resume'

  return {
    id: PRIMARY_GLOWMINDS_RESUME_ID,
    copilotId: PRIMARY_GLOWMINDS_RESUME_ID,
    name,
    slug: 'glowminds-resume',
    tags: ['glowminds'],
    data,
    isLocked: false,
    isPublic: false,
    hasPassword: false,
    updatedAt: new Date().toISOString(),
  }
}

export function buildGlowmindsResumePayload({ theme, user }) {
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  return {
    theme: resolvedTheme,
    themeTokens: getCopilotThemeTokens(resolvedTheme),
    user: user
      ? {
          uid: user.uid,
          email: user.email ?? undefined,
          displayName: user.displayName ?? undefined,
        }
      : undefined,
    resumes: [],
    seedFromProfile: false,
  }
}
