import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { gsap, MOTION_CONDITIONS, spring } from '@/lib/motion/gsap'
import { setScrollLock } from '@/lib/motion/smooth-scroll'

/** Apple's momentum projection (Designing Fluid Interfaces): where a flick would come to rest. */
const project = (velocity: number, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate)
/** Soft resistance past a boundary instead of a hard stop. */
const rubberband = (overshoot: number, size: number, c = 0.55) => (overshoot * size * c) / (size + c * Math.abs(overshoot))

const DRAG_SLOP = 6

/**
 * Drives the chapter sheet. `open` comes from the URL; the sheet rises on a critically damped
 * spring, leaves the way it came, and can be grabbed or reversed at any moment (every tween
 * starts from the live position). The grab bar and header drag 1:1; a flick or a pull past a
 * third of the height asks to close. Returns the refs to attach plus the drag handler.
 */
export function useSheet({ open, onRequestClose, onClosed }: { open: boolean; onRequestClose: () => void; onClosed: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onRequestClose, onClosed })
  useEffect(() => {
    callbacks.current = { onRequestClose, onClosed }
  })

  useEffect(() => {
    const dialog = dialogRef.current
    const panel = panelRef.current
    const scrim = scrimRef.current
    if (!dialog || !panel || !scrim) return
    const reduce = window.matchMedia(MOTION_CONDITIONS.reduce).matches
    gsap.killTweensOf([panel, scrim])

    if (open) {
      if (!dialog.open) {
        dialog.showModal()
        setScrollLock(true)
        gsap.set(panel, reduce ? { y: 0, autoAlpha: 0 } : { y: window.innerHeight, autoAlpha: 1 })
        gsap.set(scrim, { opacity: 0 })
      }
      // Focus the panel itself, not the first button, so no focus ring flashes on Close.
      panel.focus({ preventScroll: true })
      gsap.to(scrim, { opacity: 1, duration: 0.3, ease: 'power1.out' })
      gsap.to(panel, reduce ? { autoAlpha: 1, duration: 0.2 } : { y: 0, ...spring({ response: 0.42 }) })
      return
    }

    if (!dialog.open) return
    const finish = () => {
      dialog.close()
      setScrollLock(false)
      callbacks.current.onClosed()
    }
    gsap.to(scrim, { opacity: 0, duration: 0.28, ease: 'power1.in' })
    gsap.to(panel, reduce ? { autoAlpha: 0, duration: 0.18, onComplete: finish } : { y: panel.offsetHeight + 40, ...spring({ response: 0.34 }), onComplete: finish })
  }, [open])

  // Unmounting with the sheet up (leaving Home) must not leave the page frozen.
  useEffect(() => () => setScrollLock(false), [])

  /** Pointer-down on the grab bar or header: track 1:1, then close or settle by projected momentum. */
  const onDragStart = (event: ReactPointerEvent<HTMLElement>) => {
    const panel = panelRef.current
    const scrim = scrimRef.current
    if (!panel || !scrim || event.button !== 0 || (event.target as Element).closest('button, a')) return
    const handle = event.currentTarget
    // Capture now: the grab bar is 26px tall, so the pointer leaves it before the drag slop is crossed.
    handle.setPointerCapture(event.pointerId)
    const startY = event.clientY
    const startOffset = Number(gsap.getProperty(panel, 'y')) || 0
    const height = panel.offsetHeight
    const samples: { y: number; t: number }[] = []
    let dragging = false

    const move = (e: PointerEvent) => {
      const dy = e.clientY - startY
      if (!dragging) {
        if (Math.abs(dy) < DRAG_SLOP) return
        dragging = true
        gsap.killTweensOf([panel, scrim])
      }
      const raw = startOffset + dy
      const y = raw < 0 ? -rubberband(-raw, height) : raw
      gsap.set(panel, { y })
      gsap.set(scrim, { opacity: 1 - Math.min(1, Math.max(0, y) / height) * 0.9 })
      samples.push({ y: e.clientY, t: e.timeStamp })
      if (samples.length > 5) samples.shift()
    }

    const end = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
      if (!dragging) return
      const first = samples[0]
      const last = samples[samples.length - 1]
      const velocity = first && last && last.t > first.t ? ((last.y - first.y) / (last.t - first.t)) * 1000 : 0
      const y = Number(gsap.getProperty(panel, 'y')) || 0
      if (y + project(velocity) > height / 3) {
        callbacks.current.onRequestClose()
      } else {
        gsap.to(panel, { y: 0, ...spring({ response: 0.35 }) })
        gsap.to(scrim, { opacity: 1, duration: 0.25 })
      }
    }

    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }

  return { dialogRef, panelRef, scrimRef, onDragStart }
}
