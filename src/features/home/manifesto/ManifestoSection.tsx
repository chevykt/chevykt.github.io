import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { homeManifesto } from '@/content/home'
import { useScrollScene } from '@/hooks/use-scroll-scene'
import type { MotionConditions } from '@/lib/motion/gsap'
import { manifestoScene } from './manifesto-scene'
import './manifesto.css'

type Word = { text: string; key: boolean }

const words: Word[] = homeManifesto.parts.flatMap((part): Word[] =>
  typeof part === 'string' ? part.split(' ').map((text) => ({ text, key: false })) : [{ text: part.key, key: true }],
)
const keywords = words.filter((word) => word.key)
const sentence = words.map((word) => word.text).join(' ')
/** Tracker label: the keyword without its trailing punctuation. */
const label = (text: string) => text.replace(/[.,;:!?]+$/, '')

const wordSpans = (list: Word[]) =>
  list.map((word, i) => (
    <span key={i} className={word.key ? 'ms__w ms__w--key' : 'ms__w'} data-key={word.key || undefined}>
      {word.text}
    </span>
  ))

/**
 * The statement under the hero, "Reading band". On desktop the screen
 * holds and the statement glides up through a band in the middle: the line in the band reads at full
 * ink, the lines above and below fade back, and each keyword lights the tracker as its line reaches
 * the band. Phones: no hold; each line brightens as it crosses the middle of the screen. Lines are the
 * browser's own wraps, measured from an invisible copy, so the band follows the real lines at every width.
 */
export function ManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const measureRef = useRef<HTMLParagraphElement>(null)
  const [lines, setLines] = useState<number[]>([words.length]) // words per line

  useLayoutEffect(() => {
    const measure = measureRef.current
    if (!measure) return
    const group = () => {
      const counts: number[] = []
      let top = 0
      for (const span of Array.from(measure.children) as HTMLElement[]) {
        if (!counts.length || Math.abs(span.offsetTop - top) > 2) {
          counts.push(0)
          top = span.offsetTop
        }
        counts[counts.length - 1]!++
      }
      setLines((prev) => (prev.join() === counts.join() ? prev : counts))
    }
    // First grouping comes from the observer (after the browser's own layout), not a forced one here.
    const observer = new ResizeObserver(group)
    observer.observe(measure)
    void document.fonts?.ready.then(group)
    return () => observer.disconnect()
  }, [])

  // The scene reads the lines from the DOM, so it is rebuilt whenever the wrap changes.
  const shape = lines.join()
  const scene = useCallback((root: HTMLElement, conditions: MotionConditions) => manifestoScene(root, conditions), [shape]) // eslint-disable-line react-hooks/exhaustive-deps
  useScrollScene(sectionRef, scene)

  let from = 0
  return (
    <section ref={sectionRef} id="manifesto" className="ms" aria-label={homeManifesto.eyebrow}>
      <div className="ms__pin">
        <header className="ms__head">
          <p className="ms__eyebrow">
            {homeManifesto.eyebrow}
            <span className="ms__track" aria-hidden>
              <i data-ms-progress />
            </span>
          </p>
          {/* The tracker repeats the keywords already in the statement: decoration, so its labels are
              drawn from data-text in CSS (dim until lit is the design, and it is not text to read). */}
          <ol className="ms__keys" aria-hidden>
            {keywords.map((word) => (
              <li key={word.text} data-ms-key data-text={label(word.text)}>
                <i />
              </li>
            ))}
          </ol>
        </header>

        <p className="sr-only">{sentence}</p>
        <div className="ms__window" data-ms-window aria-hidden>
          <div className="ms__text" data-ms-text>
            <p ref={measureRef} className="ms__measure">
              {wordSpans(words)}
            </p>
            {lines.map((count, i) => (
              <span key={i} className="ms__line" data-line>
                {wordSpans(words.slice(from, (from += count)))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
