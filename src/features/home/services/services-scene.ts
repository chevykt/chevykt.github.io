import { ScrollTrigger } from '@/lib/motion/gsap'
import type { ScrollScene } from '@/hooks/use-scroll-scene'

/**
 * The Services "Card stack" sink (desktop, the `smooth` query). The pile itself is CSS sticky; this
 * only reads how far each card has travelled from the bottom of the screen to its resting place
 * (0 -> 1) and sinks + dims every card by how much the cards after it have covered it. The eyebrow's
 * rule fills with the share of the pile that has landed. Phones keep the sticky pile without the sink;
 * reduced motion gets a plain stack.
 */
export const servicesScene: ScrollScene = (root, { smooth }) => {
  if (!smooth) return
  const items = Array.from(root.querySelectorAll<HTMLElement>('.sv__item'))
  const cards = items.map((item) => item.querySelector<HTMLElement>('.sv__card')!)
  const dims = items.map((item) => item.querySelector<HTMLElement>('.sv__dim')!)
  const rule = root.querySelector<HTMLElement>('[data-sv-rule]')

  const render = () => {
    const vh = window.innerHeight
    const landed = items.map((item) => {
      const stick = parseFloat(getComputedStyle(item).top) || 0
      const top = item.getBoundingClientRect().top
      return Math.min(1, Math.max(0, (vh - top) / Math.max(1, vh - stick)))
    })
    cards.forEach((card, i) => {
      const covered = landed.slice(i + 1).reduce((sum, v) => sum + v, 0)
      card.style.transform = covered ? `scale(${1 - 0.04 * Math.min(covered, 4)})` : ''
      dims[i]!.style.opacity = String(Math.min(1, covered) * 0.55)
    })
    rule?.style.setProperty('transform', `scaleX(${landed.reduce((s, v) => s + v, 0) / items.length})`)
  }

  const trigger = ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onUpdate: render, onRefresh: render })
  render()
  return () => {
    trigger.kill()
    cards.forEach((card) => (card.style.transform = ''))
    dims.forEach((dim) => (dim.style.opacity = ''))
    rule?.style.removeProperty('transform')
  }
}
