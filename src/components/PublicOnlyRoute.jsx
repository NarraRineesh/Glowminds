import { Navigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import Loader from '@/components/Loader'
import { requiresEmailVerification } from '@/utils/emailVerification'

/**
 * Wrap public/marketing/auth routes that should NOT be accessible
 * once the user is authenticated. Logged-in users are redirected
 * to /dashboard (or /verify-email for unverified password accounts).
 */
export default function PublicOnlyRoute({ children }) {
  const authLoading = useAppStore((s) => s.authLoading)
  const loggedIn = useAppStore((s) => s.loggedIn)
  const user = useAppStore((s) => s.user)

  if (authLoading) {
    return <Loader variant="page" />
  }

  if (loggedIn) {
    if (requiresEmailVerification(user)) {
      return <Navigate to="/verify-email" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}
