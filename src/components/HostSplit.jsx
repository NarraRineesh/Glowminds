import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/Loader'
import { blockProductionNavigation, resolveHostRedirect } from '@/config/hosts'

/**
 * Production host split. Localhost, Firebase preview channels, and
 * VITE_DISABLE_HOST_REDIRECT=true keep marketing and app routes on this origin.
 * A signed-in /login visit is sent to /dashboard in-app; this effect must not
 * then location.replace that path onto https://app.glowminds.in.
 */
export default function HostSplit({ children }) {
  const location = useLocation()
  const rawDest = resolveHostRedirect(location.pathname, {
    search: location.search,
    hash: location.hash,
  })
  const dest = rawDest && blockProductionNavigation(rawDest) ? null : rawDest

  useEffect(() => {
    if (!dest) return
    // Replace only this entry. Earlier history stays, so hardware back can
    // return to the page that led here. Assign would keep the redirecting
    // URL and bounce. In-app routes never get here: on the app host
    // resolveHostRedirect is null except for marketing paths.
    window.location.replace(dest)
  }, [dest])

  if (dest) return <PageLoader />
  return children
}
