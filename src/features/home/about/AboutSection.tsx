import { ArrowUpRight, MapPin } from '@phosphor-icons/react'
import { aboutSection, capabilities, credentials, type AboutCredential } from '@/content/about'
import { socials } from '@/content/site'
import { personJsonLd } from '@/lib/seo'
import './about.css'

const pad2 = (n: number) => String(n).padStart(2, '0')

const personLd = personJsonLd({
  description: aboutSection.lede,
  skills: capabilities.map((c) => c.title),
  sameAs: socials.filter((s) => !s.partner).map((s) => s.href),
  employer: aboutSection.employer,
})

function Credential({ c }: { c: AboutCredential }) {
  const body = (
    <>
      <span className="ab__cred-mark">
        {c.image ? <img className={c.imageDark ? 'only-light' : undefined} src={c.image.src} alt="" width={c.image.width} height={c.image.height} loading="lazy" decoding="async" /> : c.icon ? <c.icon size={16} weight="fill" aria-hidden /> : <MapPin size={16} weight="fill" aria-hidden />}
        {c.imageDark ? <img className="only-dark" src={c.imageDark.src} alt="" width={c.imageDark.width} height={c.imageDark.height} loading="lazy" decoding="async" /> : null}
      </span>
      <span className="ab__cred-copy">
        <b>{c.title}</b>
        <small>{c.detail}</small>
      </span>
    </>
  )
  return c.href ? (
    <a className="ab__cred" href={c.href} target="_blank" rel="noopener noreferrer">
      {body}
      <ArrowUpRight className="ab__cred-go" size={15} weight="bold" aria-hidden />
    </a>
  ) : (
    <span className="ab__cred">{body}</span>
  )
}

/**
 * About, "The floor": the photo set large, standing on a
 * hairline floor that runs edge to edge, the story set over its space; the four roles with their
 * tools as raised paper keys and the credentials sit below the floor. The picture rises onto the
 * floor as it scrolls in (CSS scroll-driven, compositor only; still under reduced motion).
 */
export function AboutSection() {
  const s = aboutSection
  return (
    <section id="about" className="ab" aria-labelledby="ab-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personLd }} />
      <header>
        <p className="wk-eyebrow">{s.eyebrow}</p>
        <h2 id="ab-title" className="wk-title">
          <span>{s.titleThin}</span> <span className="wk-title__bold">{s.titleBold}</span>
        </h2>
        <p className="ab__lede">{s.lede}</p>
      </header>

      <div className="ab__stage">
        <p className="ab__lead">
          {s.lead} <span>{s.leadQuiet}</span>
        </p>
        <div className="ab__pic">
          <img
            src={s.picture.src}
            alt={s.picture.alt}
            width={s.picture.width}
            height={s.picture.height}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="ab__below">
        <p className="ab__note">{s.note}</p>
        <ul className="ab__caps">
          {capabilities.map((c, i) => (
            <li key={c.title} className="ab__cap">
              <span className="ab__keys">
                {c.tools.map((t) => (
                  <span key={t.name} className="ab__key" title={t.name}>
                    <img src={t.logo} alt={t.name} width={20} height={20} loading="lazy" decoding="async" />
                  </span>
                ))}
              </span>
              <span className="ab__cap-title">{c.title}</span>
              <span className="ab__cap-i" aria-hidden>
                {pad2(i + 1)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="ab__creds">
        {credentials.map((c) => (
          <Credential key={c.id} c={c} />
        ))}
      </div>
    </section>
  )
}
