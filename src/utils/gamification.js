import { normalizeSkills } from '@/constants/schema'
import { LINKEDIN_OPTIMIZER_CHECK_COUNT } from '@/constants/badgesCatalog'
import { profileHasEducation } from '@/utils/educationEntries'
import { profileHasExperience } from '@/utils/experienceEntries'

export const XP_PER_LEVEL = 200

export function computeLevel(xp) {
  return Math.max(1, Math.floor((xp || 0) / XP_PER_LEVEL) + 1)
}

/** XP progress within the current level (for LevelProgress UI). */
export function computeXpProgress(totalXp, levelHint) {
  const total = totalXp || 0
  const level = levelHint || computeLevel(total)
  const xpAtLevelStart = (level - 1) * XP_PER_LEVEL
  const xpInLevel = total - xpAtLevelStart
  const xpToNext = Math.max(0, XP_PER_LEVEL - xpInLevel)
  return {
    level,
    xp: xpInLevel,
    xpToNext,
    totalXp: total,
    progressPct: Math.min(100, Math.round((xpInLevel / XP_PER_LEVEL) * 100)),
  }
}

export function isProfileCompleteForBadge(profile, authUser) {
  if (!profile) return false
  const { technical } = normalizeSkills(profile.skills)
  const prefs = profile.preferences || {}
  const links = profile.links || {}
  return (
    technical.length >= 3
    && profileHasEducation(profile)
    && profileHasExperience(profile)
    && !!prefs.expectedCTC
    && (!!links.github || !!links.linkedin)
    && !!(profile.summary || '').trim()
    && !!authUser?.photoURL
  )
}

export function isLinkedInOptimized(profile) {
  const ids = profile?.linkedinAudit?.completedIds
  return Array.isArray(ids) && ids.length >= LINKEDIN_OPTIMIZER_CHECK_COUNT
}

/**
 * Returns badge ids the user qualifies for but hasn't earned yet.
 */
export function getEligibleBadgeIds(catalog, context) {
  const earned = new Set(context.earnedBadgeIds || [])
  const eligible = []

  for (const badge of catalog || []) {
    if (!badge?.id || earned.has(badge.id)) continue
    const c = badge.criteria || {}
    let ok = false

    switch (c.type) {
      case 'profileComplete':
        ok = !!context.profileComplete
        break
      case 'resumeCount':
        ok = (context.resumeCount || 0) >= (c.value || 1)
        break
      case 'applicationCount':
        ok = (context.applicationCount || 0) >= (c.value || 1)
        break
      case 'applicationStatus':
        ok = c.value === 'offer' ? !!context.hasOffer : false
        break
      case 'interviewCount':
        ok = (context.interviewCount || 0) >= (c.value || 1)
        break
      case 'streak':
        ok = (context.streakCurrent || 0) >= (c.value || 1)
        break
      case 'aiChatCount':
        ok = (context.aiChatCount || 0) >= (c.value || 1)
        break
      case 'linkedinOptimized':
        ok = !!context.linkedinOptimized
        break
      default:
        break
    }

    if (ok) eligible.push(badge.id)
  }

  return eligible
}

export function hasApplicationStatus(apps, status) {
  return (apps || []).some((a) => a.status === status)
}
