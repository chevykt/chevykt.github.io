import { useRef, type PointerEvent } from 'react'

const INTENT_PX = 10 // movement before a drag commits to a direction
const FLICK_PX_PER_MS = 0.35

/**
 * Swipe the drawer right to close. Tracks 1:1 after a 10px horizontal intent, then the
 * release velocity SIGN decides (a flick closes, a drag back reopens), then CSS springs it home.
 */
export function useSwipeToClose(onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; x: number; y: number; dx: number; lastX: number; lastT: number; v: number; active: boolean } | null>(null)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, lastX: event.clientX, lastT: event.timeStamp, v: 0, active: false }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    const panel = panelRef.current
    if (!state || !panel || event.pointerId !== state.id) return
    const dx = event.clientX - state.x
    const dy = event.clientY - state.y

    if (!state.active) {
      if (Math.abs(dy) > INTENT_PX && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null // vertical: the panel scrolls natively
        return
      }
      if (dx < INTENT_PX) return
      state.active = true
      panel.setPointerCapture(event.pointerId)
      panel.dataset.dragging = 'true'
    }

    const dt = Math.max(1, event.timeStamp - state.lastT)
    state.v = (event.clientX - state.lastX) / dt
    state.lastX = event.clientX
    state.lastT = event.timeStamp
    state.dx = Math.max(0, dx - INTENT_PX)
    panel.style.transform = `translateX(${state.dx}px)`
  }

  const onPointerEnd = () => {
    const state = drag.current
    const panel = panelRef.current
    drag.current = null
    if (!state?.active || !panel) return
    delete panel.dataset.dragging
    panel.style.transform = ''
    const flickedOpen = state.v < -FLICK_PX_PER_MS
    const shouldClose = !flickedOpen && (state.v > FLICK_PX_PER_MS || state.dx > panel.offsetWidth * 0.35)
    if (shouldClose) onClose()
  }

  return {
    panelRef,
    swipeHandlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd },
  }
}
