import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { readStorage, STORAGE_KEYS, writeStorage } from '@/lib/storage'

/**
 * UI state the whole shell shares: is the desktop sidebar collapsed, is the phone drawer open,
 * is the search palette open. Components read it with useShell().
 */
type ShellState = {
  collapsed: boolean
  toggleCollapsed: () => void
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

const ShellContext = createContext<ShellState | null>(null)

export function ShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => readStorage(STORAGE_KEYS.sidebar) === 'collapsed')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const toggleCollapsed = useCallback(() => {
    const next = !collapsed
    writeStorage(STORAGE_KEYS.sidebar, next ? 'collapsed' : 'expanded')
    setCollapsed(next)
  }, [collapsed])

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, drawerOpen, setDrawerOpen, searchOpen, setSearchOpen }),
    [collapsed, toggleCollapsed, drawerOpen, searchOpen],
  )

  return <ShellContext value={value}>{children}</ShellContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useShell(): ShellState {
  const context = useContext(ShellContext)
  if (!context) throw new Error('useShell must be used inside <ShellProvider>')
  return context
}
