import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { ScrollTrigger } from '@/lib/motion/gsap'
import { scrollToSection } from '@/lib/motion/smooth-scroll'

/**
 * Arriving on Home at /#<section> (a sidebar link from another page, a shared link): land exactly on
 * the section. The browser's own jump happens at commit, before fonts load and before the pinned
 * sections (Services' --travel) measure themselves, so the offset can be wrong by a screen or more.
 * Wait for fonts and a layout pass, refresh the scroll triggers, then jump.
 */
export function useHashLanding() {
  const { hash, key } = useLocation()

  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1))
    if (!id) return
    let cancelled = false
    document.fonts.ready.then(() =>
      requestAnimationFrame(() => {
        if (cancelled) return
        ScrollTrigger.refresh()
        scrollToSection(id, { instant: true })
      }),
    )
    return () => {
      cancelled = true
    }
  }, [hash, key])
}
