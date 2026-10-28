import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/Loader'
import { resolveHostRedirect } from '@/config/hosts'

/**
 * Production host split. Localhost, Firebase preview channels, and
 * VITE_DISABLE_HOST_REDIRECT=true keep marketing and app routes on this origin.
 */
export default function HostSplit({ children }) {
  const location = useLocation()
  const dest = resolveHostRedirect(location.pathname, {
    search: location.search,
    hash: location.hash,
  })

  useEffect(() => {
    if (dest) window.location.replace(dest)
  }, [dest])

  if (dest) return <PageLoader />
  return children
}
