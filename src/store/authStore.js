import { create } from 'zustand'
import { createDefaultUserDoc } from '@/constants/schema'
import { authContinueUrl } from '@/config/hosts'

function verificationActionCodeSettings() {
  return {
    url: authContinueUrl('/login'),
    handleCodeInApp: false,
  }
}

async function firebaseAuth() {
  const [{ auth, googleProvider, db }, authMod, fsMod] = await Promise.all([
    import('@/services/firebase'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ])
  return { auth, googleProvider, db, ...authMod, ...fsMod }
}

let googleSignInFlight = null

/** True when this window is the Google popup, not the tab the user clicked in. */
export function isGoogleAuthPopup() {
  if (typeof window === 'undefined') return false
  try {
    return !!(window.opener && window.opener !== window && !window.opener.closed)
  } catch {
    return false
  }
}

async function googleSignIn() {
  const { auth, googleProvider, db, signInWithPopup, doc, setDoc, getDoc, serverTimestamp } =
    await firebaseAuth()
  const cred = await signInWithPopup(auth, googleProvider)
  const userRef = doc(db, 'users', cred.user.uid)
  const existing = await getDoc(userRef)
  const gName = cred.user.displayName || ''
  const firstName = gName.split(' ')[0] || ''
  const lastName = gName.split(' ').slice(1).join(' ') || ''

  if (!existing.exists()) {
    // New users only — never write createDefaultUserDoc over an existing account.
    const userDoc = createDefaultUserDoc({
      uid: cred.user.uid,
      email: cred.user.email,
      firstName,
      lastName,
      displayName: gName,
      photoURL: cred.user.photoURL,
    })
    await setDoc(userRef, {
      ...userDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    const prev = existing.data() || {}
    await setDoc(userRef, {
      email: cred.user.email || prev.email || '',
      displayName: prev.displayName || gName || '',
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || lastName,
      photoURL: prev.photoURL || cred.user.photoURL || null,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }
  return cred.user
}

const useAppStore = create((set) => ({
  authLoading: true,
  loggedIn: false,
  user: null,
  toasts: [],

  setAuthLoading: (loading) => set({ authLoading: loading }),

  setUser: (firebaseUser) => {
    if (firebaseUser) {
      set({ loggedIn: true, user: firebaseUser })
    } else {
      set({ loggedIn: false, user: null })
    }
  },

  doLogin: async (email, password) => {
    const { auth, signInWithEmailAndPassword } = await firebaseAuth()
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  },

  doSignup: async (email, password, firstName, lastName) => {
    const { auth, db, createUserWithEmailAndPassword, updateProfile, doc, setDoc, serverTimestamp } =
      await firebaseAuth()
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const displayName = `${firstName} ${lastName}`.trim()
    await updateProfile(cred.user, { displayName })

    const userDoc = createDefaultUserDoc({
      uid: cred.user.uid,
      email: cred.user.email,
      firstName,
      lastName: lastName || '',
      displayName,
    })
    await setDoc(doc(db, 'users', cred.user.uid), {
      ...userDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const { sendEmailVerification } = await import('firebase/auth')
    await sendEmailVerification(cred.user, verificationActionCodeSettings())

    return cred.user
  },

  resendVerificationEmail: async () => {
    const { auth } = await firebaseAuth()
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const { sendEmailVerification } = await import('firebase/auth')
    await sendEmailVerification(user, verificationActionCodeSettings())
  },

  refreshEmailVerification: async () => {
    const { auth, db, doc, setDoc, serverTimestamp } = await firebaseAuth()
    const user = auth.currentUser
    if (!user) return false
    await user.reload()
    const verified = auth.currentUser?.emailVerified === true
    if (verified) {
      await setDoc(
        doc(db, 'users', user.uid),
        { emailVerified: true, updatedAt: serverTimestamp() },
        { merge: true },
      )
      set((s) => ({
        user: s.user ? { ...s.user, emailVerified: true } : s.user,
      }))
    }
    return verified
  },

  doGoogleLogin: () => {
    if (googleSignInFlight) return googleSignInFlight
    googleSignInFlight = googleSignIn().finally(() => {
      googleSignInFlight = null
    })
    return googleSignInFlight
  },

  updatePhotoURL: async (file) => {
    const { auth, db, doc, setDoc } = await firebaseAuth()
    const user = auth.currentUser
    if (!user || !file) return
    // Compress & convert to base64 data URL (avoids Storage CORS issues)
    const photoURL = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 200
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        // Center-crop
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
    // Store in Firestore only (Firebase Auth rejects data URIs for photoURL)
    await setDoc(doc(db, 'users', user.uid), { photoURL }, { merge: true })
    set((s) => ({ user: { ...s.user, photoURL } }))
    return photoURL
  },

  removePhotoURL: async () => {
    const { auth, db, doc, setDoc, updateProfile } = await firebaseAuth()
    const user = auth.currentUser
    if (!user) return
    // Clear in Firestore (UI key) and on the Firebase Auth user so
    // displayName-driven fallbacks (initials) take over everywhere.
    await setDoc(doc(db, 'users', user.uid), { photoURL: null }, { merge: true })
    try {
      await updateProfile(user, { photoURL: null })
    } catch (err) {
      // Auth side can be flaky if user signed in via a different provider —
      // Firestore is the source of truth so we don't block on it.
      console.warn('removePhotoURL auth profile clear:', err?.message || err)
    }
    set((s) => ({ user: { ...s.user, photoURL: null } }))
  },

  updateDisplayName: async (firstName, lastName) => {
    const { auth, db, doc, setDoc, updateProfile } = await firebaseAuth()
    const user = auth.currentUser
    if (!user) return
    const displayName = `${firstName} ${lastName}`.trim()
    await updateProfile(user, { displayName })
    await setDoc(doc(db, 'users', user.uid), { displayName, firstName, lastName: lastName || '' }, { merge: true })
    set((s) => ({ user: { ...s.user, displayName, firstName, lastName: lastName || '' } }))
  },

  /** Single display-name field (Settings) — splits into first/last for Firestore. */
  updateDisplayNameString: async (rawName) => {
    const { auth, db, doc, setDoc, updateProfile } = await firebaseAuth()
    const user = auth.currentUser
    if (!user) return
    const displayName = String(rawName || '').trim()
    if (!displayName) throw new Error('Display name cannot be empty')
    const parts = displayName.split(/\s+/).filter(Boolean)
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''
    await updateProfile(user, { displayName })
    await setDoc(
      doc(db, 'users', user.uid),
      { displayName, firstName, lastName },
      { merge: true },
    )
    set((s) => ({
      user: { ...s.user, displayName, firstName, lastName },
    }))
  },

  doLogout: async () => {
    const { auth, signOut } = await firebaseAuth()
    await signOut(auth)
    set({ loggedIn: false, user: null })
  },

  addToast: (type, msg, options = {}) => {
    const id = options.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((s) => ({
      toasts: [...s.toasts.filter((t) => t.id !== id), { id, type, msg }],
    }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
}))

export default useAppStore
