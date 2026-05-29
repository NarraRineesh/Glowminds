import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'

const ThemeContext = createContext(null)

export function applyDocumentTheme(theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  try {
    localStorage.setItem('theme', theme)
  } catch { /* ignore */ }
}

function readStoredTheme() {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* ignore */ }
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)

  useEffect(() => {
    applyDocumentTheme(theme)
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(next === 'light' ? 'light' : 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default function useTheme() {
  const ctx = useContext(ThemeContext)
  if (ctx != null) return ctx

  const [fallbackTheme, setFallbackTheme] = useState(readStoredTheme)

  useEffect(() => {
    applyDocumentTheme(fallbackTheme)
  }, [fallbackTheme])

  const fallbackToggle = useCallback(() => {
    setFallbackTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const fallbackSet = useCallback((next) => {
    setFallbackTheme(next === 'light' ? 'light' : 'dark')
  }, [])

  return { theme: fallbackTheme, setTheme: fallbackSet, toggleTheme: fallbackToggle }
}
