import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from '@phosphor-icons/react'
import type { ProductFilm } from '@/content/schema'
import { showcaseHost } from '@/content/showcase'
import { useMediaQuery } from '@/hooks/use-media-query'
import { BrowserWindow } from './BrowserWindow'

type NetworkInformation = { saveData?: boolean }
const saveData = () => (navigator as Navigator & { connection?: NetworkInformation }).connection?.saveData === true

/**
 * The product film in a browser window. Muted, it plays by itself only while a quarter of it is on
 * screen and pauses off screen. Reduced motion or data saver: the poster with a play button, and
 * nothing downloads until the visitor asks. The bar's button pauses it at any time (WCAG 2.2.2).
 */
export function FilmWindow({ film }: { film: ProductFilm }) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')
  const phone = useMediaQuery('(max-width: 700px)')
  const [still] = useState(saveData)
  /** The visitor's own choice; null = follow the default (play unless reduced motion / data saver). */
  const [choice, setChoice] = useState<boolean | null>(null)
  const [playing, setPlaying] = useState(false)
  const wants = choice ?? !(reduce || still)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (!wants) {
      video.pause()
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) video.play().catch(() => setChoice(false))
        else video.pause()
      },
      { threshold: 0.25 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [wants])

  const toggle = () => setChoice(!playing)

  return (
    <BrowserWindow
      url={showcaseHost}
      action={
        <button type="button" className="kt-film__toggle" onClick={toggle} aria-label={playing ? 'Pause the film' : 'Play the film'}>
          {playing ? <Pause size={14} weight="fill" aria-hidden /> : <Play size={14} weight="fill" aria-hidden />}
        </button>
      }
    >
      <div className="kt-screen">
        <video
          ref={ref}
          src={film.src}
          poster={phone ? film.pagePosters.phone : film.pagePosters.wide}
          width={film.poster.width}
          height={film.poster.height}
          muted
          loop
          playsInline
          preload={wants ? 'metadata' : 'none'}
          aria-label={film.poster.alt}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        {!wants && !playing ? (
          <button type="button" className="pg-play" onClick={() => setChoice(true)} aria-label="Play the film">
            <Play size={22} weight="fill" aria-hidden />
          </button>
        ) : null}
      </div>
    </BrowserWindow>
  )
}
