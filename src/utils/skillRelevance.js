import { skillLabel } from './skillLabel.js'

/** Real 2-letter skills. "R", "Go", and "C" are omitted — they match letters inside other words. */
const SHORT_SKILL_ALLOW = new Set(['ui', 'ux', 'ml', 'ai', 'qa', 'c#', 'c++', 'sql', 'css', 'aws', 'gcp', 'api'])

const ROLE_RULES = [
  { re: /\b(front.?end|react|angular|vue|ui developer|web developer)\b/i, categories: ['Frontend'] },
  { re: /\b(back.?end|api developer|server.?side|node\.?js)\b/i, categories: ['Backend'] },
  { re: /\b(full.?stack|sde|software engineer|software developer|fresher|internship)\b/i, categories: ['Programming Languages', 'Frontend', 'Backend'] },
  { re: /\b(data scientist|data analyst|data engineer|analytics)\b/i, categories: ['Data Science'] },
  { re: /\b(machine learning|deep learning|\bml\b|ai engineer)\b/i, categories: ['AI/ML', 'Data Science'] },
  { re: /\b(devops|sre|platform engineer|cloud engineer)\b/i, categories: ['DevOps', 'Cloud'] },
  { re: /\b(android|ios|mobile developer|flutter|react native)\b/i, categories: ['Mobile'] },
  { re: /\b(qa engineer|quality assurance|test engineer|sdet)\b/i, categories: ['Testing'] },
  { re: /\b(ui\/ux|product designer|figma|graphic designer)\b/i, categories: ['Design'] },
  { re: /\b(product manager|product owner)\b/i, categories: ['Product Management'] },
]

const DOMAIN_SKILLS = {
  'Programming Languages': ['python', 'javascript', 'java', 'typescript', 'sql'],
  Frontend: ['react', 'typescript', 'javascript', 'html', 'css', 'vue', 'angular', 'next.js', 'redux'],
  Backend: ['nodejs', 'node.js', 'python', 'java', 'spring boot', 'express', 'sql'],
  'Data Science': ['python', 'sql', 'pandas', 'excel', 'tableau', 'power bi'],
  'AI/ML': ['python', 'machine learning', 'tensorflow', 'pytorch', 'nlp'],
  DevOps: ['docker', 'kubernetes', 'terraform', 'ci/cd', 'linux'],
  Cloud: ['aws', 'azure', 'gcp', 'kubernetes', 'docker'],
  Mobile: ['react native', 'flutter', 'android', 'ios', 'kotlin'],
  Testing: ['selenium', 'jest', 'cypress', 'playwright'],
  Design: ['figma', 'ui', 'ux', 'prototyping'],
  'Product Management': ['product management', 'agile', 'scrum', 'jira'],
}

export function normalizeSkillName(value) {
  return String(value || '').trim().toLowerCase().replace(/[_]+/g, ' ').replace(/\s+/g, ' ')
}

export function isNoiseSkillName(value) {
  const name = normalizeSkillName(value)
  if (!name || name.length < 2) return true
  if (name.length <= 2 && !SHORT_SKILL_ALLOW.has(name)) return true
  if (/^[a-z]$/i.test(name)) return true
  return false
}

/** Exact match, or a contained match only when both names are long enough to not be letters. */
export function skillsReferToSame(a, b) {
  const left = normalizeSkillName(a)
  const right = normalizeSkillName(b)
  if (!left || !right || isNoiseSkillName(left) || isNoiseSkillName(right)) return false
  if (left === right) return true
  if (left.length < 4 || right.length < 4) return false
  return left.includes(right) || right.includes(left)
}

export function categoriesForRole(role = '') {
  const found = []
  for (const rule of ROLE_RULES) {
    if (rule.re.test(role)) {
      for (const category of rule.categories) {
        if (!found.includes(category)) found.push(category)
      }
    }
  }
  return found.slice(0, 3)
}

export function relevantSkillNames(role = '') {
  const names = new Set()
  for (const category of categoriesForRole(role)) {
    for (const skill of DOMAIN_SKILLS[category] || []) names.add(skill)
  }
  return names
}

function profileSkillNames(profile) {
  const technical = Array.isArray(profile?.skills?.technical) ? profile.skills.technical : []
  const soft = Array.isArray(profile?.skills?.soft) ? profile.skills.soft : []
  return [...technical, ...soft].map(skillLabel).filter(Boolean)
}

function lookupCount(rows, name) {
  const hit = rows.find((row) => skillsReferToSame(skillLabel(row), name) || normalizeSkillName(skillLabel(row)) === normalizeSkillName(name))
  const count = Number(hit?.jobCount ?? hit?.active_job_count)
  return Number.isFinite(count) && count > 0 ? count : 0
}

/**
 * Rebuild a /skills/gap payload so short tokens and off-role catalog skills
 * are not presented as the user's gaps. Coverage is recomputed from the
 * role-relevant list. Does not call the network.
 */
export function sanitizeSkillGap(gap, profile) {
  if (!gap || typeof gap !== 'object') return gap
  const role = String(gap.targetRole || '').trim()
  const relevant = relevantSkillNames(role)
  const userSkills = profileSkillNames(profile)
  const rows = [...(gap.haveSkills || []), ...(gap.missingSkills || [])]
  const names = relevant.size
    ? [...relevant]
    : rows.map((row) => skillLabel(row)).filter((name) => name && !isNoiseSkillName(name))

  const have = []
  const missing = []
  const seen = new Set()
  for (const name of names) {
    const key = normalizeSkillName(name)
    if (!key || seen.has(key) || isNoiseSkillName(name)) continue
    seen.add(key)
    const owned = userSkills.some((skill) => skillsReferToSame(skill, name))
    const entry = {
      name: skillLabel(name) || name,
      category: categoriesForRole(role)[0] || 'Other',
      jobCount: lookupCount(rows, name),
      growth: '',
    }
    if (owned) have.push(entry)
    else missing.push(entry)
  }

  missing.sort((a, b) => (b.jobCount || 0) - (a.jobCount || 0))
  const total = have.length + missing.length
  return {
    ...gap,
    domain: gap.domain || { categories: categoriesForRole(role), label: categoriesForRole(role)[0] || null },
    coverage: total ? Math.round((have.length / total) * 100) : 0,
    haveSkills: have,
    missingSkills: missing,
  }
}

export function filterTrendSkills(rows) {
  const seen = new Set()
  const out = []
  for (const row of rows || []) {
    const name = skillLabel(row) || String(row?.skill_name || row?.name || '').trim()
    const key = normalizeSkillName(name)
    if (!key || seen.has(key) || isNoiseSkillName(name)) continue
    seen.add(key)
    out.push(typeof row === 'object' && row ? { ...row, skill_name: name, name } : { skill_name: name, name })
  }
  return out
}
