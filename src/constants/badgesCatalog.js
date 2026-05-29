/**
 * Client-side badge catalog (mirrors backend/src/data/badgesCatalog.js).
 * Used when /badges Firestore collection is empty or unreachable.
 */
export const BADGES_CATALOG = [
  {
    id: 'profile-master',
    icon: 'crown',
    name: 'Profile Master',
    tier: 'silver',
    description: 'Completed your full profile.',
    criteria: { type: 'profileComplete' },
    sortOrder: 10,
  },
  {
    id: 'first-resume',
    icon: 'resume',
    name: 'Resume Builder',
    tier: 'bronze',
    description: 'Saved your first resume.',
    criteria: { type: 'resumeCount', value: 1 },
    sortOrder: 20,
  },
  {
    id: 'first-application',
    icon: 'pencil',
    name: 'First Application',
    tier: 'bronze',
    description: 'Tracked your first job application.',
    criteria: { type: 'applicationCount', value: 1 },
    sortOrder: 30,
  },
  {
    id: 'job-hunter',
    icon: 'target',
    name: 'Job Hunter',
    tier: 'silver',
    description: 'Tracked 25 job applications.',
    criteria: { type: 'applicationCount', value: 25 },
    sortOrder: 40,
  },
  {
    id: 'offer-champion',
    icon: 'trophy',
    name: 'Offer Champion',
    tier: 'gold',
    description: 'Landed your first job offer.',
    criteria: { type: 'applicationStatus', value: 'offer' },
    sortOrder: 50,
  },
  {
    id: 'interview-pro',
    icon: 'jobs',
    name: 'Interview Pro',
    tier: 'silver',
    description: 'Completed 10 mock interviews.',
    criteria: { type: 'interviewCount', value: 10 },
    sortOrder: 60,
  },
  {
    id: 'week-warrior',
    icon: 'fire',
    name: 'Week Warrior',
    tier: 'bronze',
    description: 'Maintained a 7-day streak.',
    criteria: { type: 'streak', value: 7 },
    sortOrder: 70,
  },
  {
    id: 'month-master',
    icon: 'star',
    name: 'Month Master',
    tier: 'gold',
    description: 'Maintained a 30-day streak.',
    criteria: { type: 'streak', value: 30 },
    sortOrder: 80,
  },
  {
    id: 'ai-coach',
    icon: 'robot',
    name: 'AI Apprentice',
    tier: 'bronze',
    description: 'Sent your first message to AI Coach.',
    criteria: { type: 'aiChatCount', value: 1 },
    sortOrder: 90,
  },
  {
    id: 'linkedin-optimizer',
    icon: 'linkedin',
    name: 'LinkedIn Polished',
    tier: 'silver',
    description: 'Completed all LinkedIn optimization steps.',
    criteria: { type: 'linkedinOptimized' },
    sortOrder: 110,
  },
]

export const LINKEDIN_OPTIMIZER_CHECK_COUNT = 9

export const BADGE_TIER_XP = {
  bronze: 25,
  silver: 75,
  gold: 150,
}

export function badgeXp(badge) {
  if (typeof badge?.xp === 'number') return badge.xp
  return BADGE_TIER_XP[badge?.tier] || 25
}
