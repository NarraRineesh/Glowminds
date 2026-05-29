import { create } from 'zustand'
import { collection, getDocs, query, orderBy, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import { createDefaultGamification } from '@/constants/schema'
import { BADGES_CATALOG } from '@/constants/badgesCatalog'
import {
  getEligibleBadgeIds,
  isProfileCompleteForBadge,
  isLinkedInOptimized,
  hasApplicationStatus,
} from '@/utils/gamification'
import { todayKey, yesterdayKey } from '@/utils/dateKeys'
import useProfileStore from '@/store/profileStore'
import useAppStore from '@/store/authStore'
import useTrackerStore from '@/store/trackerStore'
import useInterviewStore from '@/store/interviewStore'
import useAiChatStore from '@/store/aiChatStore'

// Session-scoped memo for the three counters that previously triggered up
// to three separate Firestore scans on every syncEligibleBadges call. The
// store mutators (interview completeSession / chat appendMessage / resume
// save) keep these in sync, and we re-derive on demand from store state
// before falling back to anything more expensive.
//
// Keyed by uid so a user-switch on the same tab doesn't reuse stale numbers.
const ctxCache = { uid: null, interviewCount: null, resumeCount: null, aiChatCount: null }

function resetCtxCache(uid) {
  ctxCache.uid = uid || null
  ctxCache.interviewCount = null
  ctxCache.resumeCount = null
  ctxCache.aiChatCount = null
}

function deriveInterviewCount() {
  const sessions = useInterviewStore.getState().sessions || []
  if (sessions.length === 0) return null
  return sessions.filter((s) => s.status === 'completed').length
}

function deriveAiChatCount() {
  const chats = useAiChatStore.getState().chats || []
  if (chats.length === 0) return null
  return chats.filter((c) => (c.messageCount || 0) > 0).length
}

function deriveResumeCount() {
  // Resume metadata lives on the user doc — no fallback scan needed once
  // profileStore is loaded.
  const userDoc = useProfileStore.getState().user
  if (!userDoc) return null
  return userDoc.flags?.defaultResumeId ? 1 : 0
}

async function gatherBadgeContext(overrides = {}) {
  const uid = auth.currentUser?.uid
  if (!uid) return null
  if (ctxCache.uid !== uid) resetCtxCache(uid)

  const profile = useProfileStore.getState().profile
  const authUser = useAppStore.getState().user
  const gam = useGamificationStore.getState().gamification
  const apps = useTrackerStore.getState().apps || []

  // For each counter: caller override > store-derived value > cached value
  // > zero. We never re-scan a Firestore collection here — the read-once
  // patterns in interview/aiChat/profile stores handle the initial load.
  const interviewCount =
    overrides.interviewCount ??
    deriveInterviewCount() ??
    ctxCache.interviewCount ??
    0
  ctxCache.interviewCount = interviewCount

  const resumeCount =
    overrides.resumeCount ??
    deriveResumeCount() ??
    ctxCache.resumeCount ??
    0
  ctxCache.resumeCount = resumeCount

  const aiChatCount =
    overrides.aiChatCount ??
    deriveAiChatCount() ??
    ctxCache.aiChatCount ??
    0
  ctxCache.aiChatCount = aiChatCount

  return {
    earnedBadgeIds: gam.earnedBadgeIds || [],
    streakCurrent: gam.streak?.current || 0,
    profileComplete: isProfileCompleteForBadge(profile, authUser),
    linkedinOptimized: isLinkedInOptimized(profile),
    applicationCount: apps.length,
    hasOffer: hasApplicationStatus(apps, 'offer'),
    interviewCount,
    resumeCount,
    aiChatCount,
    ...overrides,
  }
}

// Owns the badge catalog (`/badges/*`) and the user's gamification stats.
const useGamificationStore = create((set, get) => ({
  catalogLoading: false,
  catalogLoaded: false,
  catalog: [],
  gamification: createDefaultGamification(),
  syncingBadges: false,
  recordingVisit: false,

  reset: () => {
    resetCtxCache(null)
    set({
      gamification: createDefaultGamification(),
      catalog: [],
      catalogLoaded: false,
      syncingBadges: false,
      recordingVisit: false,
    })
  },

  loadCatalog: async ({ force = false } = {}) => {
    if (!force && get().catalogLoaded) return get().catalog
    set({ catalogLoading: true })
    try {
      const q = query(collection(db, 'badges'), orderBy('sortOrder', 'asc'))
      const snap = await getDocs(q)
      const fromFirestore = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const catalog = fromFirestore.length > 0 ? fromFirestore : BADGES_CATALOG
      set({ catalog, catalogLoading: false, catalogLoaded: true })
      return catalog
    } catch (err) {
      console.warn('gamificationStore.loadCatalog:', err.message)
      set({ catalog: BADGES_CATALOG, catalogLoading: false, catalogLoaded: true })
      return BADGES_CATALOG
    }
  },

  hydrateFromUser: (userDoc) => {
    const gam = userDoc?.gamification
      ? {
        ...createDefaultGamification(),
        ...userDoc.gamification,
        streak: {
          ...createDefaultGamification().streak,
          ...(userDoc.gamification.streak || {}),
        },
      }
      : createDefaultGamification()
    set({ gamification: gam })
  },

  /** Bump login streak when the user opens the app (once per calendar day). */
  recordDailyVisit: async () => {
    const uid = auth.currentUser?.uid
    if (!uid || get().recordingVisit) return { skipped: true }

    const today = todayKey()
    if (get().gamification?.streak?.lastActiveDate === today) {
      return { skipped: true, reason: 'already-recorded-today' }
    }

    set({ recordingVisit: true })
    const yest = yesterdayKey()

    try {
      const ref = doc(db, 'users', uid)
      const result = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref)
        const data = snap.exists() ? snap.data() : {}
        const baseGam = createDefaultGamification()
        const gam = {
          ...baseGam,
          ...(data.gamification || {}),
          streak: { ...baseGam.streak, ...((data.gamification && data.gamification.streak) || {}) },
        }

        const lastDate = gam.streak.lastActiveDate || ''
        if (lastDate === today) {
          return { skipped: true, newStreak: gam.streak.current || 0 }
        }

        let newCurrent
        if (lastDate === yest) {
          newCurrent = (gam.streak.current || 0) + 1
        } else {
          newCurrent = 1
        }
        const newLongest = Math.max(gam.streak.longest || 0, newCurrent)

        tx.set(
          ref,
          {
            gamification: {
              ...gam,
              streak: { current: newCurrent, longest: newLongest, lastActiveDate: today },
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )

        return { skipped: false, newStreak: newCurrent, newLongest }
      })

      if (!result.skipped) {
        const newStreak = {
          current: result.newStreak,
          longest: result.newLongest,
          lastActiveDate: today,
        }
        set((s) => ({
          gamification: {
            ...s.gamification,
            streak: { ...s.gamification.streak, ...newStreak },
          },
        }))
        // Mirror into profileStore.user so other consumers (e.g. the next
        // recordDailyVisit early-return check) see the latest streak without
        // a forced users/{uid} re-read.
        useProfileStore.setState((s) => ({
          user: s.user
            ? {
              ...s.user,
              gamification: {
                ...(s.user.gamification || {}),
                streak: { ...((s.user.gamification && s.user.gamification.streak) || {}), ...newStreak },
              },
            }
            : s.user,
        }))
        get().syncEligibleBadges({ streakCurrent: result.newStreak }).catch(() => {})
      }

      return result
    } catch (err) {
      console.error('gamificationStore.recordDailyVisit:', err)
      return { skipped: true, reason: err.message }
    } finally {
      set({ recordingVisit: false })
    }
  },

  // Award a badge by writing directly to Firestore (no backend round-trip).
  // Idempotent: if the badge is already earned, returns { alreadyEarned: true }
  // and skips the notification write. firestore.rules restricts the write to
  // the badge owner (users/{uid}/...), and the catalog is validated client-side
  // against BADGES_CATALOG.
  awardBadge: async (badgeId) => {
    const uid = auth.currentUser?.uid
    if (!uid) return { success: false }

    const catalog = get().catalog.length ? get().catalog : BADGES_CATALOG
    const badge = catalog.find((b) => b.id === badgeId)
    if (!badge) return { success: false, error: 'Unknown badge id' }

    try {
      const ref = doc(db, 'users', uid)
      const result = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref)
        const data = snap.exists() ? snap.data() : {}
        const baseGam = createDefaultGamification()
        const gam = {
          ...baseGam,
          ...(data.gamification || {}),
          streak: { ...baseGam.streak, ...((data.gamification && data.gamification.streak) || {}) },
        }
        const earned = new Set(gam.earnedBadgeIds || [])
        if (earned.has(badgeId)) return { alreadyEarned: true }
        earned.add(badgeId)

        tx.set(
          ref,
          {
            gamification: {
              ...gam,
              earnedBadgeIds: Array.from(earned),
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )

        const notifRef = doc(collection(db, 'users', uid, 'notifications'))
        tx.set(notifRef, {
          icon: badge.icon || 'trophy',
          title: `Badge unlocked: ${badge.name}`,
          description: badge.description || '',
          color: '#a855f7',
          type: 'badge',
          read: false,
          createdAt: serverTimestamp(),
        })

        return { alreadyEarned: false }
      })

      if (!result.alreadyEarned) {
        const earned = new Set(get().gamification.earnedBadgeIds || [])
        earned.add(badgeId)
        set((s) => ({ gamification: { ...s.gamification, earnedBadgeIds: Array.from(earned) } }))
        // Mirror into the cached user doc so consumers of profileStore.user
        // stay in sync without a forced users/{uid} re-read.
        useProfileStore.setState((s) => ({
          user: s.user
            ? {
              ...s.user,
              gamification: {
                ...(s.user.gamification || {}),
                earnedBadgeIds: Array.from(earned),
              },
            }
            : s.user,
        }))
      }
      return { success: true, ...result }
    } catch (err) {
      console.error('gamificationStore.awardBadge:', err)
      return { success: false, error: err.message }
    }
  },

  /** Evaluate criteria and award any newly eligible badges. */
  syncEligibleBadges: async (overrides = {}) => {
    if (!auth.currentUser?.uid || get().syncingBadges) return []
    set({ syncingBadges: true })
    try {
      if (!get().catalogLoaded) await get().loadCatalog()
      const catalog = get().catalog.length ? get().catalog : BADGES_CATALOG
      const context = await gatherBadgeContext(overrides)
      if (!context) return []

      const eligible = getEligibleBadgeIds(catalog, context)
      const newlyAwarded = []
      for (const badgeId of eligible) {
        const res = await get().awardBadge(badgeId)
        if (res?.success && !res?.alreadyEarned) newlyAwarded.push(badgeId)
      }
      return newlyAwarded
    } catch (err) {
      console.error('gamificationStore.syncEligibleBadges:', err)
      return []
    } finally {
      set({ syncingBadges: false })
    }
  },
}))

export default useGamificationStore
