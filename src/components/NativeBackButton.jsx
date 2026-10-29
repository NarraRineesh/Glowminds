import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import { closeOpenOverlay, shouldGoBack } from '@/utils/nativeBack'

const EXIT_WINDOW_MS = 2000

function isNativePlatform() {
  try {
    return window.Capacitor?.isNativePlatform?.() === true
  } catch {
    return false
  }
}

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
 * Hardware back for the Capacitor shell (in.glowminds.app).
 * No-op in a normal browser. The listener only reaches native code when
 * the installed shell includes the App plugin.
 */
export default function NativeBackButton() {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  useEffect(() => {
    if (!isNativePlatform()) return undefined

    let handle
    let cancelled = false
    let armedUntil = 0
    let appApi = null

    const onBack = (event) => {
      if (closeOpenOverlay()) return
      const idx = window.history.state?.idx
      const goBack = shouldGoBack({
        pathname: window.location.pathname,
        canGoBack: event?.canGoBack === true,
        historyLength: window.history.length,
        historyIndex: typeof idx === 'number' ? idx : undefined,
      })
      if (goBack) {
        armedUntil = 0
        navigateRef.current(-1)
        return
      }
      const now = Date.now()
      if (now < armedUntil) {
        if (appApi) leaveApp(appApi)
        return
      }
      armedUntil = now + EXIT_WINDOW_MS
      useAppStore.getState().addToast('info', 'Press back again to leave', { id: 'native-back-exit' })
    }

    import('@capacitor/app')
      .then(async (mod) => {
        if (cancelled) return
        appApi = mod.App
        handle = await appApi.addListener('backButton', onBack)
      })
      .catch((err) => {
        console.error('native back button:', err)
      })

    return () => {
      cancelled = true
      handle?.remove?.()
    }
  }, [])

  return null
}
