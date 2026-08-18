/**
 * Profile ↔ job match: skills overlap (~60%) + text overlap (~40%).
 * Does not use backend `job.match` (that is a search-rank heuristic, not a profile score).
 */

import { filterJobTags } from '@/utils/jobFilters'

function normalizeSkill(value) {
  return String(value || '').toLowerCase().trim()
}

/** Mirrors jobSearch `jobMatchesQueryTokens` for one tag vs one user skill. */
function skillMatchesTag(userSkill, tag) {
  const skill = normalizeSkill(userSkill)
  const jobTag = normalizeSkill(tag)
  if (!skill || !jobTag) return false
  if (skill === jobTag || skill.includes(jobTag) || jobTag.includes(skill)) return true
  return false
}

function parseUserSkills(profile) {
  const technical = Array.isArray(profile?.skills?.technical) ? profile.skills.technical : []
  const soft = Array.isArray(profile?.skills?.soft) ? profile.skills.soft : []
  const seen = new Set()
  const out = []
  for (const raw of [...technical, ...soft]) {
    const skill = String(raw || '').trim()
    const key = skill.toLowerCase()
    if (!skill || seen.has(key)) continue
    seen.add(key)
    out.push(skill)
  }
  return out
}

const TEXT_STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'you', 'our',
  'are', 'was', 'were', 'will', 'can', 'has', 'have', 'had', 'not', 'but',
  'job', 'role', 'team', 'work', 'working', 'experience', 'years', 'year',
  'looking', 'seeking', 'aspiring', 'passionate', 'motivated', 'driven',
  'results', 'about', 'into', 'over', 'than', 'then', 'them', 'they',
  'their', 'who', 'what', 'when', 'where', 'which', 'while',
  'a', 'an', 'or', 'of', 'in', 'on', 'to', 'at', 'as', 'by', 'we',
  'see', 'full', 'description', 'details', 'must', 'should',
])

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !TEXT_STOP.has(t))
}

function uniqueTokens(text) {
  const seen = new Set()
  const out = []
  for (const token of tokenize(text)) {
    if (seen.has(token)) continue
    seen.add(token)
    out.push(token)
  }
  return out
}

function tokenMatches(a, b) {
  if (!a || !b) return false
  if (a === b) return true
  if (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a))) return true
  return false
}

function collectProfileText(profile) {
  const parts = [
    profile?.headline,
    profile?.summary,
    ...(Array.isArray(profile?.experience) ? profile.experience.map((e) => e?.role || e?.title) : []),
    ...(Array.isArray(profile?.internships) ? profile.internships.map((e) => e?.role || e?.title) : []),
  ]
  return parts.filter(Boolean).join(' ')
}

function collectJobText(job) {
  const desc = String(job?.description || job?.desc || '').slice(0, 1600)
  return [job?.title, desc].filter(Boolean).join(' ')
}

function collectJobSkills(job) {
  const tags = filterJobTags(job?.tags)
  const reqs = Array.isArray(job?.req) ? job.req : []
  const extra = []
  for (const req of reqs) {
    if (/see full job description/i.test(String(req))) continue
    extra.push(...filterJobTags(String(req).split(/[,/;|]/)))
  }
  const seen = new Set()
  const out = []
  for (const skill of [...tags, ...extra]) {
    const key = skill.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(skill)
  }
  return out
}

function skillAppearsInText(userSkill, text) {
  const skill = normalizeSkill(userSkill)
  const hay = normalizeSkill(text)
  if (!skill || !hay) return false
  if (hay.includes(skill)) return true
  return tokenize(hay).some((token) => tokenMatches(skill, token))
}

export const HIGH_MATCH_THRESHOLD = 85
export const SKILL_MATCH_WEIGHT = 0.6
export const TEXT_MATCH_WEIGHT = 0.4

/** True when we can compute an honest score (skills and/or a real target-role headline). */
export function canShowJobMatch(profile) {
  if (!profile || typeof profile !== 'object') return false
  const skills = parseUserSkills(profile)
  const headline = String(profile.headline || '').trim()
  return skills.length > 0 || !!headline
}

export function matchScoreTone(score) {
  if (score == null || Number.isNaN(Number(score))) return 'text-muted-foreground'
  if (score >= 85) return 'text-emerald-500'
  if (score >= 60) return 'text-amber-500'
  return 'text-muted-foreground'
}

function verdictForScore(score) {
  if (score >= 80) return 'Strong Match'
  if (score >= 60) return 'Good Match'
  if (score >= 40) return 'Moderate Match'
  return 'Weak Match'
}

