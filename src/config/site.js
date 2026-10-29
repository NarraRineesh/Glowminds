import { keepsMarketingAndAppOnOrigin } from './singleOriginHost.js'

/**
 * Public site origin — must match `VITE_PUBLIC_SITE_URL` and index.html (via Vite transform).
 * No trailing slash.
 */
const raw = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://glowminds.in'
export const SITE_URL = String(raw).replace(/\/$/, '')

/**
 * Authenticated product origin — must match `VITE_PUBLIC_APP_URL`.
 * No trailing slash.
 */
const rawApp = import.meta.env.VITE_PUBLIC_APP_URL || 'https://app.glowminds.in'
export const APP_URL = String(rawApp).replace(/\/$/, '')

/**
 * Absolute URL for SEO (canonical, OG, sitemap).
 * Non-root paths use a trailing slash to match Firebase Hosting directory URLs
 * (e.g. /features/ → 200, /features → 301).
 */
export function pageUrl(path = '/') {
  if (!path || path === '/') return `${SITE_URL}/`
  const normalized = path.startsWith('/') ? path : `/${path}`
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`
  return `${SITE_URL}${withSlash}`
}

function onSingleOriginHost() {
  if (typeof window === 'undefined') return false
  return keepsMarketingAndAppOnOrigin(window.location.hostname || '', {
    disableHostRedirect: import.meta.env?.VITE_DISABLE_HOST_REDIRECT === 'true',
  })
}

/** Absolute app URL (login, signup, dashboard). Same-origin on preview/localhost. */
export function appPageUrl(path = '/') {
  const normalized = !path || path === '/'
    ? '/'
    : (path.startsWith('/') ? path : `/${path}`)
  if (onSingleOriginHost() && window.location?.origin) {
    return `${window.location.origin}${normalized}`
  }
  if (normalized === '/') return `${APP_URL}/`
  return `${APP_URL}${normalized}`
}
