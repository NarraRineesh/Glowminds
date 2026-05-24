import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import OnboardingModal from './OnboardingModal'
import DailyQuizModal from './DailyQuizModal'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useGamificationStore from '@/store/gamificationStore'
import { todayKey as quizTodayKey } from '@/utils/dateKeys'
import { getTodayKey } from '@/features/dashboard/data/quizQuestions'

/**
 * Mounted inside DashboardShell. Decides which modal (if any) should appear:
 *  1. Onboarding — once per user (users/{uid}.flags.onboardingCompleted),
 *     shown only on /dashboard.
 *  2. Daily Quiz — once per day on /dashboard if today's quiz hasn't been
 *     answered and the prompt hasn't been dismissed today.
 *     "Answered today" = users/{uid}.gamification.dailyQuizLastAnsweredDate
 *     equals today's YYYYMMDD key.
 *
 * The host is intentionally lightweight; modals own their own UI/state.
 */
export default function DashboardModalsHost() {
  const { user, loggedIn } = useAppStore()
  const profile = useProfileStore((s) => s.profile)
  const flagsLoaded = useProfileStore((s) => s.loaded)
  const patchUserDoc = useProfileStore((s) => s.patchUserDoc)
  const quizLastAnsweredDate = useGamificationStore((s) => s.gamification?.dailyQuizLastAnsweredDate)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [resumeStepId, setResumeStepId] = useState('name')

  const onDashboardRoot = pathname === '/dashboard' || pathname === '/dashboard/'

  useEffect(() => {
    if (!loggedIn || !user?.uid || !onDashboardRoot || !flagsLoaded) return

    const userDoc = useProfileStore.getState().user
    const onboardingDone = !!(userDoc?.flags?.onboardingCompleted)

    const quizPromptSeenToday = userDoc?.flags?.quizPromptSeenAt === getTodayKey()
    const answeredToday = quizLastAnsweredDate === quizTodayKey()

    if (!onboardingDone) {
      // Resume at the last persisted step (stored as the visible-array index
      // when it was saved). We translate that back to a step id below.
      const savedIdx = Number.isFinite(userDoc?.flags?.onboardingStep)
        ? Math.max(0, userDoc.flags.onboardingStep)
        : 0
      const ORDER = ['name', 'career', 'contact', 'skills', 'preferences', 'links', 'summary', 'done']
      setResumeStepId(ORDER[Math.min(savedIdx, ORDER.length - 1)] || 'name')
      const t = setTimeout(() => setShowOnboarding(true), 600)
      return () => clearTimeout(t)
    }

    if (!quizPromptSeenToday && !answeredToday) {
      const t = setTimeout(() => setShowQuiz(true), 800)
      return () => clearTimeout(t)
    }
  }, [loggedIn, user?.uid, onDashboardRoot, flagsLoaded, profile, quizLastAnsweredDate])

  const closeOnboarding = async () => {
    setShowOnboarding(false)
    // We deliberately DO NOT mark onboardingCompleted here — only the wizard's
    // Finish button does that. A casual close (X / backdrop) just persists the
    // current step so the user can resume next time they open /dashboard.
    try {
      const existingFlags = useProfileStore.getState().user?.flags || {}
      if (!existingFlags.onboardingCompleted) {
        await patchUserDoc({ flags: { ...existingFlags } })
      }
    } catch (err) {
      console.error('persist onboarding flag:', err)
    }
  }

  const closeQuiz = async () => {
    setShowQuiz(false)
    try {
      const existingFlags = useProfileStore.getState().user?.flags || {}
      await patchUserDoc({ flags: { ...existingFlags, quizPromptSeenAt: getTodayKey() } })
    } catch (err) {
      console.error('persist quiz prompt flag:', err)
    }
  }

  return (
    <>
      <OnboardingModal
        open={showOnboarding}
        initialStepId={resumeStepId}
        onClose={closeOnboarding}
        onPickAction={(path) => navigate(path)}
      />
      <DailyQuizModal open={showQuiz} onClose={closeQuiz} />
    </>
  )
}
