import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Icon } from '@phosphor-icons/react'
import { BookOpen, CaretLeft, CaretRight, ChatText, Export, FileText, FilmStrip, LinkSimple, Sparkle, UsersThree, YoutubeLogo } from '@phosphor-icons/react'
import { liveAutomation, type FlowIcon } from '@/content/automation'
import { useScrollScene } from '@/hooks/use-scroll-scene'
import { gsap, MOTION_CONDITIONS } from '@/lib/motion/gsap'
import { automationScene } from './automation-scene'
import { placedLinks, placedNodes, related, VIEW, zones, zoomBox } from './flow-model'
import './automation.css'

const ICONS: Record<FlowIcon, Icon> = {
  url: LinkSimple,
  uploads: YoutubeLogo,
  transcript: ChatText,
  audience: UsersThree,
  hooks: Sparkle,
  brief: FileText,
  clips: FilmStrip,
  ebook: BookOpen,
  files: Export,
}
// The drawn content spans y 15-560: crop the empty edges so the diagram reads bigger.
const FULL_VIEW = `0 15 ${VIEW.w} 545`
const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * Live automation: a lead's path through the booking pipeline, drawn stage by stage while the section
 * holds (CSS sticky) and the page scrolls. The rail follows the method steps. Pointing at a
 * stage inspects it; on phones a tap zooms the diagram onto it, with previous / next.
 */
