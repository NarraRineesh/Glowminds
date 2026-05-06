import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'
import useAppStore from '@/store/authStore'

export default function useAuthListener() {
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const baseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        }
        // Merge Firestore profile data (firstName, lastName, photoURL may differ)
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (snap.exists()) {
            const d = snap.data()
            baseUser.firstName = d.firstName || baseUser.firstName
            baseUser.lastName = d.lastName || baseUser.lastName
            baseUser.displayName = d.displayName || baseUser.displayName
            // Firestore photoURL takes priority (uploaded avatars)
            if (d.photoURL) baseUser.photoURL = d.photoURL
            // Subscription data
            if (d.subscription) baseUser.subscription = d.subscription
          }
        } catch { /* fallback to auth-only data */ }
        setUser(baseUser)
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    })

    return () => unsub()
  }, [setUser, setAuthLoading])
}
