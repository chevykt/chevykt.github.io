import { useEffect, type RefObject } from 'react'
import { gsap, MOTION_CONDITIONS, type MotionConditions } from '@/lib/motion/gsap'

/**
 * A scroll scene: a plain function that builds GSAP tweens / ScrollTriggers for one section.
 * It runs inside gsap.matchMedia scoped to the section, so selector strings only match inside it,
 * and everything it creates is reverted on unmount or when a media condition flips.
 * Return a function for any extra cleanup (listeners).
 */
export type ScrollScene = (root: HTMLElement, conditions: MotionConditions) => void | (() => void)

/** Mounts a scene on a section. Pass a module-level function so it stays stable between renders. */
export function useScrollScene(ref: RefObject<HTMLElement | null>, scene: ScrollScene) {
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const mm = gsap.matchMedia(root)
    // `always` makes the scene run on every device (matchMedia skips a context where no condition
    // matches, which is every phone); each scene decides from `smooth` / `reduce` what to do there.
    mm.add({ ...MOTION_CONDITIONS, always: 'all' }, (context) => scene(root, context.conditions as MotionConditions))
    return () => mm.revert()
  }, [ref, scene])
}
