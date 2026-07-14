import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/services/apiClient'
import useAppStore from '@/store/authStore'
import { dedupeAsync } from '@/utils/dedupeAsync'

let cache = { data: null, expiresAt: 0, uid: null }
const CACHE_TTL_MS = 60_000

/**
 * Server-authoritative entitlements (credits, limits, Pro status).
 * Shares an in-flight promise across mounts so sidebar + AI sections
 * don't stampede /entitlements under StrictMode.
 */
export default function useEntitlements({ enabled = true } = {}) {
  const loggedIn = useAppStore((s) => s.loggedIn)
  const uid = useAppStore((s) => s.user?.uid)
  const [data, setData] = useState(cache.uid === uid ? cache.data : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (!loggedIn || !uid) {
      setData(null)
      return null
    }

    const now = Date.now()
    if (!force && cache.uid === uid && cache.data && cache.expiresAt > now) {
      setData(cache.data)
      return cache.data
    }

    setLoading(true)
    setError(null)
    try {
      const result = await dedupeAsync(`entitlements|${uid}|${force ? 'force' : 'soft'}`, async () => {
        if (!force && cache.uid === uid && cache.data && cache.expiresAt > Date.now()) {
          return cache.data
        }
        const payload = await apiFetch('/entitlements', { method: 'GET' })
        cache = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS, uid }
        return payload
      })
      setData(result)
      return result
    } catch (err) {
      setError(err)
      try {
        useAppStore.getState().addToast?.('error', 'Could not load credits. Some AI tools may be unavailable — retry shortly.')
      } catch { /* store may not be ready */ }
      return null
    } finally {
      setLoading(false)
    }
  }, [loggedIn, uid])

  useEffect(() => {
    if (!enabled || !loggedIn) return
    void refresh()
  }, [enabled, loggedIn, uid, refresh])

  return {
    entitlements: data,
    loading,
    error,
    refresh,
    isPro: !!data?.isPro,
    credits: data?.credits ?? null,
    creditCosts: data?.creditCosts ?? null,
    freeLimits: data?.freeLimits ?? null,
  }
}

export function invalidateEntitlementsCache() {
  cache = { data: null, expiresAt: 0, uid: null }
}
