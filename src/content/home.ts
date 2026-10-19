import type { WorkChapter } from './schema'
import { method } from './method'
import { autoEditor, clientToolCount, clientTools, earlyBuilds, govrate, repos, thisSite, workCount } from './work'

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
/** A count as a word ("twelve"), so copy that quotes a count follows the data. Past twenty it stays a numeral. */
const word = (n: number) => WORDS[n] ?? String(n)
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Home page copy. The hero pairs a thin line with a bold one. The bold line is sized in `cqi` in
 * features/home/hero/hero.css so it fills the column: re-measure it when you change the words
 * (see the comment on `.hero__title` there).
 */
export const homeHero = {
  headlineThin: 'Full-stack developer.',
  headlineBold: 'I build tools clients actually use.',
  subhead: `${capital(word(workCount))} builds and ${word(clientToolCount)} client tools shipped, from YouTube automation to lead research. Most of them are running in someone’s workflow today.`,
  cta: { label: 'Get in touch', to: '/#contact' },
}

/**
 * The statement under the hero: words light up as the page scrolls, each keyword lands bold and
 * moves the tracker. Replace the words, keep four keywords (the tracker shows them in order).
 * A string is plain words; `{ key }` is a keyword.
 */
export type ManifestoPart = string | { key: string }

export const homeManifesto = {
  eyebrow: method.eyebrow,
  parts: [
    'I ship in',
    { key: 'small' },
    'steps, each one',
    { key: 'tested' },
    'before you see it. I build the tools clients open',
    { key: 'daily' },
    'and keep their data',
    { key: 'private.' },
  ] satisfies ManifestoPart[],
}

export const homeSections = {
  work: {
    eyebrow: 'Selected work',
    title: `${capital(word(workCount))} builds, ${word(clientToolCount)} for clients.`,
  },
  proof: {
    eyebrow: 'Proof',
    title: 'What I run for clients today.',
  },
  objections: {
    eyebrow: 'Before you write',
    title: 'The three questions everyone asks.',
  },
}

export const ctaBand = {
  title: 'Tell me what is eating your week.',
  body: 'Write a few lines about the tool you need. I reply within one business day with questions or a plan.',
  button: 'Email me your question',
}

/* ---------- Work section ---------- */

/** The URL of a chapter's showcase sheet. Real, shareable and in the sitemap. */
export const chapterPath = (id: string) => `/work/${id}`

export const workSection = {
  ...homeSections.work,
  /** The title as one display line in the hero's thin + bold pairing. */
  titleThin: `${capital(word(workCount))} builds,`,
  titleBold: `${word(clientToolCount)} for clients.`,
  all: { label: `See all ${workCount} builds`, to: '/work' },
}

/**
 * The Work chapters, in bento order. Add, remove or reorder a chapter here; the bento, the sheets and
 * the sitemap follow (the bento's grid areas in work.css are keyed by chapter id). A chapter with one
 * build is a single-build sheet; one with no landscape picture shows its `marks` as a logo face instead.
 */
export const workChapters: WorkChapter[] = [
  {
    id: 'client-tools',
    title: 'Client tools',
    line: 'Built to order for studios and agencies.',
    count: clientTools.length,
    unit: 'tools',
    description: 'Tools I built for content studios and agencies: YouTube research, clips, ebooks, video renders, lead research and publisher scoring.',
    items: clientTools,
  },
  {
    id: 'products',
    title: 'Products',
    line: 'My own product, in development.',
    count: 1,
    unit: 'product',
    description: 'GovRate: anonymous indirect-rate benchmarks for government contractors. Built and working end to end, not launched yet.',
    items: [govrate],
    lead: govrate.image,
  },
  {
    id: 'my-tools',
    title: 'Tools I use myself',
    line: 'My own tools and earlier builds.',
    count: 1 + earlyBuilds.length,
    unit: 'builds',
    description: 'The auto-editor I run on my own recordings, plus two earlier builds: a budget tracker I led a team on and a game whose enemies evolve.',
    items: [autoEditor, ...earlyBuilds],
  },
  {
    id: 'this-site',
    title: 'This site',
    line: 'The portfolio you are reading.',
    count: 1,
    unit: 'site',
    description: 'This portfolio, built with Vite, React and TypeScript and checked by Playwright before every change.',
    lead: thisSite.image,
    items: [thisSite],
    link: { label: 'Read the source', href: repos.thisSite, external: true },
  },
]

export const findChapter = (id: string | undefined) => workChapters.find((chapter) => chapter.id === id)
