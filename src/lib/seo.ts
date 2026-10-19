import { site } from '@/content/site'
import type { Faq, ProductFilm, ProductTab, Quote, WorkChapter } from '@/content/schema'

/** Absolute URL for a site path or an already absolute link. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  return `${site.url}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}

/** Title for a Work chapter's own URL. */
export const chapterTitle = (chapter: WorkChapter) => `${chapter.title}: ${chapter.count} ${chapter.unit} | Work by ${site.name}`

/**
 * schema.org structured data for a Work chapter: a CollectionPage whose main entity is the list of
 * builds, each linking to its live page and picture. Serialized safe for an inline <script>.
 */
export function chapterJsonLd(chapter: WorkChapter, path: string): string {
  const person = { '@type': 'Person', name: site.name, url: site.url, jobTitle: site.role }
  const builds = chapter.items.length
    ? chapter.items.map((item) => ({
        '@type': chapter.id === 'apps' ? 'SoftwareApplication' : 'CreativeWork',
        name: item.name,
        description: item.summary,
        ...(item.href ? { url: absoluteUrl(item.href) } : {}),
        ...(item.image ? { image: absoluteUrl(item.image.src) } : {}),
        ...(chapter.id === 'apps' ? { applicationCategory: 'MobileApplication' } : {}),
        creator: person,
      }))
    : [
        {
          '@type': 'CreativeWork',
          name: chapter.title,
          description: chapter.description,
          ...(chapter.link ? { url: absoluteUrl(chapter.link.href) } : {}),
          ...(chapter.lead ? { image: absoluteUrl(chapter.lead.src) } : {}),
          creator: person,
        },
      ]

  const data = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: chapter.title,
    description: chapter.description,
    url: absoluteUrl(path),
    isPartOf: { '@type': 'WebSite', name: `${site.name} - ${site.brand}`, url: site.url },
    author: person,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: builds.length,
      itemListElement: builds.map((item, i) => ({ '@type': 'ListItem', position: i + 1, item })),
    },
  }
  // "<" escaped so a value can never close the script element early.
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad2 = (n: number) => String(n).padStart(2, '0')

/** "May 4, 2026" -> "2026-05-04". Parsed by hand: Date() would read it as local midnight and shift the day in UTC. */
export function isoDay(display: string): string {
  const m = /^([A-Z][a-z]{2})[a-z]* (\d{1,2}), (\d{4})$/.exec(display)
  const month = m ? MONTHS.indexOf(m[1]!) : -1
  if (!m || month < 0) throw new Error(`isoDay: unreadable date "${display}"`)
  return `${m[3]}-${pad2(month + 1)}-${pad2(Number(m[2]))}`
}

/** "0:32" -> "PT0M32S" (ISO 8601 duration). */
export function isoDuration(clock: string): string {
  const [min, sec] = clock.split(':').map(Number)
  return `PT${min}M${sec}S`
}

const person = () => ({ '@type': 'Person', '@id': `${site.url}/#person`, name: site.name, url: site.url, jobTitle: site.role })

function breadcrumbs(path: string, name: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name, item: absoluteUrl(path) },
    ],
  }
}

function videoObject(v: { name: string; description: string; thumbnail: string; src: string; duration: string; published: string }) {
  return {
    '@type': 'VideoObject',
    name: v.name,
    description: v.description,
    thumbnailUrl: absoluteUrl(v.thumbnail),
    contentUrl: absoluteUrl(v.src),
    uploadDate: v.published,
    duration: isoDuration(v.duration),
  }
}

type PersonLd = { description: string; skills: string[]; sameAs: string[]; employer: string }

/**
 * Home's About section: you as a Person (the `#person` node the other pages point at), with
 * the profiles that confirm who you are (content/site.ts).
 */
export function personJsonLd({ description, skills, sameAs, employer }: PersonLd): string {
  return serialize([
    {
      ...person(),
      description,
      image: absoluteUrl(site.avatar.src),
      address: { '@type': 'PostalAddress', addressCountry: site.countryCode },
      worksFor: { '@type': 'Organization', name: employer },
      knowsAbout: skills,
      sameAs,
    },
  ])
}

const serialize = (graph: object[]) => JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')

type ShowcaseLd = { path: string; name: string; description: string; rooms: ProductTab[]; film: ProductFilm | null; faq: Faq[] }

/** Showcase page: the product as a SoftwareApplication, its film, the visible FAQ and the breadcrumb. */
export function showcaseJsonLd({ path, name, description, rooms, film, faq }: ShowcaseLd): string {
  return serialize([
    {
      '@type': 'SoftwareApplication',
      name,
      description,
      url: absoluteUrl(path),
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web browser',
      featureList: rooms.map((r) => `${r.label}: ${r.body}`),
      screenshot: rooms.map((r) => absoluteUrl(r.image.src)),
      creator: person(),
    },
    ...(film ? [videoObject({ name: film.name, description: film.description, thumbnail: film.poster.src, src: film.src, duration: film.duration, published: film.published })] : []),
    {
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    },
    breadcrumbs(path, name),
  ])
}

type ContactLd = { path: string; title: string; description: string; faq: Faq[] }

/** Contact page: a ContactPage about you with your email as the contact point, the visible FAQ, the breadcrumb. */
export function contactJsonLd({ path, title, description, faq }: ContactLd): string {
  return serialize([
    {
      '@type': 'ContactPage',
      '@id': absoluteUrl(path),
      name: title,
      description,
      url: absoluteUrl(path),
      about: { ...person(), email: site.email, contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: site.email, availableLanguage: 'English' } },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    },
    breadcrumbs(path, 'Contact'),
  ])
}

type ProofLd = { path: string; title: string; description: string; quotes: Quote[] }

/**
 * Proof page: every quote as a Quotation (none until a real one exists). Deliberately no
 * Review or AggregateRating: reviews a site publishes about itself are not eligible for stars.
 */
export function proofJsonLd({ path, title, description, quotes }: ProofLd): string {
  return serialize([
    {
      '@type': 'WebPage',
      '@id': absoluteUrl(path),
      name: title,
      description,
      url: absoluteUrl(path),
      about: person(),
      hasPart: [
        ...quotes.map((q) => ({
          '@type': 'Quotation',
          text: q.text,
          creator: { '@type': 'Person', name: q.name },
          dateCreated: isoDay(q.date),
          about: { '@id': `${site.url}/#person` },
        })),
      ],
    },
    breadcrumbs(path, 'Proof'),
  ])
}
