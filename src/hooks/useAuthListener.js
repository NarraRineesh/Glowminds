import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
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
        }

        setUser(baseUser)

        try {
          const uid = firebaseUser.uid
          localStorage.removeItem(`nx_onboarding_done_${uid}`)
          localStorage.removeItem('nx_onboarding_done')
        } catch { /* ignore */ }
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
      setAuthLoading(false)
    })

    return () => unsub()
  }, [setUser, setAuthLoading])
}
