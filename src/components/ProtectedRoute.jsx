import { Navigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import Loader from '@/components/Loader'
import { requiresEmailVerification } from '@/utils/emailVerification'

export default function ProtectedRoute({ children }) {
  const authLoading = useAppStore((s) => s.authLoading)
  const loggedIn = useAppStore((s) => s.loggedIn)
  const user = useAppStore((s) => s.user)
  const flagsLoaded = useProfileStore((s) => s.loaded)
  const profileLoading = useProfileStore((s) => s.loading)

  // Keep the dashboard shell mounted after login. Only block first paint
  // while auth is unknown or the user doc has not arrived yet.
  if (!loggedIn && authLoading) {
    return <Loader variant="page" />
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />
  }

  if (loggedIn && profileLoading && !flagsLoaded) {
    return children
  }

  if (requiresEmailVerification(user)) {
    return <Navigate to="/verify-email" replace />
  }

  return children
}
