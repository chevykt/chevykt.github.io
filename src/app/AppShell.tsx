import { useEffect } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { MobileNav } from '@/components/drawer/MobileNav'
import { SearchPalette } from '@/components/search/SearchPalette'
import { SiteFooter } from '@/components/page/SiteFooter'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { useSmoothScroll } from '@/hooks/use-smooth-scroll'
import { ShellProvider, useShell } from './shell-context'

/** Global shortcuts: Ctrl/Cmd+K opens search, Ctrl/Cmd+B collapses the desktop sidebar. */
function useShortcuts(isDesktop: boolean) {
  const { setSearchOpen, toggleCollapsed } = useShell()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      const key = event.key.toLowerCase()
      if (key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      } else if (key === 'b' && isDesktop) {
        event.preventDefault()
        toggleCollapsed()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDesktop, setSearchOpen, toggleCollapsed])
}

function Shell() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const { collapsed } = useShell()
  useShortcuts(isDesktop)
  useSmoothScroll()

  return (
    <div className="app" data-sidebar={isDesktop && collapsed ? 'collapsed' : 'expanded'}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {/* Render one navigation, not both, so screen readers meet a single "Main" nav. */}
      {isDesktop ? <Sidebar /> : <MobileNav />}
      <main id="main" className="app-main" tabIndex={-1}>
        <div className="app-main__inner">
          <Outlet />
          <SiteFooter />
        </div>
      </main>
      <SearchPalette />
      <ScrollRestoration />
    </div>
  )
}

export function AppShell() {
  return (
    <ShellProvider>
      <Shell />
    </ShellProvider>
  )
}
