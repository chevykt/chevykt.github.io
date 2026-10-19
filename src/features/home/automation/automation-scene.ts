import { ScrollTrigger } from '@/lib/motion/gsap'
import type { ScrollScene } from '@/hooks/use-scroll-scene'
import { liveAutomation } from '@/content/automation'
import { CONNECTED, placedNodes, REPLAY, stepStarts } from './flow-model'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const SETTLE = 0.05 // after a build, its bright contour settles back over this much progress

/**
 * Draws the live automation from scroll progress (0 -> 1 across the pinned section): each stage's
 * contour traces itself, its title, icon and tag come up, a packet runs each solid link as it draws,
 * the dashed reroutes draw themselves in, and at CONNECTED packets run the whole path once more. Every
 * state is a pure function of progress, so scrolling back un-builds it. Reduced motion: the CSS
 * shows the finished diagram and this scene does not run.
 */
export const automationScene: ScrollScene = (root, { reduce }) => {
  if (reduce) return
  root.setAttribute('data-live', '')
  const q = <T extends Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel))
  const time = (el: Element) => ({ a: Number(el.getAttribute('data-a')), b: Number(el.getAttribute('data-b')) })

  const nodes = q<SVGGElement>('[data-fl-node]').map((el) => ({
    el,
    ...time(el),
    contour: el.querySelector<SVGPathElement>('.fl__contour')!,
    parts: Array.from(el.querySelectorAll<SVGElement>('.fl__mark, .fl__title, .fl__icon, .fl__tag')),
  }))
  const leads = q<SVGPathElement>('.fl__signal').map((el) => {
    const packet = root.querySelector<SVGCircleElement>(`[data-fl-packet="${el.getAttribute('data-fl-link')}"]`)!
    return { el, ...time(el), packet, x1: Number(packet.getAttribute('data-x1')), x2: Number(packet.getAttribute('data-x2')) }
  })
  const dashes = q<SVGPathElement>('.fl__dash').map((el) => {
    const id = el.getAttribute('data-fl-link')
    return {
      el,
      ...time(el),
      mask: root.querySelector<SVGPathElement>(`[data-fl-mask="${id}"]`)!,
      label: root.querySelector<SVGTextElement>(`[data-fl-label="${id}"]`),
    }
  })
  const zones = q<SVGGElement>('[data-fl-zone]').map((el) => ({ el, ...time(el) }))
  const steps = q<HTMLElement>('[data-fl-step]')
  const details = q<HTMLElement>('[data-fl-detail]')
  const bars = q<HTMLElement>('[data-fl-bar]')
  const fill = root.querySelector<HTMLElement>('[data-fl-fill]')
  const readout = root.querySelector<HTMLElement>('[data-fl-readout]')
  const order = [...placedNodes].sort((x, y) => x.a - y.a)

  const render = (p: number) => {
    for (const n of nodes) {
      const t = clamp01((p - n.a) / (n.b - n.a))
      const settle = clamp01((p - n.b) / SETTLE)
      n.contour.style.strokeDashoffset = String(1 - t)
      n.contour.style.opacity = String(t > 0 ? 1 - 0.7 * settle : 0)
      for (const part of n.parts) part.style.opacity = String(0.3 + 0.7 * t)
    }

    const replay = clamp01((p - REPLAY[0]) / (REPLAY[1] - REPLAY[0]))
    leads.forEach((l, i) => {
      const t = clamp01((p - l.a) / (l.b - l.a))
      l.el.style.strokeDashoffset = String(1 - t)
      l.el.style.opacity = String(t > 0 ? 0.85 : 0)
      l.el.setAttribute('marker-end', t > 0.97 ? 'url(#fl-arrow)' : 'none') // the arrowhead lands with the line
      // The packet rides the line while it draws, then once more when the whole system is live.
      const run = replay > 0 && replay < 1 ? clamp01(replay * 1.4 - (i / Math.max(1, leads.length - 1)) * 0.4) : t
      const flying = (t > 0 && t < 1) || (replay > 0 && replay < 1 && run > 0 && run < 1)
      l.packet.setAttribute('cx', String(l.x1 + (l.x2 - l.x1) * run))
      l.packet.style.opacity = flying ? '1' : '0'
    })

    for (const z of zones) z.el.style.opacity = String(0.35 + 0.65 * clamp01((p - z.a) / (z.b - z.a)))
    for (const l of dashes) {
      const t = clamp01((p - l.a) / (l.b - l.a))
      l.mask.style.strokeDashoffset = String(1 - t)
      if (l.label) l.label.style.opacity = String(clamp01(t * 2 - 1))
    }

    let active = 0
    stepStarts.forEach((start, k) => {
      if (p >= start) active = k
    })
    steps.forEach((s, k) => {
      s.toggleAttribute('data-on', k === active)
      s.toggleAttribute('data-done', k <= active)
    })
    details.forEach((d, k) => d.toggleAttribute('data-on', k === active))
    fill?.style.setProperty('transform', `scaleY(${clamp01(p / CONNECTED)})`)

    const started = order.filter((n) => n.a <= p)
    const last = started[started.length - 1]
    bars.forEach((bar, i) => bar.toggleAttribute('data-build', !!last && last.index === i))
    const label = p >= CONNECTED ? liveAutomation.connected : (last?.title ?? '')
    if (readout && readout.textContent !== label) readout.textContent = label
  }

  // scrub: Lenis already smooths the desktop wheel; touch follows the finger 1:1.
  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => render(self.progress),
  })
  render(trigger.progress)

  return () => {
    trigger.kill()
    root.removeAttribute('data-live')
    for (const n of nodes) {
      n.contour.style.removeProperty('stroke-dashoffset')
      n.contour.style.removeProperty('opacity')
      n.parts.forEach((part) => part.style.removeProperty('opacity'))
    }
    for (const l of leads) {
      l.el.style.removeProperty('stroke-dashoffset')
      l.el.style.removeProperty('opacity')
      l.packet.style.removeProperty('opacity')
      l.el.setAttribute('marker-end', 'url(#fl-arrow)')
    }
    for (const l of dashes) {
      l.mask.style.removeProperty('stroke-dashoffset')
      l.label?.style.removeProperty('opacity')
    }
    zones.forEach((z) => z.el.style.removeProperty('opacity'))
    fill?.style.removeProperty('transform')
    if (readout) readout.textContent = ''
  }
}
