/** [v2:scores] Compose dashboard career scores from existing profile/resume/interview data */
export function buildCareerScores({
  profile,
  resumeAnalysis,
  interviewAvg,
  skillCoverage,
} = {}) {
  const resumeScore = Number(resumeAnalysis?.overallScore) || 0
  const linkedInScore = Number(profile?.linkedinAudit?.score) || 0
  const profileReview = Number(profile?.aiReview?.overallScore) || 0
  const interviewReady = Number(interviewAvg) || 0
  const skillScore = Number(skillCoverage) || 0

  const parts = [resumeScore, linkedInScore, profileReview, interviewReady, skillScore].filter((n) => n > 0)
  const careerScore = parts.length
    ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
    : Math.round(
        ([resumeScore, linkedInScore, profileReview].find((n) => n > 0) || 0),
      )

  return {
    careerScore,
    resumeScore,
    linkedInScore,
    interviewReady,
    skillScore,
    profileReview,
  }
}

/** [v2:nba] Build 3–5 action-plan items from profile state */
export function buildActionPlan({ profile, apps = [], scores = {}, readyForMatches }) {
  const items = []
  const skills = profile?.skills?.technical || []
  if (skills.length < 3) {
    items.push({
      id: 'skills',
      title: 'Add technical skills',
      hint: 'Improve matching & skill gap',
      est: '5 min',
      icon: 'puzzle',
      to: '/dashboard/profile',
    })
  }
  if (!profile?.linkedinAudit?.score) {
    items.push({
      id: 'linkedin',
      title: 'Improve LinkedIn headline',
      hint: 'Run LinkedIn Sync audit',
      est: '10 min',
      icon: 'linkedin',
      to: '/dashboard/linkedin',
    })
  }
  if (!scores.resumeScore) {
    items.push({
      id: 'ats',
      title: 'Check ATS resume score',
      hint: 'Score your active resume',
      est: '5 min',
      icon: 'resume',
      to: '/dashboard/resume',
    })
  }
  if (readyForMatches && apps.length < 3) {
    items.push({
      id: 'apply',
      title: 'Apply to 3 matched jobs',
      hint: 'Keep your pipeline moving',
      est: '20 min',
      icon: 'jobs',
      to: '/dashboard/jobs',
    })
  }
  if (scores.skillScore > 0 && scores.skillScore < 70) {
    items.push({
      id: 'learn',
      title: 'Close a skill gap',
      hint: 'Start a learning path',
      est: '15 min',
      icon: 'graduation',
      to: '/dashboard/learning',
    })
  }
  if (!items.length) {
    items.push({
      id: 'coach',
      title: 'Ask AI Coach for next steps',
      hint: 'Get a personalized plan',
      est: '5 min',
      icon: 'ai',
      to: '/dashboard/ai',
    })
  }
  return items.slice(0, 5)
}
