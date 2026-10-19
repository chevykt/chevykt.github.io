import type { FocusEvent, MouseEvent, PointerEvent } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ArrowUpRight, Moon } from '@phosphor-icons/react'
import { NAV_GROUPS, navEntries, navTarget, pages, type NavEntry } from '@/app/routes'
import { useSectionInView } from '@/hooks/use-section-in-view'
import { useTheme } from '@/hooks/use-theme'
import { scrollToSection } from '@/lib/motion/smooth-scroll'
import { isThemeSwitching } from '@/lib/theme'
import { useNavIndicator } from './use-nav-indicator'
import type { HoverTarget } from './types'

type Props = {
  collapsed: boolean
  /** Called after any item is chosen (the drawer closes itself with this). */
  onNavigate?: () => void
  /** Reports the hovered item so the collapsed rail can show its label as a tooltip. */
  onHoverChange?: (target: HoverTarget | null) => void
}

const THEME_ID = 'theme'

function activePageId(pathname: string): string | null {
  const match = pages.find((page) => (page.path === '/' ? pathname === '/' : pathname.startsWith(page.path)))
  return match?.group ? match.id : null
}

/** The page entries that point at a Home section (Work, Services). The section on screen lights its entry on Home. */
const sectionPages = pages.filter((page) => page.section)
const sectionIds = sectionPages.map((page) => page.section!)

export function SidebarNav({ collapsed, onNavigate, onHoverChange }: Props) {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const sectionInView = useSectionInView(sectionIds, onHome)
  const activeId = sectionPages.find((page) => page.section === sectionInView)?.id ?? activePageId(pathname)

  // On Home, Home and section entries glide instead of navigating (Home to the top, Work to its section).
  const glide = (event: MouseEvent, section: string) => {
    if (!onHome) return
    event.preventDefault()
    scrollToSection(section)
  }
  const { listRef, indicatorRef, hoverId, setHoverId } = useNavIndicator()
  const { theme, toggleTheme } = useTheme()

  const hover = (id: string, label: string, element: HTMLElement) => {
    setHoverId(id)
    onHoverChange?.({ label, element })
  }

  const clearHover = () => {
    setHoverId(null)
    onHoverChange?.(null)
  }

  // The theme cross-fade lays an overlay over the page, and the browser reports that as the
  // pointer leaving the list. Ignore it; once the fade ends, clear only if the pointer really left.
  const onListPointerLeave = () => {
    if (!isThemeSwitching()) clearHover()
  }

  const onThemeClick = async () => {
    await toggleTheme()
    if (!listRef.current?.matches(':hover')) clearHover()
  }

  // Keyboard focus leaving the list entirely clears the highlight, same as the pointer leaving.
  const onListBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) clearHover()
  }

  const itemState = (id: string) => ({
    'data-nav-id': id,
    'data-active': id === activeId,
    'data-highlighted': id === hoverId,
  })

  const renderEntry = (entry: NavEntry) => {
    const Icon = entry.icon
    const lit = entry.id === hoverId || entry.id === activeId
    const handlers = {
      onPointerEnter: (e: PointerEvent<HTMLElement>) => hover(entry.id, entry.label, e.currentTarget),
      onFocus: (e: FocusEvent<HTMLElement>) => hover(entry.id, entry.label, e.currentTarget),
      onClick: onNavigate,
    }
    const icon = (
      <span className="sb-item__icon">
        <Icon size={20} weight={lit ? 'fill' : 'regular'} aria-hidden />
        {entry.kind === 'page' && entry.badge ? <span className="sb-dot" aria-hidden /> : null}
      </span>
    )

    if (entry.kind === 'external') {
      return (
        <a key={entry.id} href={entry.href} target="_blank" rel="noreferrer" className="sb-item" {...itemState(entry.id)} {...handlers}>
          {icon}
          <span className="sb-item__label sb-fade">{entry.label}</span>
          <ArrowUpRight className="sb-item__ext sb-fade" size={14} aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )
    }

    const body = (
      <>
        {icon}
        <span className="sb-item__label sb-fade">{entry.label}</span>
        {entry.badge ? (
          <span className="sb-badge sb-fade" aria-label={`${entry.badge} builds`}>
            {entry.badge}
          </span>
        ) : null}
      </>
    )

    // A section entry is a plain link to /#section; aria-current follows the scroll, not the path.
    if (entry.section) {
      const section = entry.section
      return (
        <Link
          key={entry.id}
          to={navTarget(entry)}
          className="sb-item"
          aria-current={entry.id === activeId ? 'location' : undefined}
          {...itemState(entry.id)}
          {...handlers}
          onClick={(event) => {
            glide(event, section)
            onNavigate?.()
          }}
        >
          {body}
        </Link>
      )
    }

    return (
      <NavLink
        key={entry.id}
        to={entry.path}
        end={entry.path === '/'}
        className="sb-item"
        {...itemState(entry.id)}
        {...handlers}
        onClick={(event) => {
          if (entry.path === '/') glide(event, 'top')
          onNavigate?.()
        }}
      >
        {body}
      </NavLink>
    )
  }

  return (
    <div ref={listRef} className="sb-list" onPointerLeave={onListPointerLeave} onBlur={onListBlur}>
      <span ref={indicatorRef} className="sb-indicator" aria-hidden />

      {NAV_GROUPS.map((group) => (
        <div key={group.id} className="sb-group" role="group" aria-labelledby={`sb-group-${group.id}`}>
          <div className="sb-group__label" aria-hidden={collapsed || undefined}>
            <span id={`sb-group-${group.id}`} className="sb-fade">
              {group.label}
            </span>
          </div>

          {navEntries(group.id).map(renderEntry)}

          {group.id === 'general' ? (
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              className="sb-item"
              {...itemState(THEME_ID)}
              onPointerEnter={(e) => hover(THEME_ID, 'Dark mode', e.currentTarget)}
              onFocus={(e) => hover(THEME_ID, 'Dark mode', e.currentTarget)}
              onClick={onThemeClick}
            >
              <span className="sb-item__icon">
                <Moon size={20} weight={THEME_ID === hoverId ? 'fill' : 'regular'} aria-hidden />
              </span>
              <span className="sb-item__label sb-fade">Dark mode</span>
              <span className="sb-switch sb-fade" aria-hidden />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
