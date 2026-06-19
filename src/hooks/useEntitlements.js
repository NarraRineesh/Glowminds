import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/services/apiClient'
import useAppStore from '@/store/authStore'

let cache = { data: null, expiresAt: 0, uid: null }
const CACHE_TTL_MS = 30_000

/**
 * Server-authoritative entitlements (credits, limits, Pro status).
 */
export default function useEntitlements({ enabled = true } = {}) {
  const loggedIn = useAppStore((s) => s.loggedIn)
  const uid = useAppStore((s) => s.user?.uid)
  const isAdmin = useAppStore((s) => s.user?.isAdmin)
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
      const result = await apiFetch('/entitlements', { method: 'GET' })
      cache = { data: result, expiresAt: now + CACHE_TTL_MS, uid }
      setData(result)
      return result
    } catch (err) {
      setError(err)
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
    isPro: !!(data?.isPro || isAdmin),
    creditBalance: data?.credits?.balance ?? null,
    creditCosts: data?.creditCosts ?? null,
    freeLimits: data?.freeLimits ?? null,
  }
}

export function invalidateEntitlementsCache() {
  cache = { data: null, expiresAt: 0, uid: null }
}
