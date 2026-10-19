import { useRef, type CSSProperties } from 'react'
import { ArrowUpRight } from '@phosphor-icons/react'
import { PageMeta } from '@/app/PageMeta'
import type { PageRoute } from '@/app/routes'
import { PageHeader } from '@/components/page/PageHeader'
import { showcaseFaq, showcaseFilm, showcaseHost, showcasePage, showcaseStats, productTabs } from '@/content/showcase'
import { useScrollScene } from '@/hooks/use-scroll-scene'
import { showcaseJsonLd } from '@/lib/seo'
import { BrowserWindow } from './BrowserWindow'
import { FilmWindow } from './FilmWindow'
import { roomsScene } from './rooms-scene'
import './showcase.css'

const pad2 = (n: number) => String(n).padStart(2, '0')

/** The head (H1 on the page, H2 as a Home section) with the one call to action under the lede. */
function ShowcaseHeader({ nested }: { nested: boolean }) {
  const c = showcasePage
  return (
    <PageHeader level={nested ? 2 : 1} id={nested ? 'showcase-title' : undefined} eyebrow={c.eyebrow} titleThin={c.titleThin} titleBold={c.titleBold} lede={c.lede}>
      <div className="kt-cta">
        <a className="pg-btn" href={c.cta.href} {...(c.cta.external ? { target: '_blank', rel: 'noopener' } : {})}>
          {c.cta.label}
          <ArrowUpRight size={16} weight="bold" aria-hidden />
        </a>
        <p className="kt-foot">{c.footnote}</p>
      </div>
    </PageHeader>
  )
}

/** Film, stats, rooms, questions. Nested = inside a Home section, so every heading steps down one level. */
function ShowcaseBody({ nested }: { nested: boolean }) {
  const roomsRef = useRef<HTMLElement>(null)
  useScrollScene(roomsRef, roomsScene)
  const c = showcasePage
  const H2 = nested ? 'h3' : 'h2'
  const H3 = nested ? 'h4' : 'h3'

  return (
    <>
      {showcaseFilm ? (
        <div className="kt-film">
          <FilmWindow film={showcaseFilm} />
        </div>
      ) : null}

      <dl className="kt-stats">
        {showcaseStats.map(([n, unit]) => (
          <div key={unit}>
            <dt>{n}</dt>
            <dd className="pg-mono">{unit}</dd>
          </div>
        ))}
      </dl>

      <section ref={roomsRef} className="kt-rooms" style={{ '--n': productTabs.length } as CSSProperties} aria-labelledby="kt-rooms-title">
        <div className="kt-rooms__pin">
          <div className="kt-rooms__nav">
            <H2 id="kt-rooms-title" className="pg-h2">
              {c.roomsTitle}
            </H2>
            <ol className="kt-rooms__list">
              {productTabs.map((room, i) => (
                <li key={room.id}>
                  <button type="button" data-kt-room={i} aria-controls={`kt-room-${room.id}`}>
                    <small>{pad2(i + 1)}</small>
                    {room.label}
                  </button>
                </li>
              ))}
            </ol>
            <span className="kt-rooms__rule" aria-hidden>
              <i data-kt-fill />
            </span>
          </div>

          <div className="kt-rooms__panes">
            {productTabs.map((room, i) => (
              <figure key={room.id} id={`kt-room-${room.id}`} className="kt-room" data-kt-pane={i} data-on={i === 0 ? '' : undefined}>
                <BrowserWindow url={`${showcaseHost} / ${room.label.toLowerCase()}`}>
                  <div className="kt-screen">
                    <img
                      src={room.image.src}
                      srcSet={room.image.srcSet}
                      sizes="auto, (min-width: 1024px) 52vw, 92vw"
                      alt={room.image.alt}
                      width={room.image.width}
                      height={room.image.height}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </BrowserWindow>
                <figcaption>
                  <span className="pg-mono">
                    {pad2(i + 1)} / {pad2(productTabs.length)}
                  </span>
                  <H3>{room.label}</H3>
                  <p>{room.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="kt-faq" aria-labelledby="kt-faq-title">
        <H2 id="kt-faq-title" className="pg-h2">
          Questions
        </H2>
        <dl>
          {showcaseFaq.map((f) => (
            <div key={f.question}>
              <dt>{f.question}</dt>
              <dd>{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}

/**
 * Showcase, "the film stage": the product film under the headline,
 * a quiet stats strip, then the five rooms walked by the page scroll, then three questions answered
 * from the product's own FAQ. Every caption is real text; the screens only illustrate it.
 */
export function ShowcasePage({ page }: { page: PageRoute }) {
  const c = showcasePage

  return (
    <div className="pg kt">
      <PageMeta page={page} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: showcaseJsonLd({ path: page.path, name: page.label, description: c.lede, rooms: productTabs, film: showcaseFilm, faq: showcaseFaq }),
        }}
      />
      <ShowcaseHeader nested={false} />
      <ShowcaseBody nested={false} />
    </div>
  )
}

/** The same page as the Home section after Proof (the sidebar Showcase entry scrolls Home to #showcase). */
export function ShowcaseSection() {
  return (
    <section id="showcase" className="pg pg--section kt" aria-labelledby="showcase-title">
      <ShowcaseHeader nested />
      <ShowcaseBody nested />
    </section>
  )
}
