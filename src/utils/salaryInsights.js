/** Map GlowMinds careerLevel → salary table level id. */
export function mapCareerLevelToSalary(careerLevel) {
  switch (careerLevel) {
    case 'fresher':
      return 'fresher'
    case '0-2':
      return 'junior'
    case '2-5':
      return 'mid'
    case '5+':
      return 'senior'
    default:
      return ''
  }
}

/** Best-effort match of headline/job type to a salary role key. */
export function matchSalaryRole(roles, ...candidates) {
  if (!roles?.length) return ''
  const hay = roles.map((r) => r.toLowerCase())
  for (const raw of candidates) {
    const q = String(raw || '').toLowerCase().trim()
    if (!q) continue
    const exact = hay.findIndex((r) => r === q)
    if (exact >= 0) return roles[exact]
    const includes = hay.findIndex((r) => q.includes(r) || r.includes(q.split(/[|/·,–-]/)[0]?.trim()))
    if (includes >= 0) return roles[includes]
    const tokens = q.split(/\s+/).filter((t) => t.length > 2)
    let best = -1
    let bestScore = 0
    hay.forEach((r, i) => {
      const score = tokens.filter((t) => r.includes(t)).length
      if (score > bestScore) {
        bestScore = score
        best = i
      }
    })
    if (bestScore >= 1 && best >= 0) return roles[best]
  }
  return roles[0] || ''
}

/** Match profile location / preferred city to salary city keys. */
export function matchSalaryCity(cities, ...candidates) {
  if (!cities?.length) return 'Bangalore'
  for (const raw of candidates) {
    const q = String(raw || '').toLowerCase().trim()
    if (!q) continue
    const hit = cities.find((c) => {
      const cl = c.toLowerCase()
      return q.includes(cl) || cl.includes(q) || (q.includes('delhi') && cl.includes('delhi'))
        || (q.includes('bengaluru') && cl.includes('bangalore'))
        || (q.includes('gurgaon') && cl.includes('delhi'))
        || (q.includes('noida') && cl.includes('delhi'))
    })
    if (hit) return hit
  }
  return cities.includes('Bangalore') ? 'Bangalore' : cities[0]
}

/**
 * Parse expected CTC strings like "12 LPA", "6–12 LPA", "₹15L" into a midpoint LPA number.
 * Returns null if unparseable.
 */
export function parseExpectedCtcLpa(raw) {
  if (raw == null || raw === '') return null
  const s = String(raw).replace(/,/g, '').trim()
  if (!s) return null
  const nums = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(lpa|lacs?|lakhs?|l\b)?/gi)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n > 0 && n < 500)
  if (!nums.length) {
    const plain = s.match(/(\d+(?:\.\d+)?)/)
    if (!plain) return null
    const n = Number(plain[1])
    return Number.isFinite(n) && n > 0 && n < 500 ? n : null
  }
  if (nums.length === 1) return nums[0]
  return Math.round(((nums[0] + nums[1]) / 2) * 10) / 10
}

/** Where the expected ask sits vs a [low, high] LPA range. */
export function compareExpectedToRange(expectedLpa, range) {
  if (expectedLpa == null || !range) return null
  const [low, high] = range
  if (!(high > 0)) return null
  if (expectedLpa < low) {
    return { status: 'below', label: 'Below market low', hint: 'You may be leaving money on the table — consider anchoring nearer the median.' }
  }
  if (expectedLpa > high) {
    return { status: 'above', label: 'Above typical high', hint: 'Be ready to justify with strong outcomes, rare skills, or equity tradeoffs.' }
  }
  const median = (low + high) / 2
  if (expectedLpa <= median) {
    return { status: 'low-mid', label: 'Within range (lower half)', hint: 'Solid floor. You can still stretch toward median+ with proof points.' }
  }
  return { status: 'high-mid', label: 'Within range (upper half)', hint: 'Competitive ask. Lead with impact stories in the negotiation.' }
}
