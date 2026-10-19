import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { ArrowUpRight, MagnifyingGlass } from '@phosphor-icons/react'
import { useShell } from '@/app/shell-context'
import { externals, navTarget, pages, type NavEntry } from '@/app/routes'
import { scrollToSection } from '@/lib/motion/smooth-scroll'
import './search.css'

const ENTRIES: NavEntry[] = [...pages, ...externals]

function matches(entry: NavEntry, query: string): boolean {
  const haystack = `${entry.label} ${entry.description}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word))
}

/**
 * Jump to any page. A native modal <dialog>: the browser traps focus, closes on Escape and
 * renders it in the top layer. Arrow keys move, Enter opens.
 */
export function SearchPalette() {
  const { searchOpen, setSearchOpen } = useShell()
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  const results = useMemo(() => (query.trim() ? ENTRIES.filter((e) => matches(e, query.trim())) : ENTRIES), [query])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (searchOpen && !dialog.open) {
      dialog.showModal()
      // Focused here, not with autoFocus: React runs autoFocus on mount, when the dialog is still
      // closed, and that focus() forced the whole first page layout during boot (Lighthouse).
      inputRef.current?.focus()
    }
    if (!searchOpen && dialog.open) dialog.close()
  }, [searchOpen])

  const close = () => {
    setSearchOpen(false)
    setQuery('')
    setCursor(0)
  }

  const open = (entry: NavEntry) => {
    close()
    if (entry.kind === 'external') window.open(entry.href, '_blank', 'noreferrer')
    else if (entry.section && window.location.pathname === '/') scrollToSection(entry.section)
    else navigate(navTarget(entry))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setCursor((current) => (current + step + results.length) % Math.max(results.length, 1))
    } else if (event.key === 'Enter') {
      const entry = results[cursor]
      if (entry) open(entry)
    }
  }

  return (
    <dialog
      data-lenis-prevent
      ref={dialogRef}
      className="search"
      aria-label="Search pages"
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close() // click on the backdrop
      }}
    >
      <div className="search__field">
        <MagnifyingGlass size={18} aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setCursor(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search pages"
          aria-label="Search pages"
          aria-controls="search-results"
          aria-activedescendant={results[cursor] ? `search-${results[cursor].id}` : undefined}
        />
        <kbd>Esc</kbd>
      </div>

      <ul id="search-results" className="search__list" role="listbox" aria-label="Pages">
        {results.map((entry, index) => {
          const Icon = entry.icon
          return (
            <li
              key={entry.id}
              id={`search-${entry.id}`}
              role="option"
              aria-selected={index === cursor}
              className="search__item"
              onPointerMove={() => setCursor(index)}
              onClick={() => open(entry)}
            >
              <Icon size={18} weight={index === cursor ? 'fill' : 'regular'} aria-hidden />
              <span className="search__text">
                <span className="search__label">{entry.label}</span>
                <span className="search__desc">{entry.description}</span>
              </span>
              {entry.kind === 'external' ? <ArrowUpRight size={14} aria-hidden /> : null}
            </li>
          )
        })}
        {results.length === 0 ? <li className="search__empty">No page matches "{query}".</li> : null}
      </ul>
    </dialog>
  )
}
