// Canonical Firestore schema constants and shape factories.
// Single source of truth for users/{uid} and users/{uid}.profile.

import { normalizeEducationList } from '@/utils/educationEntries'

// ----- Application status enum -----

export const APPLICATION_STATUS = Object.freeze({
  APPLIED: 'applied',
  IN_REVIEW: 'inReview',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  REJECTED: 'rejected',
})

export const APPLICATION_STATUSES = [
  APPLICATION_STATUS.APPLIED,
  APPLICATION_STATUS.IN_REVIEW,
  APPLICATION_STATUS.INTERVIEW,
  APPLICATION_STATUS.OFFER,
  APPLICATION_STATUS.REJECTED,
]

export const APPLICATION_STATUS_LABEL = Object.freeze({
  [APPLICATION_STATUS.APPLIED]: 'Applied',
  [APPLICATION_STATUS.IN_REVIEW]: 'In Review',
  [APPLICATION_STATUS.INTERVIEW]: 'Interview',
  [APPLICATION_STATUS.OFFER]: 'Offer',
  [APPLICATION_STATUS.REJECTED]: 'Rejected',
})

// Map any legacy/display value to the canonical enum.
export function normalizeApplicationStatus(raw) {
  if (!raw) return APPLICATION_STATUS.APPLIED
  const v = String(raw).trim().toLowerCase().replace(/[\s_-]+/g, '')
  if (v === 'inreview' || v === 'review') return APPLICATION_STATUS.IN_REVIEW
  if (v === 'interview' || v === 'interviews') return APPLICATION_STATUS.INTERVIEW
  if (v === 'offer' || v === 'offers' || v === 'offered') return APPLICATION_STATUS.OFFER
  if (v === 'rejected' || v === 'reject' || v === 'declined') return APPLICATION_STATUS.REJECTED
  if (v === 'applied') return APPLICATION_STATUS.APPLIED
  return APPLICATION_STATUS.APPLIED
}

// ----- Default factories -----

// Coarse-grained career level used by profile preferences, resume defaults,
// and recommended interview-question difficulty.
export const CAREER_LEVELS = Object.freeze({
  FRESHER: 'fresher',
  ENTRY: '0-2',
  MID: '2-5',
  SENIOR: '5+',
})

export const CAREER_LEVEL_LABEL = Object.freeze({
  [CAREER_LEVELS.FRESHER]: 'Fresher / No experience',
  [CAREER_LEVELS.ENTRY]: '0 – 2 years',
  [CAREER_LEVELS.MID]: '2 – 5 years',
  [CAREER_LEVELS.SENIOR]: '5+ years',
})

export function createDefaultGamification() {
  return {
    streak: 0,
    bestStreak: 0,
    lastActiveDate: null,
    xp: 0,
    xpWeek: 0,
    xpWeekStart: null,
    level: 1,
    badges: [],
    weekActive: [false, false, false, false, false, false, false],
    prefs: {
      showStreakOnDashboard: true,
      celebrateLevelUps: true,
      streakReminders: true,
    },
  }
}

export function normalizeGamification(raw) {
  const d = createDefaultGamification()
  if (!raw || typeof raw !== 'object') return d
  const prefs = { ...d.prefs, ...(raw.prefs && typeof raw.prefs === 'object' ? raw.prefs : {}) }
  const weekActive = Array.isArray(raw.weekActive) && raw.weekActive.length === 7
    ? raw.weekActive.map(Boolean)
    : d.weekActive
  return {
    streak: Number(raw.streak) || 0,
    bestStreak: Number(raw.bestStreak) || 0,
    lastActiveDate: raw.lastActiveDate || null,
    xp: Number(raw.xp) || 0,
    xpWeek: Number(raw.xpWeek) || 0,
    xpWeekStart: raw.xpWeekStart || null,
    level: Math.max(1, Number(raw.level) || 1),
    badges: Array.isArray(raw.badges) ? raw.badges : [],
    weekActive,
    prefs,
  }
}

