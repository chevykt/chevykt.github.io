import { Link } from 'react-router'
import { chapterPath, workChapters, workSection } from '@/content/home'
import { chapterPicture } from './chapter-picture'
import { ChapterFace } from './ChapterFace'
import './work.css'

/** Tiles are lazy, so Chrome reads their real width (`auto`); the fallback is the largest tile's share
 *  of the screen (measured: ~37vw from 1280 up, ~62vw at 1024, ~85vw on phones). */
const TILE_SIZES = 'auto, (min-width: 1280px) 38vw, (min-width: 1024px) 62vw, 88vw'

/**
 * Work: a bento of the five chapters. Every chapter on one screen as tiles of different sizes, the biggest
 * chapters largest (grid areas in work.css, keyed by chapter id); the tile is "A Clean frame". Nothing
 * holds: tiles rise in as they scroll into view. Every tile is a real link to /work/<chapter>, which opens that chapter's sheet over Home.
 */
export function WorkSection() {
  return (
    <section id="work" className="wk wb" aria-labelledby="work-title">
      <header className="wb__head">
        <p className="wk-eyebrow">{workSection.eyebrow}</p>
        <h2 id="work-title" className="wk-title">
          <span className="wk-title__thin">{workSection.titleThin}</span> <span className="wk-title__bold">{workSection.titleBold}</span>
        </h2>
      </header>
      <ul className="wb__grid">
        {workChapters.map((chapter) => {
          const pic = chapterPicture(chapter)
          return (
            <li key={chapter.id} className="wb__cell" data-area={chapter.id}>
              <Link to={chapterPath(chapter.id)} state={{ sheet: true }} preventScrollReset className="wb__tile" data-kind={pic ? 'pic' : 'marks'}>
                <span className="wb__media" aria-hidden>
                  {pic ? (
                    <img
                      src={pic.src}
                      srcSet={pic.srcSet}
                      sizes={pic.srcSet ? TILE_SIZES : undefined}
                      alt=""
                      width={pic.width}
                      height={pic.height}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : <ChapterFace chapter={chapter} foot={false} />}
                </span>
                <span className="wb__cap">
                  <b>{chapter.title}</b>
                  <span className="wk-count">
                    {chapter.count} {chapter.unit}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
