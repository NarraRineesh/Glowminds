import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import { detectAndroidApp } from '@/utils/nativeApp'
import { isAppHost } from '@/config/hosts'

/** Routes that need auth state before first interactive paint. */
function needsAuthUrgently(pathname) {
  return (
    detectAndroidApp() ||
    isAppHost() ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/admin')
  )
}

/** True after the first onAuthStateChanged callback in this tab. */
let authResolvedOnce = false
/** Prevent duplicate Firebase auth subscriptions across remounts. */
let authListenerStarted = false

export default function useAuthListener() {
  const location = useLocation()
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)
  const setUserRef = useRef(setUser)
  const setAuthLoadingRef = useRef(setAuthLoading)
  setUserRef.current = setUser
  setAuthLoadingRef.current = setAuthLoading

  // Gate protected routes until the first auth callback — without restarting
  // the Firebase listener on every client-side navigation (that churn caused
  // profile load/reset races that could wipe saved profile data).
  useEffect(() => {
    if (needsAuthUrgently(location.pathname) && !authResolvedOnce) {
      setAuthLoading(true)
    }
  }, [location.pathname, setAuthLoading])

  useEffect(() => {
    if (authListenerStarted) return undefined
    authListenerStarted = true

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

      if (cancelled) return

      // A new auth state means whatever stale 401 we logged out of is over.
      resetUnauthorizedGuard()
      if (firebaseUser) {
        const uid = firebaseUser.uid
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

        if (cancelled) return
        // Ignore stale auth callbacks after a quick logout / account switch.
        const { auth } = await import('@/services/firebase')
        if (auth.currentUser?.uid !== uid) return

        const baseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          isAdmin,
          emailVerified: firebaseUser.emailVerified === true,
          providerIds: (firebaseUser.providerData || []).map((p) => p.providerId),
        }

        if (userDoc) {
          baseUser.firstName = userDoc.firstName || baseUser.firstName
          baseUser.lastName = userDoc.lastName || baseUser.lastName
          baseUser.displayName = userDoc.displayName || baseUser.displayName
          if (userDoc.photoURL) baseUser.photoURL = userDoc.photoURL
          if (userDoc.settings) baseUser.settings = userDoc.settings
          if (userDoc.flags) baseUser.flags = userDoc.flags
        }

        setUserRef.current(baseUser)
      } else {
        setUserRef.current(null)
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
      setAuthLoadingRef.current(false)
    }

    const start = async () => {
      const [{ onAuthStateChanged }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('@/services/firebase'),
      ])
      if (cancelled) return
      unsub = onAuthStateChanged(auth, handleUser)
    }

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
    if (needsAuthUrgently(pathname)) {
      if (!authResolvedOnce) setAuthLoadingRef.current(true)
      start()
    } else {
      if (!authResolvedOnce) setAuthLoadingRef.current(false)
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => start(), { timeout: 2500 })
      } else {
        timerId = window.setTimeout(start, 1200)
      }
    }

    return () => {
      cancelled = true
      authListenerStarted = false
      if (idleId != null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
      if (timerId != null) window.clearTimeout(timerId)
      unsub()
    }
  }, [])
}
