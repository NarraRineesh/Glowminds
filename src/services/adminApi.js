// Thin wrappers around the /api/admin/* endpoints.
//
// Every call requires the caller to have the Firebase `admin: true` custom
// claim — the backend enforces this; the UI just gates the nav entry so
// non-admins never see the button.

import { apiFetch } from './apiClient'

// ----- Overview -----
export function getAdminOverview({ fresh = false } = {}) {
  return apiFetch(`/admin/overview${fresh ? '?fresh=true' : ''}`, { method: 'GET' })
}

// ----- Tool usage -----
export function getUsageAggregate({ fresh = false } = {}) {
  return apiFetch(`/usage/aggregate${fresh ? '?fresh=true' : ''}`, { method: 'GET' })
}

// ----- Companies -----
//
// Server-side paginated. Returns { companies, nextCursor, hasMore }.
// Pass `cursor` from the previous response to fetch the next page.
// When `q` is set the backend ignores the cursor and returns the first
// `limit` matches from a 500-doc pool.
export function listCompanies({ ats, active, cursor, q, limit } = {}) {
  const qs = new URLSearchParams()
  if (ats) qs.set('ats', ats)
  if (active === true) qs.set('active', 'true')
  if (active === false) qs.set('active', 'false')
  if (cursor) qs.set('cursor', cursor)
  if (q) qs.set('q', q)
  if (Number.isFinite(limit)) qs.set('limit', String(limit))
  const tail = qs.toString() ? `?${qs.toString()}` : ''
  return apiFetch(`/admin/companies${tail}`, { method: 'GET' })
}

export function createCompany(payload) {
  return apiFetch('/admin/companies', { body: payload })
}

// Bulk-import: accepts an array of company payloads. Each item is
// validated/created independently; the response carries per-item status.
//
// Large lists are sliced into chunks of `batchSize` and posted serially so
// no single request hits the backend cap or HTTP/server timeout. Per-batch
// results (and per-item indexes) are stitched back into a single response
// matching the single-batch shape, so callers can treat the response the
// same way regardless of input size.
//
// Pass `onProgress({ batch, totalBatches, processed, total })` to drive a
// progress bar.
const BULK_BATCH_SIZE = 250

export async function bulkCreateCompanies(companies, { onProgress } = {}) {
  const list = Array.isArray(companies) ? companies : []
  if (list.length === 0) {
    return {
      summary: { total: 0, created: 0, skipped: 0, failed: 0 },
      results: [],
    }
  }

  const batches = []
  for (let i = 0; i < list.length; i += BULK_BATCH_SIZE) {
    batches.push(list.slice(i, i + BULK_BATCH_SIZE))
  }

  const merged = {
    summary: {
      total: list.length,
      created: 0,
      skipped: 0,
      failed: 0,
    },
    results: [],
  }

  let processed = 0
  for (let b = 0; b < batches.length; b += 1) {
    const chunk = batches[b]
    onProgress?.({
      batch: b + 1,
      totalBatches: batches.length,
      processed,
      total: list.length,
    })

    try {
      const r = await apiFetch('/admin/companies/bulk', {
        body: { companies: chunk },
      })
      merged.summary.created += r?.summary?.created || 0
      merged.summary.skipped += r?.summary?.skipped || 0
      merged.summary.failed += r?.summary?.failed || 0
      const offset = b * BULK_BATCH_SIZE
      for (const row of r?.results || []) {
        merged.results.push({ ...row, index: (row.index ?? 0) + offset })
      }
    } catch (err) {
      // A batch-level failure shouldn't kill the rest — mark every item in
      // this batch as errored and move on.
      const offset = b * BULK_BATCH_SIZE
      for (let i = 0; i < chunk.length; i += 1) {
        merged.results.push({
          index: offset + i,
          slug: chunk[i]?.slug || null,
          status: 'error',
          reason: err?.message || 'Network error',
        })
      }
      merged.summary.failed += chunk.length
    }

    processed += chunk.length
  }

  onProgress?.({
    batch: batches.length,
    totalBatches: batches.length,
    processed,
    total: list.length,
  })

  return merged
}

export function updateCompany(slug, patch) {
  return apiFetch(`/admin/companies/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: patch,
  })
}

export function deleteCompany(slug) {
  return apiFetch(`/admin/companies/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  })
}

export function syncOneCompany(slug, { force = false } = {}) {
  return apiFetch(
    `/admin/companies/${encodeURIComponent(slug)}/sync${force ? '?force=true' : ''}`,
    { body: {} },
  )
}

// ----- Bulk sync + history -----
export function syncAll({ provider, force = false, dryRun = false } = {}) {
  return apiFetch('/admin/sync', {
    body: { provider, force, dryRun },
  })
}

export function getSyncStatus() {
  return apiFetch('/admin/sync/status', { method: 'GET' })
}

export function listSyncRuns({ limit = 25, provider } = {}) {
  const qs = new URLSearchParams()
  qs.set('limit', String(limit))
  if (provider) qs.set('provider', provider)
  return apiFetch(`/admin/sync-runs?${qs.toString()}`, { method: 'GET' })
}
