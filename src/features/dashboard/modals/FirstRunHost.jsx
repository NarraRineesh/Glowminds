import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import OnboardingModal from './OnboardingModal'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import { hasUsableProfile } from '@/utils/targetRole'

/**
 * First-run only. Existing users with a usable profile or completed
 * onboarding skip this. Quiz / gamification hosts from main are not
 * restored — v2 does not ship those surfaces.
 */
export default function FirstRunHost() {
  const loggedIn = useAppStore((s) => s.loggedIn)
  const user = useAppStore((s) => s.user)
  const profile = useProfileStore((s) => s.profile)
  const flagsLoaded = useProfileStore((s) => s.loaded)
  const patchUserDoc = useProfileStore((s) => s.patchUserDoc)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [resumeStepId, setResumeStepId] = useState('career')

  const onDashboardRoot = pathname === '/dashboard' || pathname === '/dashboard/'

  useEffect(() => {
    if (!loggedIn || !user?.uid || !onDashboardRoot || !flagsLoaded) return

    const userDoc = useProfileStore.getState().user
    const onboardingDone = !!userDoc?.flags?.onboardingCompleted
    if (onboardingDone || hasUsableProfile(profile)) return

    const savedIdx = Number.isFinite(userDoc?.flags?.onboardingStep)
      ? Math.max(0, userDoc.flags.onboardingStep)
      : 0
    const ORDER = ['career', 'contact', 'skills', 'done']
    setResumeStepId(ORDER[Math.min(savedIdx, ORDER.length - 1)] || 'career')
    const t = setTimeout(() => setShowOnboarding(true), 600)
    return () => clearTimeout(t)
  }, [loggedIn, user?.uid, onDashboardRoot, flagsLoaded, profile])

  const closeOnboarding = async () => {
    setShowOnboarding(false)
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
