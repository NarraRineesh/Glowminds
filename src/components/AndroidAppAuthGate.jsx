import { Navigate, useLocation } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import Loader from '@/components/Loader'
import { detectAndroidApp, isAndroidAppPublicPathAllowed } from '@/utils/nativeApp'

/**
 * Android app / TWA: require signup or login before any product or marketing content.
 */
export default function AndroidAppAuthGate({ children }) {
  const location = useLocation()
  const authLoading = useAppStore((s) => s.authLoading)
  const loggedIn = useAppStore((s) => s.loggedIn)

  if (!detectAndroidApp()) return children

  if (authLoading) return <Loader variant="page" />
  if (loggedIn) return children
  if (isAndroidAppPublicPathAllowed(location.pathname)) return children

  return <Navigate to="/login" replace state={{ from: location.pathname }} />
}
