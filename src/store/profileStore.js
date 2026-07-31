import { create } from 'zustand'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import {
  createDefaultProfile,
  normalizeCoverLetterDrafts,
  normalizeProfile,
  normalizeSkills,
} from '@/constants/schema'

const PROTECTED_USER_DOC_FIELDS = new Set([
  'subscription',
  'credits',
  'billing',
  'entitlements',
])

/** True when the profile has user-entered career content worth protecting. */
export function profileHasSubstance(profile) {
  if (!profile || typeof profile !== 'object') return false
  // Explicit fresher flag is intentional state (experience may be cleared).
  if (profile.isFresher) return true
  if (String(profile.headline || '').trim() || String(profile.summary || '').trim()) return true
  const personal = profile.personal || {}
  if (personal.phone || personal.location || personal.dob || personal.gender) return true
  if (Array.isArray(personal.languages) && personal.languages.length > 0) return true
  if (Array.isArray(profile.educationList) && profile.educationList.length > 0) return true
  if (Array.isArray(profile.experience) && profile.experience.length > 0) return true
  if (Array.isArray(profile.internships) && profile.internships.length > 0) return true
  if (Array.isArray(profile.projects) && profile.projects.length > 0) return true
  if (Array.isArray(profile.certifications) && profile.certifications.length > 0) return true
  const skills = profile.skills || {}
  if ((skills.technical || []).length > 0 || (skills.soft || []).length > 0) return true
  const links = profile.links || {}
  if (links.linkedin || links.github || links.portfolio || links.twitter) return true
  const prefs = profile.preferences || {}
  if (prefs.preferredRole || prefs.expectedCTC || prefs.jobType || prefs.noticePeriod) return true
  if (Array.isArray(prefs.preferredLocations) && prefs.preferredLocations.length > 0) return true
  return false
}

function mergeProfilePatch(current, partial) {
  const patch = partial || {}
  return {
    ...current,
    ...patch,
    links: { ...current.links, ...(patch.links || {}) },
    personal: { ...current.personal, ...(patch.personal || {}) },
    preferences: {
      ...current.preferences,
      ...(patch.preferences || {}),
      jobAlerts: {
        ...(current.preferences?.jobAlerts || {}),
        ...(patch.preferences?.jobAlerts || {}),
      },
      preferredLocations:
        patch.preferences?.preferredLocations
        ?? current.preferences?.preferredLocations
        ?? [],
    },
    skills: patch.skills
      ? normalizeSkills({
        technical: patch.skills.technical ?? current.skills?.technical,
        soft: patch.skills.soft ?? current.skills?.soft,
      })
      : normalizeSkills(current.skills),
    linkedinAudit: patch.linkedinAudit !== undefined
      ? patch.linkedinAudit
      : current.linkedinAudit,
    resumeAnalysis: patch.resumeAnalysis !== undefined
      ? patch.resumeAnalysis
      : current.resumeAnalysis,
    coverLetterDrafts: patch.coverLetterDrafts !== undefined
      ? normalizeCoverLetterDrafts(patch.coverLetterDrafts)
      : normalizeCoverLetterDrafts(current.coverLetterDrafts),
    gamification: patch.gamification !== undefined
      ? patch.gamification
      : current.gamification,
    notificationPrefs: patch.notificationPrefs !== undefined
      ? patch.notificationPrefs
      : current.notificationPrefs,
  }
}

// Single source of truth for `users/{uid}` profile (and the rest of the user
// doc). All sections read/write through this store so we don't duplicate
// `getDoc(users/{uid})` calls.

const useProfileStore = create((set, get) => ({
  loading: false,
  loaded: false,
  loadedUid: null,
  user: null,         // full users/{uid} doc (or null until loaded)
  profile: createDefaultProfile(),

  reset: () => set({
    loading: false,
    loaded: false,
    loadedUid: null,
    user: null,
    profile: createDefaultProfile(),
  }),

  load: async ({ force = false } = {}) => {
    const uid = auth.currentUser?.uid
    if (!uid) return null
    if (!force && get().loaded && get().loadedUid === uid) return get().user
    set({ loading: true })
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      // Ignore stale responses after logout / account switch.
      if (auth.currentUser?.uid !== uid) {
        set({ loading: false })
        return null
      }
      const data = snap.exists() ? snap.data() : {}
      const profile = normalizeProfile(data.profile)
      set({ user: data, profile, loaded: true, loadedUid: uid, loading: false })
      return data
    } catch (err) {
      console.error('profileStore.load:', err)
      if (auth.currentUser?.uid === uid) set({ loading: false })
      return null
    }
  },

  /**
   * Refuse to persist a blank profile on top of existing cloud content.
   * Full-map `profile` writes replace nested fields — empty defaults wipe careers.
   */
  ensureSafeProfileWrite: async (uid, nextProfile) => {
    if (profileHasSubstance(nextProfile)) return normalizeProfile(nextProfile)
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (auth.currentUser?.uid !== uid) {
        throw new Error('Signed-out during profile save')
      }
      if (!snap.exists()) return normalizeProfile(nextProfile)
      const cloud = normalizeProfile(snap.data()?.profile)
      if (profileHasSubstance(cloud)) {
        console.error('profileStore: blocked empty profile overwrite')
        set({
          user: snap.data(),
          profile: cloud,
          loaded: true,
          loadedUid: uid,
          loading: false,
        })
        throw new Error('Refusing to overwrite your saved profile with empty data')
      }
    } catch (err) {
      if (err?.message?.includes('Refusing') || err?.message?.includes('Signed-out')) throw err
      console.warn('profileStore.ensureSafeProfileWrite:', err)
    }
    return normalizeProfile(nextProfile)
  },

  // Merge an arbitrary partial into `profile`. Always merges into Firestore
  // with merge:true so it composes cleanly with the rest of the user doc.
  updateProfile: async (partial) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    // Always re-read before write so we never merge onto in-memory defaults
    // after a logout/login race (that previously wiped cloud profile data).
    const loaded = await get().load({ force: true })
    if (auth.currentUser?.uid !== uid || !get().loaded || get().loadedUid !== uid) {
      throw new Error('Profile is not loaded yet')
    }
    if (!loaded && !get().loaded) {
      throw new Error('Profile is not loaded yet')
    }

    const current = get().profile
    const next = mergeProfilePatch(current, partial)
    const safeNext = await get().ensureSafeProfileWrite(uid, next)
    if (auth.currentUser?.uid !== uid) return

    set({ profile: safeNext })
    try {
      await setDoc(
        doc(db, 'users', uid),
        { profile: safeNext, updatedAt: serverTimestamp() },
        { merge: true },
      )
    } catch (err) {
      console.error('profileStore.updateProfile:', err)
      throw err
    }
  },

  // Replace the full profile (used by Profile section saves).
  replaceProfile: async (profile) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await get().load({ force: true })
    if (auth.currentUser?.uid !== uid || !get().loaded || get().loadedUid !== uid) {
      throw new Error('Profile is not loaded yet')
    }

    const next = normalizeProfile(profile)
    const safeNext = await get().ensureSafeProfileWrite(uid, next)
    if (auth.currentUser?.uid !== uid) return

    set({ profile: safeNext })
    try {
      await setDoc(
        doc(db, 'users', uid),
        { profile: safeNext, updatedAt: serverTimestamp() },
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
    // Never allow accidental profile wipes through this path.
    if (Object.prototype.hasOwnProperty.call(safe, 'profile')) {
      delete safe.profile
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