export function createDefaultProfile() {
  return {
    headline: '',
    summary: '',
    careerLevel: '',
    personal: {
      phone: '',
      location: '',
      gender: '',
      dob: '',
      languages: [],
    },
    educationList: [],
    skills: { technical: [], soft: [] },
    isFresher: false,
    experience: [],
    internships: [],
    projects: [],
    certifications: [],
    links: { linkedin: '', github: '', portfolio: '', twitter: '' },
    preferences: {
      jobType: '',
      preferredRole: '',
      preferredLocations: [],
      expectedCTC: '',
      noticePeriod: '',
      jobAlerts: {
        enabled: false,
        query: '',
        frequency: 'daily',
        lastSentAt: null,
      },
    },
    aiReview: null,
    linkedinAudit: null,
    /** Latest ATS / resume-review snapshot for dashboard scores. */
    resumeAnalysis: null,
    /** Recent cover letter drafts saved from the Cover Letters tool (max kept client-side). */
    coverLetterDrafts: [],
    /** Career OS gamification (streak / XP / badges). */
    gamification: createDefaultGamification(),
  }
}

const MAX_COVER_LETTER_DRAFTS = 8

export function normalizeCoverLetterDrafts(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((d) => d && typeof d === 'object' && typeof d.body === 'string' && d.body.trim())
    .slice(0, MAX_COVER_LETTER_DRAFTS)
    .map((d) => ({
      id: typeof d.id === 'string' ? d.id : `draft_${Date.now()}`,
      role: String(d.role || '').slice(0, 120),
      company: String(d.company || '').slice(0, 120),
      template: String(d.template || 'concise').slice(0, 40),
      body: String(d.body).slice(0, 8000),
      savedAt: d.savedAt || new Date().toISOString(),
      source: d.source === 'ai' ? 'ai' : 'template',
    }))
}

export function createDefaultLinkedInAudit() {
  return {
    completedIds: [],
    score: 0,
    lastReviewedAt: null,
    ai: null,
  }
}

function normalizeLinkedInAi(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    parsedAt: raw.parsedAt || null,
    auditedAt: raw.auditedAt || raw.lastReviewedAt || null,
    snapshot: raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : null,
    audit: raw.audit && typeof raw.audit === 'object' ? raw.audit : null,
    checklist: Array.isArray(raw.checklist) ? raw.checklist : null,
    rewrites: Array.isArray(raw.rewrites) ? raw.rewrites : null,
    summary: typeof raw.summary === 'string' ? raw.summary : null,
    sourceFileName:
      typeof raw.sourceFileName === 'string' ? raw.sourceFileName.slice(0, 120) : '',
  }
}

function normalizeLinkedInAudit(raw) {
  if (!raw || typeof raw !== 'object') return null
  const completedIds = Array.isArray(raw.completedIds)
    ? raw.completedIds.filter((id) => typeof id === 'string')
    : []
  return {
    ...createDefaultLinkedInAudit(),
    completedIds,
    score: typeof raw.score === 'number' ? raw.score : 0,
    lastReviewedAt: raw.lastReviewedAt || raw.updatedAt || null,
    ai: normalizeLinkedInAi(raw.ai),
  }
}

/** Snapshot audit progress; stamps lastReviewedAt the first time all checks are completed. */
export function buildLinkedInAuditSnapshot({
  completedIds,
  score,
  totalChecks = 0,
  previous = null,
  ai = undefined,
}) {
  const prev = previous ? normalizeLinkedInAudit(previous) : createDefaultLinkedInAudit()
  const wasComplete = totalChecks > 0 && prev.completedIds.length === totalChecks
  const nowComplete = totalChecks > 0 && completedIds.length === totalChecks
  let lastReviewedAt = prev.lastReviewedAt
  if (nowComplete && !wasComplete) {
    lastReviewedAt = new Date().toISOString()
  }
  // `ai === undefined` → keep previous AI block intact (most writes are pure
  // checkbox toggles). Pass `ai: null` to explicitly clear it, or a fresh
  // object to overwrite.
  const nextAi = ai === undefined ? prev.ai : normalizeLinkedInAi(ai)
  return {
    completedIds: [...completedIds],
    score: typeof score === 'number' ? score : 0,
    lastReviewedAt,
    ai: nextAi,
  }
}

function createDefaultAiReview() {
  return {
    overallScore: 0,
    verdict: '',
    strengths: [],
    weaknesses: [],
    skillSuggestions: [],
    tips: [],
    summaryDraft: '',
    lastReviewedAt: null,
  }
}

function normalizeAiReview(raw) {
  if (!raw || typeof raw !== 'object') return null
  const { updatedAt, ...rest } = raw
  return {
    ...createDefaultAiReview(),
    ...rest,
    lastReviewedAt: rest.lastReviewedAt || updatedAt || null,
  }
}

