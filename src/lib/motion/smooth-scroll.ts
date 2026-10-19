import type Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, MOTION_CONDITIONS, ScrollTrigger } from './gsap'

declare global {
  interface Window {
    /** Dev only: lets the plan canvases drive the page's scroll. */
    __lenis?: Lenis
  }
}

/** The running Lenis instance, or null on phones / reduced motion (native scroll). */
let active: Lenis | null = null

/**
 * Smooth wheel scrolling (Lenis) driven by GSAP's ticker, so ScrollTrigger and Lenis read the
 * same frame. Desktop only: on touch Lenis smooths nothing and only adds a frame loop.
 *
 * lerp 0.14: one wheel notch settles in ~275 ms. 0.085 measured 464 ms and read as lag.
 * Lenis is its own chunk, fetched only here, so phones never download it (Lighthouse unused JS).
 * Until it lands, scrollToSection / scrollToY fall back to native scrolling. Returns a stop function.
 */
export function startSmoothScroll(): () => void {
  let stop = () => {}
  let stopped = false

  void import('lenis').then(({ default: LenisClass }) => {
    if (stopped) return
    const lenis = new LenisClass({ lerp: 0.14, anchors: true, stopInertiaOnNavigate: true })
    const tick = (time: number) => lenis.raf(time * 1000)

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    active = lenis
    if (document.documentElement.dataset.scrollLocked) lenis.stop() // a sheet opened before Lenis landed
    if (import.meta.env.DEV) window.__lenis = lenis

    stop = () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      if (active === lenis) active = null
      if (import.meta.env.DEV) delete window.__lenis
    }
  })

  return () => {
    stopped = true
    stop()
  }
}

/** Glide to a section by id (Lenis on desktop, native smooth scroll elsewhere). `instant` jumps. */
export function scrollToSection(id: string, { instant = false } = {}) {
  const target = document.getElementById(id)
  if (!target) return
  if (active && instant) {
    // Lenis measures an element target against its own scroll value, which is stale right after a
    // native scroll it has not seen (a route change, a ScrollTrigger refresh): it landed /#contact at
    // y 1270 instead of 18153. Measure against the native scroll and jump there.
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0
    scrollToY(target.getBoundingClientRect().top + window.scrollY - margin, { instant: true })
    return
  }
  if (active) {
    active.scrollTo(target, { duration: 1.1, force: true })
    return
  }
  const reduce = window.matchMedia(MOTION_CONDITIONS.reduce).matches
  target.scrollIntoView({ behavior: instant || reduce ? 'instant' : 'smooth', block: 'start' })
}

/** Glide the page to an absolute scroll position (Lenis on desktop, native smooth scroll elsewhere). */
export function scrollToY(y: number, { instant = false } = {}) {
  if (active) {
    // A jump scrolls natively first. A native scroll Lenis has not seen yet (React Router's
    // ScrollRestoration on history back) leaves its target stale, and scrollTo to a target equal to
    // that stale value is a no-op (lenis.mjs scrollTo: `target === this.targetScroll`). Lenis syncs
    // from the native scroll event; its own call below still stops any glide in flight.
    // Lenis also clamps to the page height it last measured (its resize observer runs later), so
    // right after a route change it cut /#contact (y 18153) down to the old page's end (1270).
    // Re-measure first.
    if (instant) window.scrollTo({ top: y, behavior: 'instant' })
    active.resize()
    active.scrollTo(y, { duration: 0.9, immediate: instant, force: true })
    return
  }
  const reduce = window.matchMedia(MOTION_CONDITIONS.reduce).matches
  window.scrollTo({ top: y, behavior: instant || reduce ? 'instant' : 'smooth' })
}

/** Freezes page scroll under a modal layer (Lenis stops; the root stops scrolling natively too). */
export function setScrollLock(locked: boolean) {
  if (locked) active?.stop()
  else active?.start()
  if (locked) document.documentElement.dataset.scrollLocked = 'true'
  else delete document.documentElement.dataset.scrollLocked
}
