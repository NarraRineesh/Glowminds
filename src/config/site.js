/**
 * Public site origin — must match `VITE_PUBLIC_SITE_URL` and index.html (via Vite transform).
 * No trailing slash.
 */
const raw = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://studentsai.in'
export const SITE_URL = String(raw).replace(/\/$/, '')

export function pageUrl(path = '/') {
  const p = !path || path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${p}`
}
