import { signOut } from 'firebase/auth'
import { auth } from './firebase'
import useAppStore from '@/store/authStore'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:3001/api'

class ApiError extends Error {
  constructor(message, { status, code, payload } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

// Guards against a burst of concurrent failed calls (e.g. dashboard mounts
// firing 5 parallel apiFetch calls) all triggering signOut + a toast.
let unauthorizedHandled = false

function resetUnauthorizedGuard() {
  unauthorizedHandled = false
}

// Centralized "your session is no longer valid" handler.
//  - signs out of Firebase (auth listener clears Zustand state)
//  - shows a one-shot toast
//  - ProtectedRoute then redirects to /login automatically
async function handleUnauthorized() {
  if (unauthorizedHandled) return
  unauthorizedHandled = true
  try {
    useAppStore.getState().addToast?.('error', '🔒 Session expired — please sign in again.')
  } catch { /* store may not be ready yet */ }
  try {
    if (auth.currentUser) await signOut(auth)
  } catch (err) {
    console.warn('apiClient.handleUnauthorized signOut failed:', err)
  }
  // Allow another logout to fire after a fresh sign-in.
  setTimeout(resetUnauthorizedGuard, 3000)
}

async function getAuthHeader({ required = true } = {}) {
  const user = auth.currentUser
  if (!user) {
    if (required) {
      // Treat "no current user" the same as a 401 from the server.
      handleUnauthorized().catch(() => {})
      throw new ApiError('Not signed in', { code: 'unauthenticated', status: 401 })
    }
    return {}
  }
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

async function parseResponse(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Call a JSON endpoint on the backend with the current user's Firebase ID token.
 *
 * On a 401 response (or when there's no signed-in user for a protected call)
 * the helper signs the user out and lets <ProtectedRoute> redirect them to
 * /login. Callers don't have to handle 401 themselves.
 *
 * @param {string} path - path relative to the API base (e.g. "/ai/career-chat")
 * @param {object} [options]
 * @param {string} [options.method="POST"]
 * @param {any}    [options.body]   - JSON-serialised automatically
 * @param {boolean}[options.auth=true] - send Bearer token (skipped for public endpoints)
 * @param {object} [options.headers]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<any>} parsed JSON response body
 */
export async function apiFetch(path, options = {}) {
  const {
    method = 'POST',
    body,
    auth: requireAuth = true,
    headers = {},
    signal,
  } = options

  const authHeader = await getAuthHeader({ required: requireAuth })
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
    credentials: 'include',
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    const code = payload?.error?.code || 'internal'
    const message =
      payload?.error?.message ||
      (typeof payload === 'string' ? payload : null) ||
      `Request failed (${response.status})`

    if (response.status === 401) {
      handleUnauthorized().catch(() => {})
    }
    throw new ApiError(message, { status: response.status, code, payload })
  }

  return payload
}

export { ApiError, API_BASE_URL, resetUnauthorizedGuard }
