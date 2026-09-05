import { Link } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import { appHref, chromeHomePath, isLocalHost, siteHref } from '@/config/hosts'

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

/** Logo / home control. Always same-origin — never hard-links marketing SITE_URL. */
export function ChromeHomeLink({ children, ...props }) {
  const loggedIn = useAppStore((s) => s.loggedIn)
  return (
    <Link to={chromeHomePath({ loggedIn })} {...props}>
      {children}
    </Link>
  )
}
