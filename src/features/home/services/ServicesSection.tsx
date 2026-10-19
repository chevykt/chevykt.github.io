import { useRef, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from '@phosphor-icons/react'
import { chapterPath } from '@/content/home'
import { services, servicesSection } from '@/content/services'
import { useScrollScene } from '@/hooks/use-scroll-scene'
import { servicesScene } from './services-scene'
import './services.css'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Services, "Card stack". The heading holds while the service
 * cards are dealt onto a pile: each card slides up and settles a few pixels below the one before,
 * which sinks back (scale) and dims under it, so a thin edge of every earlier card stays in view.
 * Phones: the same pile on native CSS sticky, without the sink. Reduced motion: a plain stack.
 * Every card opens the Work chapter that shows that service.
 */
export function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useScrollScene(sectionRef, servicesScene)

  return (
    <section ref={sectionRef} id="services" className="sv" aria-labelledby="services-title">
      <header className="sv__head">
        <p className="sv__eyebrow">
          {servicesSection.eyebrow}
          <span className="sv__rule" aria-hidden>
            <i data-sv-rule />
          </span>
        </p>
        <h2 id="services-title" className="sv__title">
          <span>{servicesSection.titleThin}</span> <b>{servicesSection.titleBold}</b>
        </h2>
      </header>
      <ol className="sv__stack" style={{ '--n': services.length } as CSSProperties}>
        {services.map((service, i) => (
          <li key={service.id} className="sv__item" style={{ '--i': i } as CSSProperties}>
            <Link
              to={chapterPath(servicesSection.work[service.id] ?? 'client-tools')}
              state={{ sheet: true }}
              preventScrollReset
              className="sv__card"
              data-card
            >
              <span className="sv__top">
                <span className="sv__index">
                  {pad(i + 1)}
                  <span>{service.outcome}</span>
                </span>
                <span className="sv__tags">
                  {service.tools.map((tool) => (
                    <span key={tool.name}>{tool.name}</span>
                  ))}
                </span>
              </span>
              <span className="sv__name">{service.title}</span>
              <span className="sv__desc">
                {service.summary} {service.bullets.join('. ')}.
              </span>
              <span className="sv__explore">
                {servicesSection.explore}
                <ArrowUpRight size={14} weight="bold" aria-hidden />
              </span>
              <span className="sv__dim" aria-hidden />
            </Link>
          </li>
        ))}
        {/* Room for the finished pile to hold (services.css .sv__tail): sticky range ends at the list's content box. */}
        <li className="sv__tail" aria-hidden />
      </ol>
    </section>
  )
}
