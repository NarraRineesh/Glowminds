import { create } from 'zustand'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import { createDefaultGamification } from '@/constants/schema'
import { todayKey } from '@/utils/dateKeys'
import { computeLevel } from '@/utils/gamification'
import useGamificationStore from '@/store/gamificationStore'
import useProfileStore from '@/store/profileStore'

// Daily quiz only awards XP/level. Login streak is tracked separately via
// gamificationStore.recordDailyVisit() on app open.
//
// "Did the user already answer today?" =
// `gamification.dailyQuizLastAnsweredDate === todayKey()`.

export { todayKey } from '@/utils/dateKeys'

const CORRECT_XP = 15
const ATTEMPT_XP = 5

const useDailyQuizStore = create((set) => ({
  loading: false,
  lastAnsweredQuestionId: null,
  lastAnsweredCorrect: null,

  reset: () => set({ loading: false, lastAnsweredQuestionId: null, lastAnsweredCorrect: null }),

  isAnsweredToday: () => {
    const last = useGamificationStore.getState().gamification?.dailyQuizLastAnsweredDate
    return last === todayKey()
  },

  recordAnswer: async ({ questionId, isCorrect }) => {
    const uid = auth.currentUser?.uid
    if (!uid) return { skipped: true, reason: 'unauthenticated' }

    const today = todayKey()
    const quizLast = useGamificationStore.getState().gamification?.dailyQuizLastAnsweredDate
    if (quizLast === today) {
      set({ lastAnsweredQuestionId: questionId, lastAnsweredCorrect: !!isCorrect })
      return { skipped: true, reason: 'already-answered-today' }
    }

    set({ loading: true })
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

        if ((gam.dailyQuizLastAnsweredDate || '') === today) {
          return { skipped: true, reason: 'already-answered-today' }
        }

        const xpDelta = isCorrect ? CORRECT_XP : ATTEMPT_XP
        const newXp = (gam.xp || 0) + xpDelta
        const newLevel = computeLevel(newXp)

        tx.set(
          ref,
          {
            gamification: {
              ...gam,
              xp: newXp,
              level: newLevel,
              dailyQuizLastAnsweredDate: today,
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )

        return { skipped: false, newXp, newLevel, xpDelta }
      })

      if (result.skipped) {
        set({ loading: false, lastAnsweredQuestionId: questionId, lastAnsweredCorrect: !!isCorrect })
        return result
      }

      useGamificationStore.setState((s) => ({
        gamification: {
          ...s.gamification,
          xp: result.newXp,
          level: result.newLevel,
          dailyQuizLastAnsweredDate: today,
        },
      }))
      useProfileStore.getState().load({ force: true }).catch(() => {})

      set({ loading: false, lastAnsweredQuestionId: questionId, lastAnsweredCorrect: !!isCorrect })
      return { skipped: false, ...result }
    } catch (err) {
      console.error('dailyQuizStore.recordAnswer:', err)
      set({ loading: false })
      return { skipped: true, reason: err.message }
    }
  },
}))

export default useDailyQuizStore
