import { Navigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import Loader from '@/components/Loader'

export default function ProtectedRoute({ children }) {
  const authLoading = useAppStore((s) => s.authLoading)
  const loggedIn = useAppStore((s) => s.loggedIn)

  if (authLoading) {
    return <Loader variant="page" />
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}