export function AutomationSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  useScrollScene(sectionRef, automationScene)

  const [focus, setFocus] = useState<string | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const [hover, setHover] = useState(true)
  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setHover(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  // Phones: zoom the diagram onto the focused stage (and back out).
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || hover) return
    const target = focus && zoomed ? zoomBox(placedNodes.find((n) => n.id === focus)!) : FULL_VIEW
    if (window.matchMedia(MOTION_CONDITIONS.reduce).matches) svg.setAttribute('viewBox', target)
    else gsap.to(svg, { attr: { viewBox: target }, duration: 0.7, ease: 'power3.inOut', overwrite: true })
  }, [focus, zoomed, hover])

  const rel = focus ? related(focus) : null
  const current = placedNodes.find((n) => n.id === focus) ?? null
  const index = current ? placedNodes.indexOf(current) : -1

  const choose = (id: string) => {
    if (hover) return setFocus(id)
    const again = focus === id && zoomed
    setFocus(again ? null : id)
    setZoomed(!again)
  }
  const step = (by: number) => {
    const next = placedNodes[(index + by + placedNodes.length) % placedNodes.length]!
    setFocus(next.id)
    setZoomed(true)
  }
  const onKey = (event: KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(id)
    } else if (event.key === 'Escape') {
      setFocus(null)
      setZoomed(false)
    }
  }

  return (
    <section ref={sectionRef} id="automation" className="fl" aria-labelledby="fl-title">
      <div className="fl__pin">
        <header className="fl__head">
          <p className="wk-eyebrow">{liveAutomation.eyebrow}</p>
          <h2 id="fl-title" className="wk-title">
            <span>{liveAutomation.titleThin}</span> <span className="wk-title__bold">{liveAutomation.titleBold}</span>
          </h2>
        </header>

        <div className="fl__grid">
          <div className="fl__rail">
            <span className="fl__rule" aria-hidden>
              <i data-fl-fill />
            </span>
            <ol className="fl__steps">
              {liveAutomation.steps.map((s, i) => (
                <li key={s.name} data-fl-step={i}>
                  <span className="fl__num">{pad2(i + 1)}</span>
                  {s.name}
                </li>
              ))}
            </ol>
            <div className="fl__details">
              {liveAutomation.steps.map((s, i) => (
                <p key={s.name} data-fl-detail={i}>
                  {s.body}
                </p>
              ))}
            </div>
          </div>

          <div className="fl__panel" data-focus={focus ?? undefined}>
            <div className="fl__panel-head">
              <h3 className="fl__panel-title">
                {liveAutomation.panel.lead} <span>{liveAutomation.panel.rest}</span>
              </h3>
              <p className="fl__legend">
                <span data-plane="auto">{liveAutomation.legend.auto}</span>
                <span data-plane="lead">{liveAutomation.legend.lead}</span>
              </p>
              <span className="fl__readout" data-fl-readout aria-hidden />
            </div>

            <svg
              ref={svgRef}
              className="fl__svg"
              viewBox={FULL_VIEW}
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-label={`${liveAutomation.panel.lead} ${liveAutomation.panel.rest}`}
              onPointerLeave={() => hover && setFocus(null)}
            >
              <defs>
                <marker id="fl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path className="fl__arrow" d="M0 0 L10 5 L0 10 Z" />
                </marker>
                {placedLinks
                  .filter((l) => l.style === 'dashed')
                  .map((l) => (
                    <mask key={l.id} id={`fl-m-${l.id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW.w} height={VIEW.h}>
                      <path d={l.d} pathLength={1} className="fl__mask-draw" data-fl-mask={l.id} />
                    </mask>
                  ))}
              </defs>

              <g className="fl__zone" data-fl-zone="booking" data-a={zones.booking.a} data-b={zones.booking.b}>
                <rect x={zones.booking.x} y={zones.booking.y} width={zones.booking.w} height={zones.booking.h} />
                <text x={zones.booking.x + zones.booking.w / 2} y={zones.booking.y - 12}>
                  {liveAutomation.zones.booking}
                </text>
              </g>
              <g className="fl__zone" data-fl-zone="pipeline" data-a={zones.pipeline.a} data-b={zones.pipeline.b}>
                <rect x={zones.pipeline.x} y={zones.pipeline.y} width={zones.pipeline.w} height={zones.pipeline.h} />
                <text x={zones.pipeline.x + zones.pipeline.w / 2} y={zones.pipeline.y - 12}>
                  {liveAutomation.zones.pipeline}
                </text>
              </g>

              {placedLinks.map((l) => {
                const hi = focus && (l.from === focus || l.to === focus) ? '' : undefined
                return l.style === 'solid' ? (
                  <g key={l.id} className="fl__link" data-style="solid" data-hi={hi}>
                    <path d={l.d} pathLength={1} className="fl__signal" data-fl-link={l.id} data-a={l.a} data-b={l.b} markerEnd="url(#fl-arrow)" />
                    <circle className="fl__packet" r={3.5} cx={l.x1} cy={l.y} data-fl-packet={l.id} data-x1={l.x1} data-x2={l.x2} />
                  </g>
                ) : (
                  <g key={l.id} className="fl__link" data-style="dashed" data-hi={hi}>
                    <path d={l.d} className="fl__dash" mask={`url(#fl-m-${l.id})`} data-fl-link={l.id} data-a={l.a} data-b={l.b} />
                    {l.label ? (
                      <text className="fl__link-label" x={l.lx} y={l.ly} data-fl-label={l.id}>
                        {l.label}
                      </text>
                    ) : null}
                  </g>
                )
              })}

              {placedNodes.map((n) => {
                const Glyph = ICONS[n.icon]
                return (
                  <g
                    key={n.id}
                    className="fl__node"
                    data-plane={n.plane}
                    data-rel={rel?.has(n.id) ? '' : undefined}
                    data-on={focus === n.id ? '' : undefined}
                    data-fl-node={n.id}
                    data-a={n.a}
                    data-b={n.b}
                    role="button"
                    tabIndex={0}
                    aria-pressed={focus === n.id}
                    // The name IS the visible title + tag (WCAG 2.5.3); an aria-label string cannot match SVG
                    // text, which reads as one run with no space between the two. The detail is the description.
                    aria-labelledby={`fl-t-${n.id} fl-g-${n.id}`}
                    aria-describedby={`fl-d-${n.id}`}
                    onPointerEnter={() => hover && setFocus(n.id)}
                    onClick={() => choose(n.id)}
                    onFocus={() => hover && setFocus(n.id)}
                    onKeyDown={(e) => onKey(e, n.id)}
                  >
                    <rect className="fl__box" x={n.x} y={n.y} width={n.w} height={n.h} />
                    <path className="fl__contour" d={`M${n.x} ${n.y} h${n.w} v${n.h} h${-n.w} Z`} pathLength={1} />
                    <rect className="fl__mark" x={n.x + 9} y={n.y + 9} width={6} height={6} />
                    <text id={`fl-t-${n.id}`} className="fl__title" x={n.x + n.w / 2} y={n.y + 33}>
                      {n.title}
                    </text>
                    <g className="fl__icon" transform={`translate(${n.x + n.w / 2 - 20} ${n.y + n.h / 2 - 18})`}>
                      <Glyph size={40} weight="light" />
                    </g>
                    <g className="fl__tag">
                      <rect x={n.x + 10} y={n.y + n.h - 32} width={n.w - 20} height={20} />
                      <text id={`fl-g-${n.id}`} x={n.x + n.w / 2} y={n.y + n.h - 18.4}>
                        {n.tag}
                      </text>
                    </g>
                  </g>
                )
              })}
            </svg>
            {/* The nodes' descriptions live outside them: a <desc> inside the button counted as visible
                text missing from its name (Lighthouse label-content-name-mismatch). Hidden text still
                reads through aria-describedby. */}
            <div hidden>
              {placedNodes.map((n) => (
                <p key={n.id} id={`fl-d-${n.id}`}>
                  {n.about}
                </p>
              ))}
            </div>

            <div className="fl__inspect" aria-live="polite">
              {current ? (
                <div key={current.id} className="fl__card">
                  <p className="fl__chip">
                    <span data-plane={current.plane}>{current.plane === 'auto' ? liveAutomation.legend.auto : liveAutomation.legend.lead}</span>
                    <span>{current.tag}</span>
                  </p>
                  <h4>{current.title}</h4>
                  <p className="fl__about">{current.about}</p>
                </div>
              ) : (
                <p className="fl__hint">{hover ? liveAutomation.hint.hover : liveAutomation.hint.tap}</p>
              )}
              {!hover && zoomed && current ? (
                <div className="fl__pager">
                  <button type="button" onClick={() => step(-1)} aria-label="Previous stage">
                    <CaretLeft size={18} weight="bold" aria-hidden />
                  </button>
                  <span>
                    {pad2(index + 1)} / {pad2(placedNodes.length)}
                  </span>
                  <button type="button" onClick={() => step(1)} aria-label="Next stage">
                    <CaretRight size={18} weight="bold" aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>

            <span className="fl__bars" aria-hidden>
              {placedNodes.map((n) => (
                <i key={n.id} data-fl-bar={n.index} data-on={current?.index === n.index ? '' : undefined} />
              ))}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
