import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useGamificationStore from '@/store/gamificationStore'
import useTrackerStore from '@/store/trackerStore'
import useJobStore from '@/store/jobStore'
import useInterviewStore from '@/store/interviewStore'
import useAiChatStore from '@/store/aiChatStore'
import { resetUnauthorizedGuard } from '@/services/apiClient'

export default function useAuthListener() {
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // A new auth state means whatever stale 401 we logged out of is over.
      resetUnauthorizedGuard()
      if (firebaseUser) {
        const baseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          isAdmin: false,
        }

        // Read the `admin` custom claim from the ID token. Granted via
        // Admin SDK (`setCustomUserClaims(uid, { admin: true })`) and
        // surfaced here so the UI can gate the admin nav/page.
        try {
          const tokenResult = await firebaseUser.getIdTokenResult()
          baseUser.isAdmin = tokenResult?.claims?.admin === true
        } catch (e) {
          console.warn('useAuthListener: failed to read token claims', e)
        }

        // Single users/{uid} read — load it through profileStore so the rest
        // of the app shares the same cached snapshot. Previously we also did
        // a direct getDoc here, doubling the read cost of every login/refresh.
        let userDoc = null
        try {
          userDoc = await useProfileStore.getState().load({ force: true })
        } catch (e) {
          console.warn('useAuthListener: failed to load user doc', e)
        }

        if (userDoc) {
          baseUser.firstName = userDoc.firstName || baseUser.firstName
          baseUser.lastName = userDoc.lastName || baseUser.lastName
          baseUser.displayName = userDoc.displayName || baseUser.displayName
          if (userDoc.photoURL) baseUser.photoURL = userDoc.photoURL
          if (userDoc.subscription) baseUser.subscription = userDoc.subscription
          if (userDoc.settings) baseUser.settings = userDoc.settings
          if (userDoc.flags) baseUser.flags = userDoc.flags
          if (userDoc.gamification) baseUser.gamification = userDoc.gamification
        }

        setUser(baseUser)

        // hydrateFromUser is a pure local op; recordDailyVisit short-circuits
        // when the in-memory `lastActiveDate` already equals today.
        if (userDoc) useGamificationStore.getState().hydrateFromUser(userDoc)
        useGamificationStore.getState().recordDailyVisit().catch(() => {})
        useGamificationStore.getState().loadCatalog().catch(() => {})

        try {
          const uid = firebaseUser.uid
          localStorage.removeItem('nx_daily_quiz_state')
          localStorage.removeItem(`nx_onboarding_done_${uid}`)
          localStorage.removeItem('nx_onboarding_done')
          localStorage.removeItem(`nx_quiz_prompt_seen_${uid}`)
          localStorage.removeItem('nx_quiz_prompt_seen')
        } catch { /* ignore */ }
      } else {
        setUser(null)
        useProfileStore.getState().reset()
        useGamificationStore.getState().reset()
        // Per-user caches must be cleared on logout so a different account
        // signing in on the same browser tab never sees the previous user's
        // applications / saved jobs / interview history / chat list.
        useTrackerStore.getState().reset()
        useJobStore.getState().reset()
        useInterviewStore.getState().reset()
        useAiChatStore.getState().reset()
      }
      setAuthLoading(false)
    })

    return () => unsub()
  }, [setUser, setAuthLoading])
}
