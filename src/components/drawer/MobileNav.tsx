import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { List, MagnifyingGlass, X } from '@phosphor-icons/react'
import { useShell } from '@/app/shell-context'
import { pages } from '@/app/routes'
import { site } from '@/content/site'
import { SidebarPanel } from '@/components/sidebar/SidebarPanel'
import { BrandMark } from '@/components/brand/BrandMark'
import { useSwipeToClose } from './use-swipe-to-close'
import '@/components/sidebar/sidebar.css'
import './drawer.css'

/**
 * Phones and tablets: a top bar plus a right-side drawer holding the same sidebar card.
 * Closes on the scrim, Escape, a link, or a swipe right. Focus moves into the panel on open
 * and back to the menu button on close.
 */
export function MobileNav() {
  const { drawerOpen, setDrawerOpen, setSearchOpen } = useShell()
  const { pathname } = useLocation()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const close = () => setDrawerOpen(false)
  const { panelRef, swipeHandlers } = useSwipeToClose(close)

  const current = pages.find((page) => (page.path === '/' ? pathname === '/' : pathname.startsWith(page.path)))

  useEffect(() => {
    if (!drawerOpen) return
    const panel = panelRef.current
    const menuButton = menuButtonRef.current
    panel?.focus({ preventScroll: true })
    document.documentElement.dataset.scrollLocked = 'true'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      delete document.documentElement.dataset.scrollLocked
      menuButton?.focus({ preventScroll: true })
    }
  }, [drawerOpen, panelRef, setDrawerOpen])

  return (
    <>
      <header className="mb-bar">
        <BrandMark className="mb-bar__mark" />
        <span className="mb-bar__title">{current?.label ?? site.brand}</span>
        <button type="button" className="mb-bar__btn" onClick={() => setSearchOpen(true)} aria-label="Search">
          <MagnifyingGlass size={20} aria-hidden />
        </button>
        <button
          ref={menuButtonRef}
          type="button"
          className="mb-bar__btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
        >
          <List size={22} aria-hidden />
        </button>
      </header>

      <div className="mb-drawer" data-open={drawerOpen} inert={!drawerOpen}>
        <div className="mb-drawer__scrim" onClick={close} aria-hidden />
        <div
          ref={panelRef}
          id="mobile-drawer"
          className="mb-drawer__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          tabIndex={-1}
          {...swipeHandlers}
        >
          <SidebarPanel
            variant="drawer"
            onNavigate={close}
            headerAction={
              <button type="button" className="mb-bar__btn" onClick={close} aria-label="Close menu">
                <X size={20} aria-hidden />
              </button>
            }
          />
        </div>
      </div>
    </>
  )
}
