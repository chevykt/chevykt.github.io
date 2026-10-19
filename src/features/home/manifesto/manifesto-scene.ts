import { ScrollTrigger } from '@/lib/motion/gsap'
import type { ScrollScene } from '@/hooks/use-scroll-scene'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * The Manifesto "Reading band" (desktop, the `smooth` query): while the section holds (CSS sticky,
 * 320svh), the scroll glides the statement up so each line passes through the middle of the window.
 * The line in the band reads at full ink, its neighbours fade back by distance; each keyword lights
 * its tracker label as its line reaches the band; the eyebrow's line tracks progress. Phones and
 * tablets run the CSS view timeline in manifesto.css instead; reduced motion keeps the still layout.
 */
export const manifestoScene: ScrollScene = (root, { smooth }) => {
  if (!smooth) return
  const win = root.querySelector<HTMLElement>('[data-ms-window]')!
  const text = root.querySelector<HTMLElement>('[data-ms-text]')!
  const lines = Array.from(root.querySelectorAll<HTMLElement>('[data-line]'))
  const keys = Array.from(root.querySelectorAll<HTMLElement>('[data-ms-key]'))
  const progress = root.querySelector<HTMLElement>('[data-ms-progress]')
  const keyLine = Array.from(root.querySelectorAll<HTMLElement>('.ms__line [data-key]')).map((word) =>
    lines.indexOf(word.closest<HTMLElement>('[data-line]')!),
  )
  const last = Math.max(0, lines.length - 1)
  let centers: number[] = []
  const measure = () => (centers = lines.map((line) => line.offsetTop + line.offsetHeight / 2))

  const render = (p: number) => {
    // A short still beat at both ends, the lines glide through the band in between.
    const c = clamp01((p - 0.06) / 0.84) * last
    const i = Math.floor(c)
    const a = centers[i] ?? 0
    const b = centers[Math.min(last, i + 1)] ?? a
    text.style.transform = `translate3d(0, ${win.clientHeight / 2 - (a + (b - a) * (c - i))}px, 0)`
    // Focus 1 in the band, 0 a line away; manifesto.css turns it into opacity above the contrast floor.
    lines.forEach((line, k) => line.style.setProperty('--f', String(clamp01(1 - Math.abs(k - c)))))
    keys.forEach((key, k) => key.style.setProperty('--on', String(clamp01((c - (keyLine[k] ?? last) + 0.4) / 0.25))))
    progress?.style.setProperty('transform', `scaleX(${clamp01(p)})`)
  }

  measure()
  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => {
      measure()
      render(self.progress)
    },
  })
  render(trigger.progress)

  return () => {
    trigger.kill()
    text.style.transform = ''
    lines.forEach((line) => line.style.removeProperty('--f'))
    keys.forEach((key) => key.style.removeProperty('--on'))
    progress?.style.removeProperty('transform')
  }
}
