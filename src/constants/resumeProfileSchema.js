/**
 * Links resume builder JSON ↔ users/{uid}.profile (see createDefaultProfile in schema.js).
 *
 * Resume Firestore doc stores:
 *   - profile: snapshot matching profile shape (source of truth for sync)
 *   - content: rendered v3 canvas (header + sections | main + sidebar)
 *
 * Each resume section uses `profileKey` equal to a top-level profile field when applicable.
 */

import { normalizeEducationList } from '@/utils/educationEntries'

/** Resume section id → profile document path (dot path or top-level key). */
export const RESUME_SECTION_PROFILE_KEYS = Object.freeze({
  summary: 'summary',
  skills: 'skills',
  experience: 'experience',
  internships: 'internships',
  projects: 'projects',
  education: 'educationList',
  certifications: 'certifications',
})

/**
 * Canonical profile snapshot stored on the resume document.
 * Matches createDefaultProfile() + user identity fields used in the resume header.
 */
/** Merge Firebase Auth user + Firestore users/{uid} doc for resume header identity. */
export function resolveResumeIdentity(authUser, userDoc) {
  const doc = userDoc || {}
  const fromDoc = `${doc.firstName || ''} ${doc.lastName || ''}`.trim()
  const displayName = fromDoc
    || (doc.displayName || '').trim()
    || (authUser?.displayName || '').trim()
  return {
    displayName,
    email: (authUser?.email || doc.email || '').trim(),
  }
}

export function buildResumeProfileSnapshot(authUser, profile, userDoc) {
  const p = profile || {}
  const { displayName, email } = resolveResumeIdentity(authUser, userDoc)
  return {
    displayName,
    email,
    headline: p.headline || '',
    summary: p.summary || '',
    personal: {
      phone: p.personal?.phone || '',
      location: p.personal?.location || '',
      gender: p.personal?.gender || '',
      dob: p.personal?.dob || '',
      languages: Array.isArray(p.personal?.languages) ? [...p.personal.languages] : [],
    },
    skills: {
      technical: Array.isArray(p.skills?.technical) ? [...p.skills.technical] : [],
      soft: Array.isArray(p.skills?.soft) ? [...p.skills.soft] : [],
    },
    isFresher: !!p.isFresher,
    experience: Array.isArray(p.experience) ? p.experience.map((e) => ({ ...e })) : [],
    internships: Array.isArray(p.internships) ? p.internships.map((e) => ({ ...e })) : [],
    projects: Array.isArray(p.projects) ? p.projects.map((e) => ({ ...e })) : [],
    certifications: Array.isArray(p.certifications) ? p.certifications.map((e) => ({ ...e })) : [],
    educationList: normalizeEducationList(p.educationList).map((e) => ({ ...e })),
    links: {
      linkedin: p.links?.linkedin || '',
      github: p.links?.github || '',
      portfolio: p.links?.portfolio || '',
      twitter: p.links?.twitter || '',
    },
  }
}

/** Firestore payload for resumes/{uid}_{resumeId}. */
export function createResumeFirestorePayload({
  user,
  profile,
  userDoc,
  content,
  design,
  layout,
  sidebarSide,
  name,
  templateId,
}) {
  return {
    name: name || 'My Resume',
    layout,
    sidebarSide,
    content,
    design,
    template: templateId || design?.template,
    accent: design?.accent,
    profile: buildResumeProfileSnapshot(user, profile, userDoc),
  }
}
