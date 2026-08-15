import { Navigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import Loader from '@/components/Loader'
import { requiresEmailVerification } from '@/utils/emailVerification'

export default function AdminRoute({ children }) {
  const authLoading = useAppStore((s) => s.authLoading)
  const loggedIn = useAppStore((s) => s.loggedIn)
  const user = useAppStore((s) => s.user)
  const isAdmin = user?.isAdmin === true

  if (authLoading) return <Loader variant="page" />
  if (!loggedIn) return <Navigate to="/login" replace />
  if (requiresEmailVerification(user)) return <Navigate to="/verify-email" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
