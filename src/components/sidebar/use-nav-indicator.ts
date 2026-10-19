import { useLayoutEffect, useRef, useState } from 'react'

/**
 * The hover highlight. One tile per list that exists only under the pointer (or keyboard focus):
 * it fades in where you point, glides between rows as you move (transform only), and fades out
 * in place when you leave. Nothing is highlighted at rest.
 */
export function useNavIndicator() {
  const listRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    const indicator = indicatorRef.current
    if (!list || !indicator) return

    const place = () => {
      const target = hoverId ? list.querySelector<HTMLElement>(`[data-nav-id="${hoverId}"]`) : null
      if (!target) {
        indicator.dataset.visible = 'false' // fades out where it is
        return
      }
      // Appearing from hidden: jump under the pointer, fade in, then glide from there on.
      const wasHidden = indicator.dataset.visible !== 'true'
      if (wasHidden) indicator.dataset.ready = 'false'
      indicator.style.transform = `translateY(${target.offsetTop}px)`
      indicator.dataset.visible = 'true'
      if (wasHidden) requestAnimationFrame(() => (indicator.dataset.ready = 'true'))
    }

    place()
    const observer = new ResizeObserver(place)
    observer.observe(list)
    return () => observer.disconnect()
  }, [hoverId])

  return { listRef, indicatorRef, hoverId, setHoverId }
}
