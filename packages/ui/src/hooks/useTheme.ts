import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'
export type ThemeMode = 'system' | 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mode, setMode] = useState<ThemeMode>('system')

  useEffect(() => {
    const root = document.documentElement
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null
    const initialMode = savedMode || 'system'

    setMode(initialMode)
    applyTheme(initialMode, root)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (mode === 'system') {
        applyTheme('system', root)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode])

  const applyTheme = (newMode: ThemeMode, root: HTMLElement = document.documentElement) => {
    let resolvedTheme: Theme

    if (newMode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      resolvedTheme = prefersDark ? 'dark' : 'light'
    } else {
      resolvedTheme = newMode
    }

    root.setAttribute('data-theme', resolvedTheme)
    setTheme(resolvedTheme)
  }

  const toggleTheme = () => {
    const root = document.documentElement
    const newMode: ThemeMode = mode === 'dark' ? 'light' : 'dark'

    root.setAttribute('data-theme', newMode)
    localStorage.setItem('theme-mode', newMode)
    setMode(newMode)
    setTheme(newMode)
  }

  const setThemeExplicit = (newMode: ThemeMode) => {
    const root = document.documentElement
    root.setAttribute('data-theme', newMode)
    localStorage.setItem('theme-mode', newMode)
    setMode(newMode)
    applyTheme(newMode, root)
  }

  return { theme, mode, toggleTheme, setTheme: setThemeExplicit }
}
