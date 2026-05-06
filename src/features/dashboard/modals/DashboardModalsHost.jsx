import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import OnboardingModal from './OnboardingModal'
import DailyQuizModal from './DailyQuizModal'
import useAppStore from '@/store/authStore'
import { getTodayKey } from '@/features/dashboard/data/quizQuestions'

const ONBOARDING_KEY = 'nx_onboarding_done'
const QUIZ_PROMPT_KEY = 'nx_quiz_prompt_seen'
const QUIZ_STATE_KEY = 'nx_daily_quiz_state'

/**
 * Mounted inside DashboardShell. Decides which modal (if any) should appear:
 *  1. Onboarding — once per user (localStorage flag), shown only on /dashboard
 *  2. Daily Quiz — once per day on dashboard if today’s answer not yet recorded
 *
 * The host is intentionally lightweight; modals own their own UI/state.
 */
export default function DashboardModalsHost() {
  const { user, loggedIn } = useAppStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)

  // Only evaluate triggers on the root /dashboard path so users aren’t bombarded
  const onDashboardRoot = pathname === '/dashboard' || pathname === '/dashboard/'

  useEffect(() => {
    if (!loggedIn || !user?.uid || !onDashboardRoot) return

    // Per-user keys so multiple accounts on same device don’t collide
    const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`
    const quizPromptKey = `${QUIZ_PROMPT_KEY}_${user.uid}`

    const onboardingDone = localStorage.getItem(onboardingKey)
    const quizPromptSeenToday = localStorage.getItem(quizPromptKey) === getTodayKey()

    let answeredToday = false
    try {
      const raw = localStorage.getItem(QUIZ_STATE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      answeredToday = parsed?.date === getTodayKey()
    } catch { /* ignore */ }

    // Stagger: onboarding first, quiz a moment later (only if onboarding was skipped/done previously)
    if (!onboardingDone) {
      const t = setTimeout(() => setShowOnboarding(true), 600)
      return () => clearTimeout(t)
    }

    if (!quizPromptSeenToday && !answeredToday) {
      const t = setTimeout(() => setShowQuiz(true), 800)
      return () => clearTimeout(t)
    }
  }, [loggedIn, user?.uid, onDashboardRoot])

  const closeOnboarding = () => {
    if (user?.uid) localStorage.setItem(`${ONBOARDING_KEY}_${user.uid}`, '1')
    setShowOnboarding(false)
  }

  const closeQuiz = () => {
    if (user?.uid) localStorage.setItem(`${QUIZ_PROMPT_KEY}_${user.uid}`, getTodayKey())
    setShowQuiz(false)
  }

  return (
    <>
      <OnboardingModal
        open={showOnboarding}
        onClose={closeOnboarding}
        onPickAction={(path) => navigate(path)}
      />
      <DailyQuizModal open={showQuiz} onClose={closeQuiz} />
    </>
  )
}
