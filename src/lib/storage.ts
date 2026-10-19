/**
 * localStorage that never throws. Private windows and blocked site data make the accessor
 * itself throw, and the site must still render with nothing stored.
 */

export const STORAGE_KEYS = {
  theme: 'pv2-theme',
  sidebar: 'pv2-sidebar',
  consent: 'pv2-consent',
} as const

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export function readStorage(key: StorageKey): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: StorageKey, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage blocked: the choice lasts for this page view only.
  }
}
