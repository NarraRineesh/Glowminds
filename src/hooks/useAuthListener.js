import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import useAppStore from '@/store/authStore'

/** Routes that need auth state before first interactive paint. */
function needsAuthUrgently(pathname) {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/u/')
  )
}

/** True after the first onAuthStateChanged callback in this tab. */
let authResolvedOnce = false

export default function useAuthListener() {
  const location = useLocation()
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)

  useEffect(() => {
    let cancelled = false
    let unsub = () => {}
    let idleId
    let timerId

    const handleUser = async (firebaseUser) => {
      // Lazy-load Firebase-touching modules so marketing `/` stays off the auth graph.
      const [
        { resetUnauthorizedGuard },
        { default: useProfileStore },
        { default: useTrackerStore },
        { default: useJobStore },
        { default: useInterviewStore },
        { default: useAiChatStore },
      ] = await Promise.all([
        import('@/services/apiClient'),
        import('@/store/profileStore'),
        import('@/store/trackerStore'),
        import('@/store/jobStore'),
        import('@/store/interviewStore'),
        import('@/store/aiChatStore'),
      ])

      // A new auth state means whatever stale 401 we logged out of is over.
      resetUnauthorizedGuard()
      if (firebaseUser) {
        // Token claims and the users/{uid} doc are independent — fetching them
        // sequentially doubled the auth-boot time that gates first dashboard render.
        const [isAdmin, userDoc] = await Promise.all([
          firebaseUser
            .getIdTokenResult()
            .then((token) => token?.claims?.isAdmin === true)
            .catch(() => false),
          useProfileStore
            .getState()
            .load({ force: true })
            .catch((e) => {
              console.warn('useAuthListener: failed to load user doc', e)
              return null
            }),
        ])

        const baseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          isAdmin,
        }

        if (userDoc) {
          baseUser.firstName = userDoc.firstName || baseUser.firstName
          baseUser.lastName = userDoc.lastName || baseUser.lastName
          baseUser.displayName = userDoc.displayName || baseUser.displayName
          if (userDoc.photoURL) baseUser.photoURL = userDoc.photoURL
          if (userDoc.settings) baseUser.settings = userDoc.settings
          if (userDoc.flags) baseUser.flags = userDoc.flags
        }

        setUser(baseUser)
      } else {
        setUser(null)
        useProfileStore.getState().reset()
        // Per-user caches must be cleared on logout so a different account
        // signing in on the same browser tab never sees the previous user's
        // applications / saved jobs / interview history / chat list.
        useTrackerStore.getState().reset()
        useJobStore.getState().reset()
        useInterviewStore.getState().reset()
        useAiChatStore.getState().reset()
      }
      authResolvedOnce = true
      setAuthLoading(false)
    }

    const start = async () => {
      // Keep Firebase off the marketing critical path — dynamic import after first paint.
      const [{ onAuthStateChanged }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('@/services/firebase'),
      ])
      if (cancelled) return
      unsub = onAuthStateChanged(auth, handleUser)
    }

    const urgent = needsAuthUrgently(location.pathname)
    if (urgent) {
      // Gate protected routes until the first auth callback (skip if already resolved).
      if (!authResolvedOnce) setAuthLoading(true)
      start()
    } else {
      // Marketing pages: unblock UI immediately; hydrate auth when the browser is idle.
      if (!authResolvedOnce) setAuthLoading(false)
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => start(), { timeout: 2500 })
      } else {
        timerId = window.setTimeout(start, 1200)
      }
    }

    return () => {
      cancelled = true
      if (idleId != null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
      if (timerId != null) window.clearTimeout(timerId)
      unsub()
    }
  }, [location.pathname, setUser, setAuthLoading])
}
