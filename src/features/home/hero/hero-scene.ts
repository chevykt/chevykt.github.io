import { gsap } from '@/lib/motion/gsap'
import type { ScrollScene } from '@/hooks/use-scroll-scene'

/**
 * Desktop hero exit, scrubbed 1:1 by the (Lenis-smoothed) scroll: the sub-head and button leave
 * first, then the two headline lines part sideways and sink back, so the Work section rises
 * into a clear column. Phones run the same idea as a CSS scroll timeline (hero.css).
 */
export const heroScene: ScrollScene = (root, { smooth }) => {
  if (!smooth) return

  gsap
    .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__foot', { y: -60, autoAlpha: 0, duration: 0.35 }, 0)
    .to('.hero__title', { y: '38vh', scale: 0.9, duration: 1 }, 0)
    .to('.hero__title', { opacity: 0, duration: 0.55 }, 0.3)
    .to('.hero__layer--thin', { xPercent: -7, duration: 1 }, 0)
    .to('.hero__layer--bold', { xPercent: 5, duration: 1 }, 0)
}
