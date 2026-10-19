import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowRight, ArrowUpRight, X } from '@phosphor-icons/react'
import { HeadMeta } from '@/app/PageMeta'
import { chapterPath, workChapters } from '@/content/home'
import type { WorkChapter, WorkItem } from '@/content/schema'
import { gsap, MOTION_CONDITIONS, spring } from '@/lib/motion/gsap'
import { chapterJsonLd, chapterTitle } from '@/lib/seo'
import { useSheet } from './use-sheet'
import './work-sheet.css'

type SheetState = { sheet?: boolean } | null

/** Builds without a public link say why: the code lives in a private repo. */
const PRIVATE = 'Private repo'

/**
 * The showcase for one Work chapter, at its own URL (/work/<chapter>) so it can be shared, indexed
 * and opened directly. A native modal <dialog> (focus trap, Escape, top layer) holding a sheet that
 * rises over Home. Closing goes back in history when the visitor came from Home, so Back closes it
 * too. The last chapter stays rendered while the sheet leaves.
 */
export function WorkSheet({ chapter }: { chapter: WorkChapter | null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const fromHome = !!(location.state as SheetState)?.sheet
  const [shown, setShown] = useState<WorkChapter | null>(chapter)
  if (chapter && chapter !== shown) setShown(chapter)

  const requestClose = () => {
    if (fromHome) navigate(-1)
    else navigate('/', { preventScrollReset: true })
  }
  const { dialogRef, panelRef, scrimRef, onDragStart } = useSheet({
    open: !!chapter,
    onRequestClose: requestClose,
    onClosed: () => setShown(null),
  })

  // New chapter (opened, or "Next" inside the sheet): back to the top and bring the builds in.
  const bodyRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const body = bodyRef.current
    if (!body || !shown) return
    body.scrollTop = 0
    headRef.current?.removeAttribute('data-scrolled')
    if (window.matchMedia(MOTION_CONDITIONS.reduce).matches) return
    const items = Array.from(body.querySelectorAll('[data-reveal]')).slice(0, 8)
    const tween = gsap.from(items, { y: 22, autoAlpha: 0, stagger: 0.045, delay: 0.08, ...spring({ response: 0.55 }) })
    return () => {
      tween.revert()
    }
  }, [shown])

  const onBodyScroll = () => {
    const scrolled = (bodyRef.current?.scrollTop ?? 0) > 4
    headRef.current?.toggleAttribute('data-scrolled', scrolled)
  }

  const onDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === scrimRef.current) requestClose()
  }

  const next = shown ? workChapters[(workChapters.indexOf(shown) + 1) % workChapters.length] : undefined

  return (
    <dialog
      ref={dialogRef}
      className="sh"
      aria-labelledby="sh-title"
      data-lenis-prevent
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      onClick={onDialogClick}
    >
      <div ref={scrimRef} className="sh__scrim" />
      {chapter ? (
        <>
          <HeadMeta title={chapterTitle(chapter)} description={chapter.description} path={chapterPath(chapter.id)} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: chapterJsonLd(chapter, chapterPath(chapter.id)) }} />
        </>
      ) : null}

      <div ref={panelRef} className="sh__panel" tabIndex={-1}>
        <div className="sh__grab" onPointerDown={onDragStart} aria-hidden>
          <span />
        </div>

        {shown ? (
          <>
            <header ref={headRef} className="sh__head" onPointerDown={onDragStart}>
              <div>
                <p className="wk-count">
                  {shown.count} {shown.unit}
                </p>
                <h2 id="sh-title" className="sh__title">
                  {shown.title}
                </h2>
              </div>
              <button type="button" className="sh__close" onClick={requestClose} aria-label="Close">
                <X size={20} weight="bold" aria-hidden />
              </button>
            </header>

            <div ref={bodyRef} className="sh__body" onScroll={onBodyScroll}>
              <p className="sh__intro">{shown.description}</p>
              {shown.lead || shown.items.length === 1 ? <Single chapter={shown} /> : shown.items.some((item) => item.image) ? <Showcase items={shown.items} /> : <Groups items={shown.items} />}

              {next && next !== shown ? (
                <nav className="sh__next" aria-label="More work" data-reveal>
                  <Link to={chapterPath(next.id)} replace state={location.state} preventScrollReset>
                    <span className="wk-count">Next</span>
                    <span className="sh__next-title">{next.title}</span>
                    <ArrowRight size={22} weight="bold" aria-hidden />
                  </Link>
                </nav>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </dialog>
  )
}

/** Picture-led builds: the first one leads in a wide row, the rest in a grid. */
function Showcase({ items }: { items: WorkItem[] }) {
  // Items with a `group` (Websites) render as one titled grid per group, in first-seen order.
  const groups = [...new Set(items.map((item) => item.group ?? ''))]
  return (
    <div className="sh__sets">
      {groups.map((group, gi) => (
        <section key={group} className="sh__set">
          {group ? (
            <h3 className="sh__group-title" data-reveal>
              {group}
            </h3>
          ) : null}
          <Grid items={items.filter((item) => (item.group ?? '') === group)} lead={gi === 0} />
        </section>
      ))}
    </div>
  )
}

function Grid({ items, lead }: { items: WorkItem[]; lead: boolean }) {
  return (
    <ul className="sh__grid">
      {items.map((item, i) => (
        <li key={item.id} className={lead && i === 0 ? 'sh__item sh__item--lead' : 'sh__item'} data-reveal>
          <ItemLink item={item}>
            <span className={item.href ? 'sh__shot' : 'sh__shot sh__shot--contain'}>
              {item.image ? (
                <img
                  src={item.image.src}
                  alt={item.image.alt}
                  width={item.image.width}
                  height={item.image.height}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ) : null}
            </span>
            <span className="sh__cap">
              <span className="wk-count">
                {item.kicker}
                {item.status ? <span className="sh__status">{item.status}</span> : null}
              </span>
              <h3 className="sh__name">
                {item.name}
                {item.href ? <ArrowUpRight size={16} weight="bold" aria-hidden /> : null}
              </h3>
              <span className="sh__sum">{item.summary}</span>
              <span className="wk-count">{[item.stack, item.href ? null : PRIVATE].filter(Boolean).join(' · ')}</span>
            </span>
          </ItemLink>
        </li>
      ))}
    </ul>
  )
}

/** Builds with no pictures (side projects and experiments): grouped rows. */
function Groups({ items }: { items: WorkItem[] }) {
  const groups = [...new Set(items.map((item) => item.kicker))]
  return (
    <div className="sh__groups">
      {groups.map((group) => (
        <section key={group} className="sh__group" data-reveal>
          <h3 className="sh__group-title">{group}</h3>
          <ul>
            {items
              .filter((item) => item.kicker === group)
              .map((item) => (
                <li key={item.id} className="sh__row">
                  <h4 className="sh__name">{item.name}</h4>
                  <p className="sh__sum">{item.summary}</p>
                  <p className="wk-count">
                    {item.stack}
                    {item.status ? <span className="sh__status">{item.status}</span> : null}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** One build: its picture when it has one, what it is (kicker, status, summary, stack), its link and gallery. */
function Single({ chapter }: { chapter: WorkChapter }) {
  const { lead, gallery = [], link } = chapter
  const build = chapter.items.length === 1 ? chapter.items[0] : undefined
  return (
    <div className="sh__single">
      {lead ? (
        <a className="sh__shot sh__shot--lead" href={link?.href ?? lead.src} target="_blank" rel="noopener" data-reveal>
          <img src={lead.src} alt={lead.alt} width={lead.width} height={lead.height} decoding="async" />
        </a>
      ) : null}
      {build ? (
        <div className="sh__cap" data-reveal>
          <span className="wk-count">
            {build.kicker}
            {build.status ? <span className="sh__status">{build.status}</span> : null}
          </span>
          <h3 className="sh__name">{build.name}</h3>
          <p className="sh__sum">{build.summary}</p>
          <p className="wk-count">{[build.stack, build.href || link ? null : PRIVATE].filter(Boolean).join(' · ')}</p>
        </div>
      ) : null}
      {link ? (
        <a className="btn-line sh__live" href={link.href} target="_blank" rel="noopener" data-reveal>
          {link.label}
          <ArrowUpRight size={16} weight="bold" aria-hidden />
        </a>
      ) : null}
      <ul className="sh__gallery">
        {gallery.map((img) => (
          <li key={img.src} data-reveal>
            <a className="sh__shot" href={img.src} target="_blank" rel="noopener">
              <img src={img.src} alt={img.alt} width={img.width} height={img.height} loading="lazy" decoding="async" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A live build opens in a new tab; one without a public link is a plain block. */
function ItemLink({ item, children }: { item: WorkItem; children: ReactNode }) {
  if (!item.href) return <div className="sh__link">{children}</div>
  return (
    <a className="sh__link" href={item.href} target="_blank" rel="noopener">
      {children}
    </a>
  )
}
