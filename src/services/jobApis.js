const REMOTIVE_BASE = 'https://remotive.com/api/remote-jobs'

const CATEGORY_MAP = {
  'software-dev': 'software-dev',
  'data': 'data',
  'design': 'design',
  'marketing': 'marketing',
  'product': 'product',
  'customer-support': 'customer-support',
  'devops': 'devops',
  'qa': 'qa',
}

function normalizeRemotiveJob(raw) {
  const tags = raw.tags || []
  const posted = raw.publication_date ? timeAgo(raw.publication_date) : ''
  const isNew = posted.includes('h ago') || posted.includes('min ago') || posted === 'Just now'

  return {
    id: `rem-${raw.id}`,
    title: raw.title || '',
    co: raw.company_name || '',
    logo: companyEmoji(raw.company_name),
    loc: raw.candidate_required_location || 'Remote',
    type: raw.job_type === 'full_time' ? 'Full-time'
      : raw.job_type === 'contract' ? 'Contract'
      : raw.job_type === 'internship' ? 'Internship'
      : raw.job_type === 'part_time' ? 'Part-time'
      : raw.job_type || 'Full-time',
    sal: raw.salary || '',
    tags: tags.slice(0, 6),
    posted,
    isNew,
    desc: stripHtml(raw.description || ''),
    descHtml: raw.description || '',
    url: raw.url || '',
    source: 'remotive',
    category: raw.category || '',
    match: 0,
    req: extractRequirements(raw.description || ''),
  }
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractRequirements(html) {
  const text = stripHtml(html)
  const lines = text.split(/[.;•\n]/).filter(l => l.trim().length > 15 && l.trim().length < 200)
  const reqKeywords = /experience|proficien|knowledge|familiar|skill|require|must have|strong|years/i
  const reqs = lines.filter(l => reqKeywords.test(l)).slice(0, 5)
  return reqs.length > 0 ? reqs.map(r => r.trim()) : ['See full job description for details']
}

function companyEmoji(name) {
  if (!name) return '💼'
  const n = name.toLowerCase()
  if (n.includes('google')) return '🔍'
  if (n.includes('amazon') || n.includes('aws')) return '📦'
  if (n.includes('microsoft')) return '🪟'
  if (n.includes('apple')) return '🍎'
  if (n.includes('meta') || n.includes('facebook')) return '📘'
  if (n.includes('netflix')) return '🎬'
  if (n.includes('stripe')) return '💳'
  if (n.includes('shopify')) return '🛍️'
  if (n.includes('gitlab') || n.includes('github')) return '🐙'
  const emojis = ['🏢', '🚀', '💻', '⚡', '🌐', '🔧', '📡', '🎯']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return emojis[Math.abs(hash) % emojis.length]
}

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}min ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function calculateMatchScore(job, userSkills = []) {
  if (!userSkills.length || !job.tags.length) return Math.floor(Math.random() * 20) + 65

  const normalizedUser = userSkills.map(s => s.toLowerCase())
  const normalizedTags = job.tags.map(t => t.toLowerCase())
  const jobDesc = (job.desc || '').toLowerCase()

  let score = 60
  let matched = 0
  for (const skill of normalizedUser) {
    if (normalizedTags.some(t => t.includes(skill) || skill.includes(t))) {
      matched++
    } else if (jobDesc.includes(skill)) {
      matched += 0.5
    }
  }

  const ratio = matched / Math.max(normalizedTags.length, 1)
  score += Math.round(ratio * 35)
  score = Math.min(99, Math.max(55, score))
  return score
}

export async function fetchRemotiveJobs({ search = '', category = '', limit = 30 } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (category && CATEGORY_MAP[category]) params.set('category', CATEGORY_MAP[category])
  if (limit) params.set('limit', String(limit))

  const url = `${REMOTIVE_BASE}?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Remotive API error: ${res.status}`)

  const data = await res.json()
  const jobs = (data.jobs || []).map(normalizeRemotiveJob)
  return jobs
}

export { companyEmoji, timeAgo }
