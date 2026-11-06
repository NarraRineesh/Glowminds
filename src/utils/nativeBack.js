/**
 * Android hardware back. Web never calls this.
 *
 * The Capacitor shell loads https://app.glowminds.in. WebView.canGoBack() is
 * also true for that first document and for Firebase's trailing-slash
 * redirect, which are not in-app pages. Popping them leaves the SPA, and the
 * next press finishes the activity. This stack only counts React Router
 * entries, so replace() from login onto the dashboard stays one entry and a
 * later push can still be popped.
 */

export const EXIT_WINDOW_MS = 2000

let entries = []

export function resetInAppHistory() {
  entries = []
}

export function inAppDepth() {
  return entries.length
}

function keyIndex(key) {
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (entries[i].key === key) return i
  }
  return -1
}

/**
 * @param {{ pathname?: string, key?: string, navType?: string }} nav
 * navType is React Router's POP | PUSH | REPLACE. The first entry is always
 * recorded. Repeating the same key is a no-op so a double effect does not
 * grow the stack.
 */
export function noteNavigation({ pathname = '/', key = '', navType = 'POP' } = {}) {
  const entry = { path: normalizeBackPath(pathname), key: String(key) }
  if (entries.length === 0) {
    entries.push(entry)
    return entries.length
  }
  const top = entries[entries.length - 1]
  if (navType === 'REPLACE') {
    entries[entries.length - 1] = entry
    return entries.length
  }
  if (navType === 'POP') {
    const idx = keyIndex(entry.key)
    if (idx >= 0) {
      entries = entries.slice(0, idx + 1)
      return entries.length
    }
    if (entries.length > 1) entries.pop()
    if (entries.length === 0 || entries[entries.length - 1].path !== entry.path) {
      entries.push(entry)
    }
    return entries.length
  }
  if (top.key !== entry.key) entries.push(entry)
  return entries.length
}

export function normalizeBackPath(pathname) {
  const raw = pathname || '/'
  if (raw.length > 1 && raw.endsWith('/')) return raw.slice(0, -1)
  return raw
}

export function isDashboardHome(pathname) {
  const path = normalizeBackPath(pathname)
  return path === '/' || path === '/dashboard'
}

/**
 * @param {{ pathname?: string, historyLength?: number, historyIndex?: number, inAppDepth?: number }} input
 * `inAppDepth` is the React Router stack. WebView canGoBack is not an input:
 * on the remote shell it is also true for the first document. history.length
 * never shrinks, so a router index of 0 means the SPA is already at its first
 * entry even when length is greater than 1.
 */
export function shouldGoBack({
  pathname = '/',
  historyLength = 1,
  historyIndex,
  inAppDepth: depth,
} = {}) {
  // Depth 0 means the router has not recorded this document yet.
  if (typeof depth === 'number' && depth > 0) return depth > 1
  if (isDashboardHome(pathname)) return false
  if (typeof historyIndex === 'number') return historyIndex > 0
  return historyLength > 1
}

/**
 * @param {{ pathname?: string, inAppDepth?: number, historyIndex?: number, historyLength?: number, now?: number, armedUntil?: number }} input
 */
export function nextBackAction({
  pathname = '/',
  inAppDepth: depth,
  historyIndex,
  historyLength = 1,
  now = 0,
  armedUntil = 0,
} = {}) {
  if (shouldGoBack({ pathname, inAppDepth: depth, historyIndex, historyLength })) {
    return { type: 'back', armedUntil: 0 }
  }
  if (now < armedUntil) return { type: 'leave', armedUntil }
  return { type: 'arm', armedUntil: now + EXIT_WINDOW_MS }
}

/** Close the top open dialog or sheet. Returns true when one was open. */
export function closeOpenOverlay() {
  if (typeof document === 'undefined') return false
  const nodes = document.querySelectorAll(
    '[data-slot="dialog-content"][data-open], [data-slot="sheet-content"][data-open]',
  )
  const open = nodes[nodes.length - 1]
  if (!open) return false
  const closeBtn = open.querySelector('[data-slot="dialog-close"], [data-slot="sheet-close"]')
  if (closeBtn instanceof HTMLElement) {
    closeBtn.click()
    return true
  }
  open.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    bubbles: true,
    cancelable: true,
  }))
  return true
}
