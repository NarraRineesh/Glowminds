/**
 * Android hardware back. Web never calls this.
 * Dashboard home is the stack root: back closes an overlay or leaves the
 * app, and does not walk back into login.
 */

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
 * @param {{ pathname?: string, canGoBack?: boolean, historyLength?: number, historyIndex?: number }} input
 * history.length never shrinks, so a React Router index of 0 means the SPA
 * is already at its first entry even when length is greater than 1.
 */
export function shouldGoBack({
  pathname = '/',
  canGoBack = false,
  historyLength = 1,
  historyIndex,
} = {}) {
  if (isDashboardHome(pathname)) return false
  if (canGoBack) return true
  if (typeof historyIndex === 'number') return historyIndex > 0
  return historyLength > 1
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
