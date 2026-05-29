// Frontend usage tracker — POSTs to /api/usage/track (see functions usage routes).
// Fire-and-forget; never block user flows on metrics.

import { apiFetch } from './apiClient'

const DEDUPE_WINDOW_MS = 1000
const recent = new Map()

export function trackToolUsage(tool, count = 1) {
  if (!tool || typeof tool !== 'string') return
  const now = Date.now()
  const last = recent.get(tool) || 0
  if (now - last < DEDUPE_WINDOW_MS) return
  recent.set(tool, now)

  apiFetch('/usage/track', {
    body: { tool, count },
    method: 'POST',
  }).catch(() => {})
}
