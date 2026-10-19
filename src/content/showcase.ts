import type { Faq, Image, ProductFilm, ProductTab } from './schema'

/** The address shown in the browser-window bars around the room screens: a local build, not a live site. */
export const showcaseHost = 'localhost:3000'

export const showcasePage = {
  eyebrow: 'Showcase',
  titleThin: 'GovRate,',
  titleBold: 'in development.',
  lede: 'Anonymous indirect-rate benchmarks for government contractors, which I am building end to end. It is not launched yet; the screens below come from a local build running on sample data.',
  footnote: 'Next.js, FastAPI, Supabase and Stripe. Private repo.',
  cta: { label: 'Ask me about GovRate', href: '/#contact', external: false },
  roomsTitle: 'The five parts',
}

/** A room capture (1600 wide) with 800 / 1200 copies: the rooms show at 343-970px (scripts/make-image-variants.mjs). */
const room = (file: string, alt: string, height: number): Image => ({
  src: `/images/showcase/${file}.webp`,
  alt,
  width: 1600,
  height,
  srcSet: `/images/showcase/800/${file}.webp 800w, /images/showcase/1200/${file}.webp 1200w, /images/showcase/${file}.webp 1600w`,
})

/** No film: there is no honest recording to show yet. Set a ProductFilm here to bring the film window back. */
export const showcaseFilm: ProductFilm | null = null

/** Number + unit, read from the GovRate repo (its migrations, API routes and build docs). No usage figures. */
export const showcaseStats: [string, string][] = [
  ['11', 'database tables, all behind row-level security'],
  ['8', 'API route groups'],
  ['9', 'build steps done'],
  ['5', 'parts, shown below'],
]

/** The five built parts, each with a caption and a local screen on sample data. */
export const productTabs: ProductTab[] = [
  {
    id: 'submission',
    label: 'Rate submission',
    body: 'A contractor enters fringe, overhead and G&A once a year, with no personal details. Rates are encrypted the moment they arrive, and a live preview shows the wrap rate before anything is sent.',
    image: room('govrate-submission', 'GovRate rate submission form filled with sample rates', 1000),
  },
  {
    id: 'benchmarks',
    label: 'Benchmarks',
    body: 'Each rate sits on its peer group’s spread, from the 25th to the 75th percentile, by NAICS code, agency mix and size. Any group with fewer than five contributors is withheld.',
    image: room('govrate-benchmarks', 'GovRate benchmarks dashboard with sample percentiles', 1000),
  },
  {
    id: 'audit-risk',
    label: 'Audit-risk score',
    body: 'A 0 to 100 read of how likely a rate structure is to draw DCAA scrutiny, scored across fringe, overhead, G&A and cost-type exposure, with fixes grounded in FAR Part 31.',
    image: room('govrate-audit-risk', 'GovRate rate analysis with a sample audit-risk score', 1000),
  },
  {
    id: 'simulator',
    label: 'Contract simulator',
    body: 'Before a bid, it projects the post-win rate structure, the margin and the change in audit risk, then saves each scenario so two can be compared side by side.',
    image: room('govrate-simulator', 'GovRate contract simulator with two sample scenarios', 1000),
  },
  {
    id: 'extension',
    label: 'Chrome extension',
    body: 'Overlays benchmarks on SAM.gov opportunities and LinkedIn company pages. The API key stays in the browser and is sent only to the GovRate API.',
    image: room('govrate-extension', 'GovRate Chrome extension popup', 1000),
  },
]

/** Three questions about GovRate, answered plainly. */
export const showcaseFaq: Faq[] = [
  {
    question: 'What is built so far?',
    answer: 'Rate submission, the benchmarks dashboard, the audit-risk score, the contract simulator, Stripe billing tiers and the Chrome extension. Steps one to eight each have their own verify script in the repo.',
  },
  {
    question: 'Is it live?',
    answer: 'Not yet. GovRate is in development and has not launched, so there is no traction to report. The screens here run on a local build with sample data.',
  },
  {
    question: 'How does it keep rates private?',
    answer: 'Identities and rates live in separate systems and are never joined in a result. Every rate is encrypted at rest, and any peer group with fewer than five contributors is suppressed.',
  },
]
