import { create } from 'zustand'
import { collection, getDocs, query, orderBy, getDoc, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
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

async function gatherBadgeContext(overrides = {}) {
  const uid = auth.currentUser?.uid
  if (!uid) return null

  const profile = useProfileStore.getState().profile
  const userDoc = useProfileStore.getState().user
  const authUser = useAppStore.getState().user
  const gam = useGamificationStore.getState().gamification
  const apps = useTrackerStore.getState().apps || []

  let interviewCount = (useInterviewStore.getState().sessions || []).filter(
    (s) => s.status === 'completed',
  ).length
  if (interviewCount === 0) {
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'interviewSessions'))
      interviewCount = snap.docs.filter((d) => d.data().status === 'completed').length
    } catch { /* ignore */ }
  }

  let resumeCount = overrides.resumeCount
  if (resumeCount == null) {
    try {
      const primary = await getDoc(doc(db, 'users', uid, 'resumes', 'primary'))
      if (primary.exists()) resumeCount = 1
      else {
        const legacy = await getDocs(collection(db, 'users', uid, 'resumes'))
        resumeCount = legacy.size
      }
    } catch {
      resumeCount = userDoc?.flags?.defaultResumeId ? 1 : 0
    }
  }

  let aiChatCount = overrides.aiChatCount
  if (aiChatCount == null) {
    const chats = useAiChatStore.getState().chats || []
    if (chats.length > 0) {
      aiChatCount = chats.filter((c) => (c.messageCount || 0) > 0).length
    } else {
      try {
        const snap = await getDocs(collection(db, 'users', uid, 'aiChats'))
        aiChatCount = snap.docs.filter((d) => {
          const msgs = d.data().messages
          return Array.isArray(msgs) && msgs.length > 0
        }).length
      } catch {
        aiChatCount = 0
      }
    }
  }

  return {
    earnedBadgeIds: gam.earnedBadgeIds || [],
    streakCurrent: gam.streak?.current || 0,
    profileComplete: isProfileCompleteForBadge(profile, authUser),
    linkedinOptimized: isLinkedInOptimized(profile),
    applicationCount: apps.length,
    hasOffer: hasApplicationStatus(apps, 'offer'),
    interviewCount,
    resumeCount: resumeCount || 0,
    aiChatCount: aiChatCount || 0,
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

  reset: () => set({
    gamification: createDefaultGamification(),
    catalog: [],
    catalogLoaded: false,
    syncingBadges: false,
    recordingVisit: false,
  }),

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
        set((s) => ({
          gamification: {
            ...s.gamification,
            streak: {
              ...s.gamification.streak,
              current: result.newStreak,
              longest: result.newLongest,
              lastActiveDate: today,
            },
          },
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
          icon: badge.icon || '🏆',
          title: `Badge unlocked: ${badge.name}`,
          description: badge.description || '',
          color: 'var(--color-prp)',
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
      }
      useProfileStore.getState().load({ force: true }).catch(() => {})
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
