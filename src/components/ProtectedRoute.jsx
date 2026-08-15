import { Navigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import Loader from '@/components/Loader'
import { requiresEmailVerification } from '@/utils/emailVerification'

export default function ProtectedRoute({ children }) {
  const authLoading = useAppStore((s) => s.authLoading)
  const loggedIn = useAppStore((s) => s.loggedIn)
  const user = useAppStore((s) => s.user)

  if (authLoading) {
    return <Loader variant="page" />
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />
  }

  if (requiresEmailVerification(user)) {
    return <Navigate to="/verify-email" replace />
  }

  return children
}
