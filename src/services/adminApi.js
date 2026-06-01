// Thin wrappers around the /api/admin/* endpoints.
//
// Every call requires the caller to have the Firebase `admin: true` custom
// claim — the backend enforces this; the UI just gates the nav entry so
// non-admins never see the button.

import { apiFetch } from './apiClient'
import { dedupeAsync } from '@/utils/dedupeAsync'

// ----- Overview -----
export function getAdminOverview({ fresh = false } = {}) {
  const key = `GET:/admin/overview?fresh=${fresh ? '1' : '0'}`
  return dedupeAsync(key, () =>
    apiFetch(`/admin/overview${fresh ? '?fresh=true' : ''}`, { method: 'GET' }),
  )
}

// ----- Users & Pro (temporary until Razorpay billing is fully live) -----

export function searchAdminUsers({ q, limit = 20 } = {}) {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (Number.isFinite(limit)) qs.set('limit', String(limit))
  const tail = qs.toString() ? `?${qs.toString()}` : ''
  const key = `GET:/admin/users${tail}`
  return dedupeAsync(key, () => apiFetch(`/admin/users${tail}`, { method: 'GET' }))
}

export function setUserProSubscription(uid, { action, plan = 'yearly' } = {}) {
  return apiFetch(`/admin/users/${encodeURIComponent(uid)}/subscription`, {
    body: { action, plan },
  })
}

// ----- Pricing config -----

export function getAdminPricingConfig() {
  return dedupeAsync('GET:/admin/pricing', () =>
    apiFetch('/admin/pricing', { method: 'GET' }),
  )
}

export function updateAdminPricingConfig(patch) {
  return apiFetch('/admin/pricing', { method: 'PATCH', body: patch })
}