/** Merge API review payload with lastReviewedAt timestamp. */
export function stampAiReview(reviewFromApi) {
  if (!reviewFromApi || typeof reviewFromApi !== 'object') return null
  const { updatedAt: _updatedAt, lastReviewedAt: _lastReviewedAt, ...rest } = reviewFromApi
  return normalizeAiReview({
    ...rest,
    lastReviewedAt: new Date().toISOString(),
  })
}

/** Coerce legacy skills shapes (array, CSV string, { technical, soft }) to v2. */
export function normalizeSkills(raw) {
  const empty = { technical: [], soft: [] }
  if (!raw) return empty
  if (Array.isArray(raw)) {
    return {
      technical: raw.map((s) => String(s).trim()).filter(Boolean),
      soft: [],
    }
  }
  if (typeof raw === 'string') {
    return {
      technical: raw.split(',').map((s) => s.trim()).filter(Boolean),
      soft: [],
    }
  }
  if (typeof raw === 'object') {
    return {
      technical: (Array.isArray(raw.technical) ? raw.technical : [])
        .map((s) => String(s).trim())
        .filter(Boolean),
      soft: (Array.isArray(raw.soft) ? raw.soft : [])
        .map((s) => String(s).trim())
        .filter(Boolean),
    }
  }
  return empty
}

/** Strip removed profile fields from Firestore payloads. */
const REMOVED_PROFILE_KEYS = ['education', 'public']

/** Full profile object for store / UI (fills defaults, normalizes aiReview). */
export function normalizeProfile(profilePartial) {
  const profile = { ...createDefaultProfile(), ...(profilePartial || {}) }
  for (const key of REMOVED_PROFILE_KEYS) {
    delete profile[key]
  }
  profile.educationList = normalizeEducationList(profile.educationList)
  profile.skills = normalizeSkills(profile.skills)
  if (profile.aiReview) {
    profile.aiReview = normalizeAiReview(profile.aiReview)
  }
  if (profile.linkedinAudit) {
    profile.linkedinAudit = normalizeLinkedInAudit(profile.linkedinAudit)
  }
  if (profile.resumeAnalysis && typeof profile.resumeAnalysis === 'object') {
    profile.resumeAnalysis = {
      ...profile.resumeAnalysis,
      overallScore: Number(profile.resumeAnalysis.overallScore) || 0,
    }
  } else {
    profile.resumeAnalysis = null
  }
  delete profile.public
  profile.coverLetterDrafts = normalizeCoverLetterDrafts(profile.coverLetterDrafts)
  profile.gamification = normalizeGamification(profile.gamification)
  const defaultPrefs = createDefaultProfile().preferences
  profile.preferences = {
    ...defaultPrefs,
    ...(profile.preferences || {}),
    preferredRole: String(profile.preferences?.preferredRole || '').slice(0, 120),
    jobAlerts: {
      ...defaultPrefs.jobAlerts,
      ...(profile.preferences?.jobAlerts || {}),
    },
    preferredLocations: Array.isArray(profile.preferences?.preferredLocations)
      ? profile.preferences.preferredLocations
      : [],
  }
  return profile
}

/** Preferred target role for AI tools (skills gap, interview, learning, cover letters). */
export function getPreferredRole(profile, fallback = 'Software Engineer') {
  const prefs = profile?.preferences || {}
  const role =
    String(prefs.preferredRole || '').trim()
    || (Array.isArray(prefs.preferredRoles) ? String(prefs.preferredRoles[0] || '').trim() : '')
    || String(profile?.headline || '').trim()
    || String(profile?.experience?.[0]?.role || '').trim()
  return role || fallback
}

function createDefaultSettings() {
  return {
    theme: 'system',
    emailNotifications: true,
    pushNotifications: false,
    reducedMotion: false,
    compactDensity: false,
    locale: 'en-IN',
    dismissedFocusId: null,
  }
}

function createDefaultFlags() {
  return {
    defaultResumeId: null,
  }
}

// Shape used by authStore.doSignup / doGoogleLogin to seed users/{uid}.
// Pair with serverTimestamp() for createdAt/updatedAt at the call site.
export function createDefaultUserDoc({ uid, email, firstName = '', lastName = '', displayName = '', photoURL = null }) {
  const finalDisplay = displayName || `${firstName} ${lastName}`.trim()
  return {
    uid,
    email,
    emailVerified: false,
    firstName,
    lastName,
    displayName: finalDisplay,
    photoURL,
    settings: createDefaultSettings(),
    flags: createDefaultFlags(),
    profile: createDefaultProfile(),
  }
}
