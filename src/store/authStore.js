import { create } from 'zustand'
import { createDefaultUserDoc } from '@/constants/schema'

async function firebaseAuth() {
  const [{ auth, googleProvider, db }, authMod, fsMod] = await Promise.all([
    import('@/services/firebase'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ])
  return { auth, googleProvider, db, ...authMod, ...fsMod }
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

    return cred.user
  },

  doGoogleLogin: async () => {
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
      // Firestore merge:true still overwrites nested leaves, so merging defaults
      // would wipe experience, skills, summary, settings, etc. on every Google login.
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
      // Returning users: refresh identity fields only. Prefer Google values when
      // the stored field is empty so we don't clobber user-edited names.
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

  addToast: (type, msg) => {
    const id = Date.now()
    set((s) => ({ toasts: [...s.toasts, { id, type, msg }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
}))

export default useAppStore