function buildSummary(score, matchedSkills, missingSkills, jobTitle) {
  const role = jobTitle ? `"${jobTitle}"` : 'this role'
  if (matchedSkills.length === 0 && missingSkills.length > 0) {
    return `Your profile shows limited overlap with the skills listed for ${role}. Focus on the gaps below before applying.`
  }
  if (missingSkills.length === 0 && matchedSkills.length > 0) {
    return `Your skills align well with what ${role} asks for. Highlight your matched skills in your resume and application.`
  }
  if (score >= 80) {
    return `You are a strong fit for ${role} based on skill and text overlap with your profile.`
  }
  if (score >= 60) {
    return `You are a reasonable fit for ${role}. Strengthen a few missing skills to improve your chances.`
  }
  return `Your match for ${role} is moderate. Closing skill gaps and tailoring your resume will help.`
}

function buildRecommendations(missingSkills, score) {
  const recs = []
  if (missingSkills.length > 0) {
    const top = missingSkills.slice(0, 3).join(', ')
    recs.push(`Add or practice ${top} — include projects or coursework that demonstrate these on your profile.`)
    if (missingSkills.length > 2) {
      recs.push('Prioritize the top missing skills from the job tags; recruiters often scan for exact keyword overlap.')
    }
  }
  if (score < 60) {
    recs.push('Update your Glowminds profile headline and technical skills so they mirror this job’s tags.')
  }
  if (score >= 60 && missingSkills.length === 0) {
    recs.push('Apply with a tailored resume that leads with your matched skills in the summary and experience bullets.')
  } else if (score >= 60) {
    recs.push('Apply if you meet experience requirements; mention adjacent skills you are learning in your cover letter.')
  }
  if (recs.length === 0) {
    recs.push('Review the full job description and align your resume bullets with the role’s requirements.')
  }
  return recs.slice(0, 3)
}

function emptyAnalysis() {
  return {
    available: false,
    score: null,
    skillScore: 0,
    textScore: 0,
    skillMatchCount: 0,
    skillTotal: 0,
    verdict: '',
    summary: 'Add skills and a target role to see how well this job matches your profile.',
    matchedSkills: [],
    missingSkills: [],
    matchedKeywords: [],
    recommendations: ['Add technical skills and a headline on your profile to unlock match scores.'],
  }
}

/**
 * @param {object} job - Job listing (tags, title, description, req, ...)
 * @param {object} profile - User profile from profile store
 */
export function buildJobMatchAnalysis(job, profile) {
  if (!canShowJobMatch(profile)) return emptyAnalysis()

  const userSkills = parseUserSkills(profile)
  const jobSkills = collectJobSkills(job)
  const jobText = collectJobText(job)
  const profileText = collectProfileText(profile)

  const matchedSkills = []
  const missingSkills = []

  if (jobSkills.length) {
    for (const tag of jobSkills) {
      if (userSkills.some((s) => skillMatchesTag(s, tag))) matchedSkills.push(tag)
      else missingSkills.push(tag)
    }
  } else if (userSkills.length) {
    for (const skill of userSkills) {
      if (skillAppearsInText(skill, jobText)) matchedSkills.push(skill)
    }
  }

  const skillTotal = jobSkills.length || (userSkills.length ? userSkills.length : 0)
  const skillRatio = skillTotal ? matchedSkills.length / skillTotal : 0

  const profileTokens = uniqueTokens(profileText)
  const jobTokens = uniqueTokens(jobText)
  const matchedKeywords = profileTokens.filter((token) =>
    jobTokens.some((jobToken) => tokenMatches(token, jobToken)),
  )
  const textRatio = profileTokens.length ? matchedKeywords.length / profileTokens.length : 0

  const skillReady = userSkills.length > 0 && skillTotal > 0
  const textReady = profileTokens.length > 0 && jobTokens.length > 0

  let score = 0
  if (skillReady && textReady) {
    score = skillRatio * SKILL_MATCH_WEIGHT * 100 + textRatio * TEXT_MATCH_WEIGHT * 100
  } else if (skillReady) {
    score = skillRatio * 100
  } else if (textReady) {
    score = textRatio * 100
  }
  score = Math.round(Math.min(99, Math.max(0, score)))

  return {
    available: true,
    score,
    skillScore: Math.round(skillRatio * 100),
    textScore: Math.round(textRatio * 100),
    skillMatchCount: matchedSkills.length,
    skillTotal,
    verdict: verdictForScore(score),
    summary: buildSummary(score, matchedSkills, missingSkills, job?.title),
    matchedSkills,
    missingSkills: missingSkills.slice(0, 5),
    matchedKeywords: matchedKeywords.slice(0, 4),
    recommendations: buildRecommendations(missingSkills, score),
  }
}
