import { useEffect } from 'react'
import { MOTION_CONDITIONS, ScrollTrigger } from '@/lib/motion/gsap'
import { startSmoothScroll } from '@/lib/motion/smooth-scroll'
import { useMediaQuery } from './use-media-query'

/** Runs Lenis while the device has a fine pointer and motion is allowed. Mount once, in the shell. */
export function useSmoothScroll() {
  const enabled = useMediaQuery(MOTION_CONDITIONS.smooth)

  useEffect(() => (enabled ? startSmoothScroll() : undefined), [enabled])

  // Web fonts change line heights after first layout; re-measure every trigger once they land.
  useEffect(() => {
    document.fonts.ready.then(() => ScrollTrigger.refresh())
  }, [])
}
