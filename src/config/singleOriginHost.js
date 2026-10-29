const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

/** Firebase Hosting preview channels: `{site}--{channel}.web.app` or `.firebaseapp.com`. */
const FIREBASE_PREVIEW_CHANNEL = /--.*\.(web\.app|firebaseapp\.com)$/i

export function isLoopbackHost(hostname) {
  if (!hostname) return true
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith('.localhost')
}

export function isFirebasePreviewChannel(hostname) {
  return FIREBASE_PREVIEW_CHANNEL.test(String(hostname || ''))
}

/**
 * Serve marketing and app routes on this origin.
 * Production glowminds.in / app.glowminds.in stay split unless the env flag is set.
 */
export function keepsMarketingAndAppOnOrigin(hostname, { disableHostRedirect = false } = {}) {
  if (disableHostRedirect) return true
  if (isLoopbackHost(hostname)) return true
  return isFirebasePreviewChannel(hostname)
}

/**
 * Hosts the boot script may send the window to.
 * Firebase auth endpoints live under `/__/` on `*.firebaseapp.com` and must
 * stay reachable from a preview (popup / redirect handler).
 */
export const PRODUCTION_NAV_HOSTS = new Set([
  'app.glowminds.in',
  'glowminds.in',
  'www.glowminds.in',
  'glowminds-abc84.web.app',
  'glowminds-abc84.firebaseapp.com',
  'glowminds-app.web.app',
  'glowminds-app.firebaseapp.com',
])

/**
 * If `target` would leave a single-origin page for a production host,
 * return the path to open on the current origin instead. Otherwise null
 * (caller should navigate exactly as it asked, including production host split).
 */
export function pathIfProductionNavigation(target, pageHref, { disableHostRedirect = false } = {}) {
  if (!target || !pageHref) return null
  let page
  let dest
  try {
    page = new URL(pageHref)
    dest = new URL(String(target), pageHref)
  } catch {
    return null
  }
  if (!keepsMarketingAndAppOnOrigin(page.hostname, { disableHostRedirect })) return null
  if (dest.origin === page.origin) return null
  if (dest.pathname.startsWith('/__/')) return null
  if (!PRODUCTION_NAV_HOSTS.has(dest.hostname)) return null
  return `${dest.pathname}${dest.search}${dest.hash}`
}

/** Rewrite same-tab navigations to production hosts while this page is single-origin. */
export function installSingleOriginNavigationGuard(pageHref, { disableHostRedirect = false } = {}) {
  if (typeof window === 'undefined') return
  if (window.__gmOriginGuard) return
  const href = pageHref || window.location.href
  let hostname = ''
  try {
    hostname = new URL(href).hostname
  } catch {
    return
  }
  if (!keepsMarketingAndAppOnOrigin(hostname, { disableHostRedirect })) return

  const rewrite = (url) => pathIfProductionNavigation(url, window.location.href, { disableHostRedirect })
  window.__gmOriginGuard = 1

  const origReplace = Location.prototype.replace
  const origAssign = Location.prototype.assign
  Location.prototype.replace = function replaceGuarded(url) {
    const next = rewrite(url)
    return origReplace.call(this, next == null ? url : next)
  }
  Location.prototype.assign = function assignGuarded(url) {
    const next = rewrite(url)
    return origAssign.call(this, next == null ? url : next)
  }

  try {
    const desc = Object.getOwnPropertyDescriptor(Location.prototype, 'href')
    if (desc?.set && desc.get) {
      Object.defineProperty(Location.prototype, 'href', {
        configurable: true,
        enumerable: desc.enumerable,
        get: desc.get,
        set(url) {
          const next = rewrite(url)
          desc.set.call(this, next == null ? url : next)
        },
      })
    }
  } catch {
    /* Location.href is not configurable in this browser. replace/assign still guarded. */
  }

  const origOpen = window.open
  window.open = function openGuarded(url, target, features) {
    const sameTab = target == null || target === '' || target === '_self' || target === '_top'
    const next = sameTab ? rewrite(url) : null
    return origOpen.call(window, next == null ? url : next, target, features)
  }

  document.addEventListener('click', (event) => {
    let node = event.target
    while (node && node.tagName !== 'A') node = node.parentNode
    if (!node || !node.href) return
    const next = rewrite(node.href)
    if (next == null) return
    event.preventDefault()
    origAssign.call(window.location, next)
  }, true)

  const rewriteAnchors = () => {
    const links = document.getElementsByTagName('a')
    for (let i = 0; i < links.length; i += 1) {
      const next = rewrite(links[i].getAttribute('href'))
      if (next != null) links[i].setAttribute('href', next)
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rewriteAnchors, { once: true })
  } else {
    rewriteAnchors()
  }
}
