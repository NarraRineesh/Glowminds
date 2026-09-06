import { formatCompanyDisplayName } from '@/utils/companyName'
import { catalogSearchParams } from '@/utils/jobFilters'

export const JOBS_API_BASE =
  (import.meta.env.VITE_JOBS_API_BASE_URL || 'https://api.glowminds.in').replace(/\/$/, '')

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  if (diff < 0) return 'Just now'
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}min ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function typeLabel(row) {
  const raw = String(row.employment_type_label || row.employment_type || '').toLowerCase()
  if (raw.includes('intern')) return 'Internship'
  if (raw.includes('contract')) return 'Contract'
  if (raw.includes('part')) return 'Part-time'
  if (raw.includes('full')) return 'Full-time'
  return row.employment_type_label || ''
}

function cleanPlace(value) {
  const s = String(value || '').trim()
  if (!s || /^(unavailable|unknown|n\/?a|null|none|-)$/i.test(s)) return ''
  return s
}

/** Map api.glowminds.in job rows to dashboard card/detail shape. */
export function mapCatalogJob(row) {
  if (!row) return row
  const location = [row.city, row.state, row.country].map(cleanPlace).filter(Boolean).join(', ')
  const company = formatCompanyDisplayName(row.company_name || row.company || '')
  const skills = (Array.isArray(row.skills) ? row.skills : [])
    .map((s) => String(s || '').trim())
    .filter((s) => s.length > 1)
  const postedAt = row.posted_at || row.publishedAt || null
  const remote = String(row.work_mode_label || '').toLowerCase() === 'remote'
  const description = String(row.description || row.summary || '').trim()
  return {
    id: row.id,
    title: row.title || '',
    company,
    co: company,
    logo: row.logo || '',
    location,
    loc: location,
    country: cleanPlace(row.country),
    remote,
    type: typeLabel(row),
    salary: '',
    sal: '',
    tags: skills,
    posted: timeAgo(postedAt),
    publishedAt: postedAt,
    isNew: postedAt ? Date.now() - new Date(postedAt).getTime() < 24 * 60 * 60 * 1000 : false,
    description,
    desc: description,
    descHtml: row.description_html || '',
    url: row.apply_url || row.url || '',
    source: `ats:${row.ats_label || row.ats || 'unknown'}`,
    skills,
    department: row.department || '',
    analytics: row.analytics || null,
  }
}

async function catalogFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${JOBS_API_BASE}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const message = data?.error?.message || data?.message || res.statusText || 'Catalog request failed'
    throw new Error(message)
  }
  return data
}

export async function searchJobs({ q = '', page = 1, limit = 12, country = '' } = {}) {
  const params = new URLSearchParams()
  const query = String(q || '').trim()
  if (query) params.set('q', query)
  const locationParams = catalogSearchParams(country)
  for (const [key, value] of Object.entries(locationParams)) {
    if (value) params.set(key, value)
  }
  params.set('page', String(Math.max(1, Math.trunc(page) || 1)))
  params.set('limit', String(Math.min(50, Math.max(1, Math.trunc(limit) || 12))))
  const data = await catalogFetch(`/v1/jobs?${params.toString()}`)
  const items = Array.isArray(data?.items) ? data.items : []
  const found = Number(data?.found) || items.length
  const safePage = Number(data?.page) || page
  const safeLimit = Number(data?.limit) || limit
  const totalPages = Math.max(1, Math.ceil(found / safeLimit) || 1)
  const from = items.length ? (safePage - 1) * safeLimit + 1 : 0
  const to = items.length ? from + items.length - 1 : 0
  return {
    jobs: items.map(mapCatalogJob),
    pagination: {
      page: safePage,
      pageSize: safeLimit,
      total: found,
      totalPages,
      hasMore: safePage < totalPages,
      nextCursor: null,
      from,
      to,
      totalExact: true,
    },
    queryUsed: query,
  }
}

export async function getCatalogJob(jobId) {
  const id = String(jobId || '').trim()
  if (!id) return { job: null }
  const data = await catalogFetch(`/v1/jobs/${encodeURIComponent(id)}`)
  const row = data?.job || data
  if (!row?.id) return { job: null, analytics: data?.analytics || null }
  return {
    job: mapCatalogJob({ ...row, analytics: data?.analytics }),
    analytics: data?.analytics || null,
  }
}

export async function trackJobMetric(jobId, metric) {
  const id = String(jobId || '').trim()
  if (!id || !metric) return null
  try {
    return await catalogFetch(`/v1/jobs/${encodeURIComponent(id)}/analytics`, {
      method: 'POST',
      body: { metric },
    })
  } catch {
    return null
  }
}

export async function getTopCompanies({ page = 1, limit = 12 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  const data = await catalogFetch(`/v1/trends/companies?${params}`)
  return Array.isArray(data?.items) ? data.items : []
}

export async function getTrendingSkills({ limit = 20 } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  const data = await catalogFetch(`/v1/skills/trending?${params}`)
  return Array.isArray(data?.items) ? data.items : []
}

export async function searchCatalogSkills(query, limit = 10) {
  const q = String(query || '').trim()
  if (q.length < 2) return []
  const params = new URLSearchParams({ q, limit: String(limit) })
  const data = await catalogFetch(`/v1/skills?${params}`)
  return Array.isArray(data?.items) ? data.items : []
}
