import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useGamificationStore from '@/store/gamificationStore'
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

        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          const data = snap.exists() ? snap.data() : null

          if (data) {
            baseUser.firstName = data.firstName || baseUser.firstName
            baseUser.lastName = data.lastName || baseUser.lastName
            baseUser.displayName = data.displayName || baseUser.displayName
            if (data.photoURL) baseUser.photoURL = data.photoURL
            if (data.subscription) baseUser.subscription = data.subscription
            if (data.settings) baseUser.settings = data.settings
            if (data.flags) baseUser.flags = data.flags
            if (data.gamification) baseUser.gamification = data.gamification
          }
        } catch (e) {
          console.warn('useAuthListener: failed to load user doc', e)
        }

        setUser(baseUser)

        useProfileStore.getState().load({ force: true }).then((userDoc) => {
          useGamificationStore.getState().hydrateFromUser(userDoc)
          useGamificationStore.getState().recordDailyVisit().catch(() => {})
        }).catch(() => {})
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
      }
      setAuthLoading(false)
    })

    return () => unsub()
  }, [setUser, setAuthLoading])
}
