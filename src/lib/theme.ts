import { readStorage, STORAGE_KEYS, writeStorage } from './storage'

export type Theme = 'light' | 'dark'

/** Browser chrome color per theme. Keep in sync with --bg in tokens.css. */
const THEME_COLOR: Record<Theme, string> = { light: '#efeee9', dark: '#0d0d0f' }

/** The theme index.html already applied before paint: dark unless the visitor picked light. */
export function getInitialTheme(): Theme {
  return readStorage(STORAGE_KEYS.theme) === 'light' ? 'light' : 'dark'
}

function paint(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

/** True while the theme cross-fade runs. Its overlay makes the browser fire fake pointerleave events. */
export function isThemeSwitching(): boolean {
  return document.documentElement.dataset.themeSwitching === 'true'
}

/**
 * Apply and remember a theme. Cross-fades through the View Transitions API when it exists,
 * so a light/dark switch eases instead of flashing the whole screen. Resolves when done.
 */
export async function setTheme(theme: Theme): Promise<void> {
  writeStorage(STORAGE_KEYS.theme, theme)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    paint(theme)
    return
  }
  const root = document.documentElement
  root.dataset.themeSwitching = 'true'
  try {
    await document.startViewTransition(() => paint(theme)).finished
  } finally {
    delete root.dataset.themeSwitching
  }
}
