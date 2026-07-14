import { apiFetch } from './apiClient'
import { dedupeAsync } from '@/utils/dedupeAsync'

function usersKey(params = {}) {
  return [
    'admin-users',
    params.q || '',
    params.filter || 'all',
    params.limit || '',
    params.cursor || '',
  ].join('|')
}

export const adminApi = {
  overview: () =>
    dedupeAsync('admin-overview', () =>
      apiFetch('/admin/overview', { method: 'GET' }),
    ),

  users: (params = {}) =>
    dedupeAsync(usersKey(params), () => {
      const q = new URLSearchParams()
      if (params.q) q.set('q', params.q)
      if (params.filter) q.set('filter', params.filter)
      if (params.limit) q.set('limit', String(params.limit))
      if (params.cursor) q.set('cursor', params.cursor)
      const qs = q.toString()
      return apiFetch(`/admin/users${qs ? `?${qs}` : ''}`, { method: 'GET' })
    }),

  user: (uid) =>
    dedupeAsync(`admin-user|${uid}`, () =>
      apiFetch(`/admin/users/${encodeURIComponent(uid)}`, { method: 'GET' }),
    ),

  grantPro: (uid, body = {}) =>
    apiFetch(`/admin/users/${encodeURIComponent(uid)}/grant-pro`, { method: 'POST', body }),

  revokePro: (uid) =>
    apiFetch(`/admin/users/${encodeURIComponent(uid)}/revoke-pro`, { method: 'POST', body: {} }),

  adjustCredits: (uid, amount, note = '') =>
    apiFetch(`/admin/users/${encodeURIComponent(uid)}/adjust-credits`, {
      method: 'POST',
      body: { amount, note },
    }),

  subscriptions: (limit = 40) =>
    apiFetch(`/admin/subscriptions?limit=${limit}`, { method: 'GET' }),

  tokenUsage: (days = 30) =>
    dedupeAsync(`admin-tokens|${days}`, () =>
      apiFetch(`/admin/usage/tokens?days=${days}`, { method: 'GET' }),
    ),

  creditUsage: (limit = 100) =>
    dedupeAsync(`admin-credits|${limit}`, () =>
      apiFetch(`/admin/usage/credits?limit=${limit}`, { method: 'GET' }),
    ),

  contactMessages: (limit = 50) =>
    dedupeAsync(`admin-messages|${limit}`, () =>
      apiFetch(`/admin/contact-messages?limit=${limit}`, { method: 'GET' }),
    ),

  getPricing: () =>
    dedupeAsync('admin-pricing', () =>
      apiFetch('/admin/config/pricing', { method: 'GET' }),
    ),

  updatePricing: (pricing) =>
    apiFetch('/admin/config/pricing', { method: 'PUT', body: { pricing } }),

  jobs: (params = {}) => {
    const q = new URLSearchParams()
    if (params.q) q.set('q', params.q)
    if (params.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return apiFetch(`/admin/jobs${qs ? `?${qs}` : ''}`, { method: 'GET' })
  },

  moderateJob: (body) =>
    apiFetch('/admin/jobs/moderation', { method: 'POST', body }),
}
