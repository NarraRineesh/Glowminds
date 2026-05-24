import { create } from 'zustand'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '@/services/firebase'
import { createDefaultUserDoc } from '@/constants/schema'

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
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  },

  doSignup: async (email, password, firstName, lastName) => {
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
    const cred = await signInWithPopup(auth, googleProvider)
    const existing = await getDoc(doc(db, 'users', cred.user.uid))
    if (!existing.exists()) {
      const gName = cred.user.displayName || ''
      const userDoc = createDefaultUserDoc({
        uid: cred.user.uid,
        email: cred.user.email,
        firstName: gName.split(' ')[0] || '',
        lastName: gName.split(' ').slice(1).join(' ') || '',
        displayName: gName,
        photoURL: cred.user.photoURL,
      })
      await setDoc(doc(db, 'users', cred.user.uid), {
        ...userDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    return cred.user
  },

  updatePhotoURL: async (file) => {
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
    set(s => ({ user: { ...s.user, photoURL } }))
    return photoURL
  },

  removePhotoURL: async () => {
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
    set(s => ({ user: { ...s.user, photoURL: null } }))
  },

  updateDisplayName: async (firstName, lastName) => {
    const user = auth.currentUser
    if (!user) return
    const displayName = `${firstName} ${lastName}`.trim()
    await updateProfile(user, { displayName })
    await setDoc(doc(db, 'users', user.uid), { displayName, firstName, lastName: lastName || '' }, { merge: true })
    set(s => ({ user: { ...s.user, displayName, firstName, lastName: lastName || '' } }))
  },

  doLogout: async () => {
    await signOut(auth)
    set({ loggedIn: false, user: null })
  },

  addToast: (type, msg) => {
    const id = Date.now()
    set((s) => ({ toasts: [...s.toasts, { id, type, msg }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 3500)
  },
}))

export default useAppStore
