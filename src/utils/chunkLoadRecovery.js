const CHUNK_RELOAD_KEY = 'gm:chunk-reload'

export function isChunkLoadError(error) {
  const msg = String(error?.message || error || '')
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    error?.name === 'ChunkLoadError'
  )
}

/** Reload once after a deploy leaves a tab on stale hashed chunks. */
export function reloadOnceForChunkError() {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      return false
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  } catch {
    // sessionStorage blocked — still try a single reload
  }
  window.location.reload()
  return true
}

export function installChunkLoadRecovery() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    reloadOnceForChunkError()
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason) && reloadOnceForChunkError()) {
      event.preventDefault()
    }
  })
}
