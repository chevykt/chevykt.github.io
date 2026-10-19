import { useLayoutEffect, type RefObject } from 'react'

const RAIL_CENTER = 38 // px: middle of the 76px rail, where every icon already sits
const RAIL_PIC = 44 // px: the picture's size on the rail
const RAIL_PIC_GAP = 14 // px: space under the picture on the rail

/** Left/top offset of `el` inside `root`, from layout (offsets ignore transforms, so this is stable while collapsed). */
function offsetWithin(el: HTMLElement, root: HTMLElement): { left: number; top: number } {
  let left = 0
  let top = 0
  let node: HTMLElement | null = el
  while (node && node !== root) {
    left += node.offsetLeft
    top += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { left, top }
}

/**
 * Measures how the centered header folds onto the rail and writes it as CSS vars on the panel:
 * --mark-x (logo mark slide), --pic-x / --pic-scale (picture slide + shrink), --dy (how far the
 * menu rides up and the card's bottom clips in). Collapse is then pure transform + clip-path.
 */
export function useRailGeometry(panelRef: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const panel = panelRef.current
    const head = panel?.querySelector<HTMLElement>('.sb-head')
    const mark = panel?.querySelector<HTMLElement>('.sb-logo__mark')
    const pic = panel?.querySelector<HTMLElement>('.sb-pic')
    if (!panel || !head || !mark || !pic) return

    const measure = () => {
      const markBox = offsetWithin(mark, panel)
      const picBox = offsetWithin(pic, panel)
      const headBox = offsetWithin(head, panel)
      panel.style.setProperty('--mark-x', `${RAIL_CENTER - (markBox.left + mark.offsetWidth / 2)}px`)
      panel.style.setProperty('--pic-x', `${RAIL_CENTER - (picBox.left + pic.offsetWidth / 2)}px`)
      panel.style.setProperty('--pic-scale', String(RAIL_PIC / pic.offsetWidth))
      const railHeadBottom = picBox.top + RAIL_PIC + RAIL_PIC_GAP
      const dy = Math.max(0, headBox.top + head.offsetHeight - railHeadBottom)
      panel.style.setProperty('--dy', `${dy}px`)
      // How much the rail clips off the card's bottom: the space the ride-up frees, but never into
      // content. On a screen shorter than the card's content the menu still runs past the bottom
      // after riding up, so the clip shrinks (to 0 when it overflows even then) and no icon is cut.
      const railContent = panel.scrollHeight - dy
      panel.style.setProperty('--clip-b', `${Math.max(0, Math.min(dy, panel.clientHeight - railContent))}px`)
    }

    // No synchronous first measure: it forced the whole first page layout inside the boot script
    // (~90ms, Lighthouse forced-reflow). The observer's first callback lands after the browser's own
    // layout and before paint, so the rail still folds right on the first frame.
    const observer = new ResizeObserver(measure)
    observer.observe(head)
    observer.observe(panel)
    document.fonts.ready.then(measure)
    return () => observer.disconnect()
  }, [panelRef])
}
