import { Navigate, useLocation } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import Loader from '@/components/Loader'
import { hasUsableProfile } from '@/utils/targetRole'

export default function ProtectedRoute({ children }) {
  const authLoading = useAppStore((s) => s.authLoading)
  const loggedIn = useAppStore((s) => s.loggedIn)
  const user = useAppStore((s) => s.user)
  const profile = useProfileStore((s) => s.profile)
  const userDoc = useProfileStore((s) => s.user)
  const flagsLoaded = useProfileStore((s) => s.loaded)
  const profileLoading = useProfileStore((s) => s.loading)
  const location = useLocation()

  if (authLoading || (loggedIn && profileLoading && !flagsLoaded)) {
    return <Loader variant="page" />
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />
  }

  const existing = hasUsableProfile(profile) || !!userDoc?.flags?.onboardingCompleted
  if (user?.emailVerified === false && !existing && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />
  }

  return children
}
