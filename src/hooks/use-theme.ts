import { useCallback, useState } from 'react'
import { getInitialTheme, setTheme, type Theme } from '@/lib/theme'

export function useTheme(): { theme: Theme; toggleTheme: () => Promise<void> } {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  /** Resolves when the cross-fade has finished. */
  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    return setTheme(next)
  }, [theme])

  return { theme, toggleTheme }
}
