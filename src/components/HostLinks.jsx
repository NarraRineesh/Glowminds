import { Link } from 'react-router-dom'
import { appHref, isLocalHost, siteHref } from '@/config/hosts'

/** Login / signup / dashboard CTA. Absolute on production marketing; relative on localhost. */
export function AppAuthLink({ to, children, ...props }) {
  if (isLocalHost()) {
    return (
      <Link to={to} {...props}>
        {children}
      </Link>
    )
  }
  return (
    <a href={appHref(to)} {...props}>
      {children}
    </a>
  )
}

/** Marketing page link. Absolute to glowminds.in when rendered on the app host. */
export function SiteLink({ to, children, ...props }) {
  if (isLocalHost()) {
    return (
      <Link to={to} {...props}>
        {children}
      </Link>
    )
  }
  return (
    <a href={siteHref(to)} {...props}>
      {children}
    </a>
  )
}
