import { useEffect } from 'react'
import useTheme from '@/hooks/useTheme'
import useProfileStore from '@/store/profileStore'

/** Apply saved theme from user settings once profile is loaded. */
export default function ThemeSync() {
  const { setTheme } = useTheme()
  const settingsTheme = useProfileStore((s) => s.user?.settings?.theme)

  useEffect(() => {
    if (settingsTheme === 'light' || settingsTheme === 'dark') {
      setTheme(settingsTheme)
    }
  }, [settingsTheme, setTheme])

  return null
}
