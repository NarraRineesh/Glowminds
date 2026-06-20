export function embedPathFromResumeId(resumeId) {
  return resumeId ? `/builder/${resumeId}` : '/local'
}

export function dashboardPathFromEmbedPath(embedPath) {
  const normalized = embedPath.replace(/\/$/, '') || '/local'
  if (normalized === '/local') return '/dashboard/resume'
  const match = normalized.match(/^\/builder\/([^/]+)/)
  if (match) return `/dashboard/resume/${match[1]}`
  return '/dashboard/resume'
}

export function embedPathFromDashboardPath(pathname) {
  const match = pathname.match(/^\/dashboard\/resume(?:\/([^/]+))?\/?$/)
  if (!match) return '/local'
  return match[1] ? `/builder/${match[1]}` : '/local'
}
