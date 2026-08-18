import { profileHasEducation } from '@/utils/educationEntries'
import { profileHasExperience } from '@/utils/experienceEntries'

/** Shared profile-completion checks — used by Overview and Profile. */
export function profileCompletionChecks({ profile, user } = {}) {
  const p = profile || {}
  const name = String(user?.displayName || user?.firstName || '').trim()
  return [
    [!!name && name !== 'User', 'Complete your profile'],
    [(p.skills?.technical || []).length >= 3, 'Add your skills'],
    [profileHasEducation(p), 'Add education'],
    [profileHasExperience(p), 'Add experience'],
    [!!p.preferences?.expectedCTC, 'Set salary expectations'],
    [!!(p.links?.github || p.links?.linkedin), 'Add GitHub or LinkedIn'],
    [!!String(p.summary || '').trim(), 'Write a summary'],
    [!!user?.photoURL, 'Add profile photo'],
  ]
}

/** One career/profile score. Call only after the profile store has loaded. */
export function computeProfileScore({ profile, user } = {}) {
  const checks = profileCompletionChecks({ profile, user })
  if (!checks.length) return 0
  return Math.round((checks.filter(([done]) => done).length / checks.length) * 100)
}

export function getResumeScore(profile) {
  const review = profile?.aiReview
  if (!review || typeof review !== 'object') return null
  const n = Number(review.overallScore ?? review.score)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n)
}

export function getLinkedInScore(profile) {
  const audit = profile?.linkedinAudit
  if (!audit || typeof audit !== 'object') return null
  const n = Number(audit.score)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n)
}
