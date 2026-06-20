import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import OnboardingModal from './OnboardingModal'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'

/**
 * Mounted inside DashboardShell. Decides which modal (if any) should appear:
 *  1. Onboarding — once per user (users/{uid}.flags.onboardingCompleted),
 *     shown only on /dashboard.
 *
 * The host is intentionally lightweight; modals own their own UI/state.
 */
export default function DashboardModalsHost() {
  const { user, loggedIn } = useAppStore()
  const profile = useProfileStore((s) => s.profile)
  const flagsLoaded = useProfileStore((s) => s.loaded)
  const patchUserDoc = useProfileStore((s) => s.patchUserDoc)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [resumeStepId, setResumeStepId] = useState('name')

  const onDashboardRoot = pathname === '/dashboard' || pathname === '/dashboard/'

  useEffect(() => {
    if (!loggedIn || !user?.uid || !onDashboardRoot || !flagsLoaded) return

    const userDoc = useProfileStore.getState().user
    const onboardingDone = !!(userDoc?.flags?.onboardingCompleted)

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
  }, [loggedIn, user?.uid, onDashboardRoot, flagsLoaded, profile])

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

  return (
    <OnboardingModal
      open={showOnboarding}
      initialStepId={resumeStepId}
      onClose={closeOnboarding}
      onPickAction={(path) => navigate(path)}
    />
  )
}
