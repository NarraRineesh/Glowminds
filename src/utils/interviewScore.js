/**
 * Percent correct for a mock interview.
 * `totalScore` is a correct-answer count, not a percent.
 * Returns null when the question total is unknown so callers don't
 * label a raw count like 16 as "16%".
 */
export function sessionPercent(session) {
  if (!session || typeof session !== 'object') return null
  const questions = Array.isArray(session.questions) ? session.questions : []
  if (questions.length > 0) {
    const correct = questions.filter((q) => q?.isCorrect).length
    const fromCount = typeof session.totalScore === 'number' ? session.totalScore : correct
    return Math.round((Math.min(fromCount, questions.length) / questions.length) * 100)
  }
  if (typeof session.percent === 'number' && session.percent >= 0 && session.percent <= 100) {
    return Math.round(session.percent)
  }
  return null
}

export function averageSessionPercent(sessions) {
  const scored = (sessions || []).map(sessionPercent).filter((n) => n != null)
  if (!scored.length) return null
  return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
}
