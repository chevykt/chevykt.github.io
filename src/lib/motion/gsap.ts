import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** GSAP with ScrollTrigger registered once. Import gsap from here, never from 'gsap' directly. */
gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

/**
 * Media conditions every scroll scene branches on (gsap.matchMedia).
 * - `smooth`: the desktop layout, a fine pointer and motion allowed. Lenis runs and scenes scrub with JS.
 * - `reduce`: the visitor asked for less motion. Scenes leave the still layout alone.
 * Phones get neither scrubbed JS nor Lenis: their scroll-linked motion is CSS scroll-driven
 * animation, which runs on the compositor in the same frame as the thumb.
 */
export const MOTION_CONDITIONS = {
  smooth: '(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const

export type MotionConditions = { [K in keyof typeof MOTION_CONDITIONS]: boolean }

const SETTLE_EPSILON = 0.001

/**
 * Apple's spring (response + damping ratio, WWDC 2018) solved into a GSAP duration + ease.
 * Damping 1 = no overshoot (anything that simply appears); ~0.8 only after a gesture carried momentum.
 * Spread straight into a tween: gsap.to(el, { y: 0, ...spring({ response: 0.5 }) }).
 */
export function spring({ response = 0.4, dampingRatio = 1 } = {}): { duration: number; ease: (p: number) => number } {
  const omega = (2 * Math.PI) / response
  const duration = dampingRatio >= 1 ? 9.23 / omega : -Math.log(SETTLE_EPSILON) / (dampingRatio * omega)
  const step = (t: number) => {
    if (dampingRatio >= 1) return 1 - (1 + omega * t) * Math.exp(-omega * t)
    const damped = omega * Math.sqrt(1 - dampingRatio * dampingRatio)
    const envelope = Math.exp(-dampingRatio * omega * t)
    return 1 - envelope * (Math.cos(damped * t) + ((dampingRatio * omega) / damped) * Math.sin(damped * t))
  }
  return { duration, ease: (p) => (p >= 1 ? 1 : step(p * duration)) }
}
