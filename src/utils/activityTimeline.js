import { APPLICATION_STATUS, APPLICATION_STATUS_LABEL } from '@/constants/schema'
import { parseDate } from '@/utils/parseDate'

/**
 * Derive a real activity timeline from existing user data.
 * Does not invent events — skips rows without a parseable date.
 */
export function buildActivityEvents({ apps = [], interviews = [], profile } = {}) {
  const events = []

  for (const a of apps) {
    const applied = parseDate(a.createdAt) || parseDate(a.appliedDate)
    if (applied) {
      events.push({
        id: `app-${a.id}`,
        at: applied,
        icon: 'applications',
        title: a.role ? `Applied: ${a.role}` : 'Application tracked',
        body: [a.company, APPLICATION_STATUS_LABEL[a.status] || a.status].filter(Boolean).join(' · '),
        href: '/dashboard/applications',
      })
    }
    const updated = parseDate(a.updatedAt)
    if (
      updated
      && a.status
      && a.status !== APPLICATION_STATUS.APPLIED
      && (!applied || updated.getTime() - applied.getTime() > 60_000)
    ) {
      events.push({
        id: `app-status-${a.id}`,
        at: updated,
        icon: 'review',
        title: `Moved to ${APPLICATION_STATUS_LABEL[a.status] || a.status}`,
        body: [a.role, a.company].filter(Boolean).join(' at '),
        href: '/dashboard/applications',
      })
    }
  }

  for (const session of interviews) {
    const at = parseDate(session.completedAt) || parseDate(session.createdAt)
    if (!at) continue
    const qCount = Array.isArray(session.questions) ? session.questions.length : 0
    const score = Number.isFinite(Number(session.totalScore)) ? Number(session.totalScore) : null
    events.push({
      id: `iv-${session.id}`,
      at,
      icon: 'interview',
      title: session.status === 'completed' ? 'Interview session completed' : 'Interview session started',
      body: [session.role, qCount ? `${score ?? 0}/${qCount} correct` : null].filter(Boolean).join(' · '),
      href: '/dashboard/interview',
    })
  }

  const reviewAt = parseDate(profile?.aiReview?.lastReviewedAt)
  if (reviewAt) {
    const score = profile.aiReview.overallScore ?? profile.aiReview.score
    events.push({
      id: 'resume-review',
      at: reviewAt,
      icon: 'resume',
      title: 'Resume scored',
      body: score != null ? `Score ${score}` : 'AI profile review saved',
      href: '/dashboard/resume',
    })
  }

  const linkedInAt = parseDate(profile?.linkedinAudit?.lastReviewedAt)
  if (linkedInAt) {
    const score = profile.linkedinAudit.score
    events.push({
      id: 'linkedin-audit',
      at: linkedInAt,
      icon: 'linkedin',
      title: 'LinkedIn audit saved',
      body: score != null ? `Score ${score}` : null,
      href: '/dashboard/linkedin',
    })
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime())
  return events
}
