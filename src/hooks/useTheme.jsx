import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default function useTheme() {
  const ctx = useContext(ThemeContext)
  const [fallbackTheme, setFallbackTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    if (ctx != null) return
    document.documentElement.setAttribute('data-theme', fallbackTheme)
    localStorage.setItem('theme', fallbackTheme)
  }, [ctx, fallbackTheme])

  const fallbackToggle = useCallback(() => {
    setFallbackTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  if (ctx != null) return ctx
  return { theme: fallbackTheme, toggleTheme: fallbackToggle }
}
