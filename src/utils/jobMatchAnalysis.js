/**
 * Structured job match analysis without AI — uses backend `job.match` and
 * tag vs profile skill overlap (case-insensitive, partial match like jobSearch).
 */

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
  const technical = profile?.skills?.technical
  if (!Array.isArray(technical)) return []
  return technical.map((s) => String(s).trim()).filter(Boolean)
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
    return `You are a strong fit for ${role} based on your profile match score and skill overlap.`
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

/**
 * @param {object} job - Job listing (tags, match, title, ...)
 * @param {object} profile - User profile from profile store
 * @returns {{ score: number, verdict: string, summary: string, matchedSkills: string[], missingSkills: string[], recommendations: string[] }}
 */
export function buildJobMatchAnalysis(job, profile) {
  const tags = Array.isArray(job?.tags) ? job.tags.map((t) => String(t).trim()).filter(Boolean) : []
  const userSkills = parseUserSkills(profile)
  const rawMatch = Number(job?.match)
  const hasBackendMatch = Number.isFinite(rawMatch) && rawMatch > 0

  // No skills and no scored match → don't invent a profile fit.
  if (!userSkills.length && !hasBackendMatch) {
    return {
      score: null,
      verdict: null,
      summary: 'Add skills to your profile to see a match score for this role.',
      matchedSkills: [],
      missingSkills: [],
      recommendations: ['Update your Glowminds profile with technical skills to unlock match scoring.'],
    }
  }

  const score = hasBackendMatch ? Math.round(rawMatch) : 0

  const matchedSkills = []
  const missingSkills = []

  for (const tag of tags) {
    if (userSkills.some((s) => skillMatchesTag(s, tag))) {
      matchedSkills.push(tag)
    } else {
      missingSkills.push(tag)
    }
  }

  return {
    score,
    verdict: verdictForScore(score),
    summary: buildSummary(score, matchedSkills, missingSkills, job?.title),
    matchedSkills,
    missingSkills: missingSkills.slice(0, 5),
    recommendations: buildRecommendations(missingSkills, score),
  }
}
