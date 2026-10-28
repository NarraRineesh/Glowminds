import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/services/apiClient'
import useAppStore from '@/store/authStore'
import { dedupeAsync } from '@/utils/dedupeAsync'

let cache = { data: null, expiresAt: 0, uid: null }
const CACHE_TTL_MS = 60_000
const listeners = new Set()

function emitCache() {
  for (const listener of listeners) listener(cache)
}

function writeCache(next) {
  cache = next
  emitCache()
}

export function subscribeEntitlements(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function freshCacheFor(uid) {
  return !!(uid && cache.uid === uid && cache.data && cache.expiresAt > Date.now())
}

/**
 * Server-authoritative entitlements (credits, limits, Pro status).
 * Shares an in-flight promise across mounts so sidebar + AI sections
 * don't stampede /entitlements under StrictMode.
 *
 * `loading` starts true when a signed-in user has no fresh cache, so
 * Pro gates don't treat "not loaded yet" as Free.
 * Every mounted hook hears cache writes, so the header credit pill
 * updates when another screen spends credits.
 */
export default function useEntitlements({ enabled = true } = {}) {
  const loggedIn = useAppStore((s) => s.loggedIn)
  const uid = useAppStore((s) => s.user?.uid)
  const [data, setData] = useState(() => (freshCacheFor(uid) ? cache.data : null))
  const [loading, setLoading] = useState(() => {
    if (!enabled) return false
    const state = useAppStore.getState()
    const id = state.user?.uid
    if (!state.loggedIn || !id) return false
    return !freshCacheFor(id)
  })
  const [error, setError] = useState(null)

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (!loggedIn || !uid) {
      setData(null)
      return null
    }

    const now = Date.now()
    if (!force && cache.uid === uid && cache.data && cache.expiresAt > now) {
      setData(cache.data)
      setLoading(false)
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
        writeCache({ data: payload, expiresAt: Date.now() + CACHE_TTL_MS, uid })
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
    if (!enabled || !loggedIn) return undefined
    void refresh()
    return undefined
  }, [enabled, loggedIn, uid, refresh])

  useEffect(() => {
    return subscribeEntitlements((next) => {
      if (next?.uid && uid && next.uid !== uid) return
      if (next?.data && (!uid || next.uid === uid)) {
        setData(next.data)
        setLoading(false)
        return
      }
      if (!next?.data && loggedIn && uid) {
        void refresh({ force: true })
      }
    })
  }, [uid, loggedIn, refresh])

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
  writeCache({ data: null, expiresAt: 0, uid: cache.uid })
}
