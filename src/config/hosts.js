/**
 * Marketing (glowminds.in / www) vs app (app.glowminds.in) host split.
 * Localhost / 127.0.0.1 stay a single origin — never bounce to production hosts.
 */
import { APP_URL, SITE_URL } from '@/config/site'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

export function getHostname() {
  if (typeof window === 'undefined') return ''
  return window.location.hostname || ''
}

export function isLocalHost(hostname = getHostname()) {
  if (!hostname) return true
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith('.localhost')
}

export function isAppHost(hostname = getHostname()) {
  if (isLocalHost(hostname)) return false
  return hostname === 'app.glowminds.in' || hostname.startsWith('app.')
}

export function isMarketingHost(hostname = getHostname()) {
  if (isLocalHost(hostname)) return false
  return !isAppHost(hostname)
}

/** Paths that belong on the app host. Marketing must bounce these. */
export const APP_PATH_PREFIXES = [
  '/login',
  '/signup',
  '/verify-email',
  '/dashboard',
  '/admin',
  '/design',
  '/jobs',
]

/** Marketing-only paths. App host may bounce these to glowminds.in. */
export const MARKETING_PATH_PREFIXES = [
  '/about',
  '/features',
  '/contact',
  '/pricing',
  '/careers',
  '/privacy',
  '/terms',
  '/refund',
]

export function normalizePathname(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
}

export function pathMatchesPrefix(pathname, prefixes) {
  const p = normalizePathname(pathname)
  return prefixes.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))
}

export function isAppPath(pathname) {
  return pathMatchesPrefix(pathname, APP_PATH_PREFIXES)
}

export function isMarketingOnlyPath(pathname) {
  return pathMatchesPrefix(pathname, MARKETING_PATH_PREFIXES)
}

/** App URL for CTAs. Relative on localhost; absolute on production hosts. */
export function appHref(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (isLocalHost()) return normalized
  return `${APP_URL}${normalized}`
}

/** Marketing URL. Relative on localhost; absolute on production hosts. */
export function siteHref(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (isLocalHost()) return normalized
  return `${SITE_URL}${normalized}`
}

/**
 * Same-host destination for chrome logos (header, drawer, auth).
 * Never returns SITE_URL — marketing stays on `/`; app stays in the product.
 */
export function chromeHomePath({ loggedIn = false, hostname = getHostname() } = {}) {
  if (isAppHost(hostname)) return loggedIn ? '/dashboard' : '/login'
  return '/'
}

/**
 * Cross-host bounce target, or null if this host should serve the path.
 * Never redirects on localhost.
 */
export function resolveHostRedirect(pathname, { hostname, search = '', hash = '' } = {}) {
  const host = hostname ?? getHostname()
  if (isLocalHost(host)) return null

  const suffix = `${search || ''}${hash || ''}`
  const p = pathname || '/'

  if (isAppHost(host)) {
    if (isMarketingOnlyPath(p)) return `${SITE_URL}${p.startsWith('/') ? p : `/${p}`}${suffix}`
    return null
  }

  if (isAppPath(p)) return `${APP_URL}${p.startsWith('/') ? p : `/${p}`}${suffix}`
  return null
}
