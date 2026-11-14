import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { storage } from './storage'
import { ThemeContext, type Theme } from './useTheme'

function initialTheme(): Theme {
  const saved = storage.get('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Light/dark theme: follows the system until the user picks one, then remembers the choice. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      storage.set('theme', next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
