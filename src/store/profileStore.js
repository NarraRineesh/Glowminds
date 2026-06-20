import { create } from 'zustand'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import { createDefaultProfile, normalizeProfile, normalizeSkills } from '@/constants/schema'

const PROTECTED_USER_DOC_FIELDS = new Set([
  'subscription',
  'credits',
  'billing',
  'entitlements',
])

// Single source of truth for `users/{uid}` profile (and the rest of the user
// doc). All sections read/write through this store so we don't duplicate
// `getDoc(users/{uid})` calls.

const useProfileStore = create((set, get) => ({
  loading: false,
  loaded: false,
  user: null,         // full users/{uid} doc (or null until loaded)
  profile: createDefaultProfile(),

  reset: () => set({ loading: false, loaded: false, user: null, profile: createDefaultProfile() }),

  load: async ({ force = false } = {}) => {
    const uid = auth.currentUser?.uid
    if (!uid) return null
    if (!force && get().loaded) return get().user
    set({ loading: true })
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      const data = snap.exists() ? snap.data() : {}
      const profile = normalizeProfile(data.profile)
      set({ user: data, profile, loaded: true, loading: false })
      return data
    } catch (err) {
      console.error('profileStore.load:', err)
      set({ loading: false })
      return null
    }
  },

  // Merge an arbitrary partial into `profile`. Always merges into Firestore
  // with merge:true so it composes cleanly with the rest of the user doc.
  updateProfile: async (partial) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const current = get().profile
    const patch = partial || {}
    const next = {
      ...current,
      ...patch,
      links: { ...current.links, ...(patch.links || {}) },
      personal: { ...current.personal, ...(patch.personal || {}) },
      skills: patch.skills
        ? normalizeSkills({
          technical: patch.skills.technical ?? current.skills?.technical,
          soft: patch.skills.soft ?? current.skills?.soft,
        })
        : normalizeSkills(current.skills),
      linkedinAudit: patch.linkedinAudit !== undefined
        ? patch.linkedinAudit
        : current.linkedinAudit,
    }
    set({ profile: next })
    try {
      await setDoc(
        doc(db, 'users', uid),
        { profile: next, updatedAt: serverTimestamp() },
        { merge: true },
      )
    } catch (err) {
      console.error('profileStore.updateProfile:', err)
      throw err
    }
  },

  // Replace the full profile (used by Profile section "Save All").
  replaceProfile: async (profile) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const next = normalizeProfile(profile)
    set({ profile: next })
    try {
      await setDoc(
        doc(db, 'users', uid),
        { profile: next, updatedAt: serverTimestamp() },
        { merge: true },
      )
    } catch (err) {
      console.error('profileStore.replaceProfile:', err)
      throw err
    }
  },

  // Patch the full user doc (settings/flags/etc.).
  patchUserDoc: async (partial) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const safe = { ...(partial || {}) }
    for (const key of PROTECTED_USER_DOC_FIELDS) {
      delete safe[key]
    }
    set((s) => ({ user: { ...(s.user || {}), ...safe } }))
    try {
      await setDoc(
        doc(db, 'users', uid),
        { ...safe, updatedAt: serverTimestamp() },
        { merge: true },
      )
    } catch (err) {
      console.error('profileStore.patchUserDoc:', err)
    }
  },
}))

export default useProfileStore
