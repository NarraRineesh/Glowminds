import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import { closeOpenOverlay, inAppDepth, nextBackAction, noteNavigation } from '@/utils/nativeBack'

let listenerPromise = null
let appApi = null
let backHandler = () => {}

/**
 * True only when this document is the Capacitor shell and the native App
 * plugin is in the APK. The website bundle's addListener otherwise binds a
 * web stub: hardware and gesture back never call it, and the activity
 * finishes. Plugins.App is injected at document start, before this module.
 */
function nativeAppPluginReady() {
  try {
    const cap = window.Capacitor
    if (!cap || cap.isNativePlatform?.() !== true) return false
    if (typeof cap.isPluginAvailable === 'function') return cap.isPluginAvailable('App') === true
    return Boolean(cap.Plugins?.App)
  } catch {
    return false
  }
}

function ensureNativeBackListener() {
  if (listenerPromise || !nativeAppPluginReady()) return
  listenerPromise = import('@capacitor/app')
    .then(async (mod) => {
      appApi = mod.App
      // Keep this for the life of the page. Removing it clears the native
      // hasListeners flag, and the plugin then follows WebView history,
      // including the initial app.glowminds.in document.
      await appApi.addListener('backButton', (event) => {
        backHandler(event)
      })
    })
    .catch((err) => {
      listenerPromise = null
      appApi = null
      console.error('native back button:', err)
    })
}

ensureNativeBackListener()

async function leaveApp(App) {
  try {
    await App.minimizeApp()
  } catch {
    try {
      await App.exitApp()
    } catch {
      /* plugin missing or not Android */
    }
  }
}

/**
 * Hardware and gesture back for the Capacitor shell (in.glowminds.app).
 * No-op in a browser. The shell must include @capacitor/app; a deploy of
 * app.glowminds.in cannot register the native back callback by itself.
 */
export default function NativeBackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const navType = useNavigationType()
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate
  const armedRef = useRef(0)

  useLayoutEffect(() => {
    noteNavigation({
      pathname: location.pathname,
      key: location.key,
      navType,
    })
    // Layout runs before the dynamic import's microtask attaches the native
    // listener, so the stack and this handler exist before a press can land.
    backHandler = () => {
      if (closeOpenOverlay()) {
        armedRef.current = 0
        return
      }
      const idx = window.history.state?.idx
      const decision = nextBackAction({
        pathname: window.location.pathname,
        inAppDepth: inAppDepth(),
        historyIndex: typeof idx === 'number' ? idx : undefined,
        historyLength: window.history.length,
        now: Date.now(),
        armedUntil: armedRef.current,
      })
      armedRef.current = decision.armedUntil
      if (decision.type === 'back') {
        navigateRef.current(-1)
        return
      }
      if (decision.type === 'leave') {
        if (appApi) leaveApp(appApi)
        return
      }
      useAppStore.getState().addToast('info', 'Press back again to leave', { id: 'native-back-exit' })
    }
  }, [location.key, location.pathname, navType])

  return null
}
