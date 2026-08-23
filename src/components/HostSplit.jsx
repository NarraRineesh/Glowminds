import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/Loader'
import { resolveHostRedirect } from '@/config/hosts'

/**
 * Production host split. Localhost is a no-op so `/login` and `/` still work
 * on a single origin during development.
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
