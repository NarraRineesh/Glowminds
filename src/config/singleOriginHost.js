const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

/** Firebase Hosting preview channels are `{site}--{channel}.web.app`. */
const FIREBASE_PREVIEW_CHANNEL = /--.*\.web\.app$/i

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
