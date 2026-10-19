import { useSyncExternalStore } from 'react'

/** Live boolean for a CSS media query. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Desktop gets the floating sidebar; below this width the sidebar lives in a drawer. */
export const DESKTOP_QUERY = '(min-width: 1024px)'
