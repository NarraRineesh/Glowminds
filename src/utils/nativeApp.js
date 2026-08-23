const STORAGE_KEY = 'gm_android_app'

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

function stored() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1' || localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** True when the site is running inside the Glowminds Android app / TWA. */
export function detectAndroidApp() {
  if (typeof window === 'undefined') return false

  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('app') === 'android' || params.get('source') === 'android_app') persist()
  } catch {
    /* ignore */
  }

  if (typeof document !== 'undefined' && String(document.referrer).startsWith('android-app://')) {
    persist()
  }

  try {
    if (window.Capacitor?.isNativePlatform?.()) persist()
  } catch {
    /* ignore */
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
  if (/GlowmindsAndroid|Glowminds\/[\d.]+.*Android/i.test(ua)) persist()
  if (/Android.+; wv\).*(Glowminds|in.glowminds)/i.test(ua)) persist()

  return stored()
}

export function isAndroidAppPublicPathAllowed(pathname) {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/refund')
  )
}
