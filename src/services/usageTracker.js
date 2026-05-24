// Frontend usage tracker.
//
// Records a single tool-use event by POSTing to /api/usage/track. The
// backend writes both per-user (users/{uid}.usage.{tool}) and global
// (metrics/global) counters atomically.
//
// Design notes:
//  - Fire-and-forget: callers MUST NOT await this. We swallow all errors
//    so a network blip never breaks the actual user action.
//  - In-memory dedupe: bursts of the same tool from the same render get
//    coalesced inside a short window to avoid over-counting things like
//    a debounced "save" button.
//  - Allowlist of tool keys lives on the backend (single source of truth).
//
// Server-side automatic tracking already covers:
//   - every /api/ai/* endpoint  (key = `ai.<task>`)
//   - /api/jobs/search          (key = `jobs.search`)
//   - /api/jobs/top-matches     (key = `jobs.topMatches`)
//
// Use trackToolUsage only for UI-only tools that don't hit the backend.

import { apiFetch } from './apiClient'

const DEDUPE_WINDOW_MS = 1000
const recent = new Map()

export function trackToolUsage(tool, count = 1) {
  if (!tool || typeof tool !== 'string') return
  const now = Date.now()
  const last = recent.get(tool) || 0
  if (now - last < DEDUPE_WINDOW_MS) return
  recent.set(tool, now)

  // Intentionally not awaited.
  apiFetch('/usage/track', {
    body: { tool, count },
    method: 'POST',
  }).catch(() => {
    // Tracking failures are non-fatal. Don't log to avoid console noise
    // when offline; the backend has its own warn-level log.
  })
}
