import { gsap, ScrollTrigger } from '@/lib/motion/gsap'
import { scrollToY } from '@/lib/motion/smooth-scroll'
import type { ScrollScene } from '@/hooks/use-scroll-scene'

/** Where the rooms hold and the scroll walks them: desktop width, a tall enough screen, motion allowed. Matches showcase.css. */
export const WALK = '(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)'

/**
 * The five rooms: while the section holds (CSS sticky, one screen
 * plus a stretch of scroll per room), the page scroll walks the list. The room whose stretch the
 * scroll is in is lit and its screen shows; the rule beside the list fills with progress. A click on
 * a room scrolls to the middle of its stretch, so the scroll and the list never disagree.
 */
export const roomsScene: ScrollScene = (root) => {
  const mm = gsap.matchMedia()
  mm.add(WALK, () => {
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-kt-room]'))
    const panes = Array.from(root.querySelectorAll<HTMLElement>('[data-kt-pane]'))
    const fill = root.querySelector<HTMLElement>('[data-kt-fill]')
    const n = panes.length

    let active = -1
    const setActive = (i: number) => {
      if (i === active) return
      active = i
      buttons.forEach((b, k) => b.setAttribute('aria-current', String(k === i)))
      panes.forEach((p, k) => p.toggleAttribute('data-on', k === i))
    }

    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        fill?.style.setProperty('transform', `scaleY(${self.progress})`)
        setActive(Math.min(n - 1, Math.floor(self.progress * n)))
      },
    })
    setActive(Math.min(n - 1, Math.floor(st.progress * n)))
    fill?.style.setProperty('transform', `scaleY(${st.progress})`)

    const onClick = (event: MouseEvent) => {
      const i = buttons.indexOf((event.target as Element).closest('[data-kt-room]') as HTMLButtonElement)
      if (i < 0) return
      scrollToY(st.start + ((i + 0.5) / n) * (st.end - st.start))
    }
    root.addEventListener('click', onClick)

    return () => {
      root.removeEventListener('click', onClick)
      buttons.forEach((b) => b.removeAttribute('aria-current'))
      panes.forEach((p, k) => p.toggleAttribute('data-on', k === 0))
      fill?.style.removeProperty('transform')
    }
  })
  return () => mm.revert()
}
