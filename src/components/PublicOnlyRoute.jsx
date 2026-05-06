import { Navigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import Loader from '@/components/Loader'

/**
 * Wrap public/marketing/auth routes that should NOT be accessible
 * once the user is authenticated. Logged-in users are redirected
 * to /dashboard.
 */
export default function PublicOnlyRoute({ children }) {
  const authLoading = useAppStore((s) => s.authLoading)
  const loggedIn = useAppStore((s) => s.loggedIn)

  if (authLoading) {
    return <Loader variant="page" />
  }

  if (loggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
