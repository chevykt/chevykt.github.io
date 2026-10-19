import type { Image, WorkItem } from './schema'

/** A build's card picture: 1280x720 captures (the two retakes are 1600x900), in public/images/work. */
const shot = (id: string, alt: string, width = 1280, height = 720): Image => ({ src: `/images/work/${id}.webp`, alt, width, height })

/** Repos that are public. Every other build is a private repo and links nowhere. */
export const repos = {
  domainSelector: 'https://github.com/chevykt/domain-selector',
  thisSite: 'https://github.com/chevykt/chevykt.github.io',
}

/* ---------- Client tools ---------- */

export const clientTools: WorkItem[] = [
  {
    id: 'script-context',
    name: 'Channel research → script prompt',
    kicker: 'Client build · 2026',
    summary:
      'Paste a YouTube channel and one video: it pulls the last 30 uploads and the transcript, then has Claude read them twice, once for niche, audience and pain points, once for hook style and structure, and assembles the context prompt the editors write scripts from. The hard part was keeping every claim traceable to a real title or transcript line instead of a guess.',
    stack: 'Node · Claude API · YouTube Data API',
    status: 'Delivered',
    image: shot('script-context', 'Channel research tool with a generated script brief'),
  },
  {
    id: 'tiktok-clips',
    name: 'TikTok clips commentary tool',
    kicker: 'Client build · 2026',
    summary:
      'An editor lost hours hunting clips by hand and reusing ones that had already aired. This pulls candidates into a review grid, remembers what has aired, and writes the narration around the clips the editor picked, with markers the render engine reads. The hard part was keeping every marker tied to its clip, whatever order the script plays them in.',
    stack: 'Node · Claude API · Apify · Python',
    status: 'Delivered',
    image: shot('tiktok-clips', 'TikTok clips tool test run, 49 clip tests passing', 1600, 900),
  },
  {
    id: 'ebook-generator',
    name: 'Channel → ebook generator',
    kicker: 'Client build · 2026',
    summary:
      'Turns a YouTube channel into a finished product: it mines the back catalogue, outlines a book, drafts and rewrites every chapter, then lays out a PDF with a cover and landing page copy. The hard part was consistency across chapters written in separate calls, so a verification pass hunts repeats and contradictions.',
    stack: 'Python · Claude API · YouTube Data API · ReportLab',
    status: 'Delivered',
    image: shot('ebook-generator', 'Channel to ebook generator'),
  },
  {
    id: 'lead-engine',
    name: 'Lead intelligence engine',
    kicker: 'Client build · 2026',
    summary:
      'Inbound lead research and qualification pipeline for an automation agency: it researches each prospect, cross-checks the facts and scores the lead with Claude. The hard part was turning hard-won prospecting rules into code a model can’t talk its way around, proven by 404 offline tests.',
    stack: 'Node · Claude API · Postgres · n8n',
    status: 'Delivered',
    image: shot('lead-engine', 'Lead engine test run, 404 offline proofs passing across 5 suites', 1600, 900),
  },
  {
    id: 'dm-video-tool',
    name: 'DM video renderer',
    kicker: 'Client build · 2026',
    summary:
      'Turns a content studio’s chat-screenshot batches and a CSV sheet into finished DM-story videos, with a local app for timing, zoom, shake and volume. The hard part was frame-accurate sound on every message, for editors on both Windows and macOS.',
    stack: 'Python · FFmpeg · Streamlit',
    status: 'Delivered',
    image: shot('dm-video-tool', 'DM video renderer timing app'),
  },
  {
    id: 'topic-to-video',
    name: 'Topic → video generator',
    kicker: 'Client build · 2026',
    summary:
      'Give it a topic and it writes the script, records the voiceover, finds visuals, lays music and renders a vertical MP4 in about 25 seconds. The hard part was TikTok-style captions synced to the voiceover word by word.',
    stack: 'Python · Gemini · ElevenLabs · FFmpeg',
    status: 'Delivered',
    image: shot('topic-to-video', 'Frames from a generated vertical video on why we dream'),
  },
  {
    id: 'domain-selector',
    name: 'Domain Selector',
    kicker: 'Client build · 2026',
    summary:
      'Internal tool for a link-building agency: scores a publisher inventory CSV against a client brief, surfaces a top-N shortlist and exports the campaign spreadsheet. The hard part was reproducibility: scoring is deterministic and every campaign pins the config version it was scored against.',
    stack: 'Next.js · TypeScript · Prisma · Postgres',
    status: 'Delivered',
    image: shot('domain-selector', 'Domain Selector shortlist screen'),
    href: repos.domainSelector,
  },
]

/* ---------- Products, my own tools, academic, this site ---------- */

export const govrate: WorkItem = {
  id: 'govrate',
  name: 'GovRate',
  kicker: 'Creator · 2026',
  summary:
    'Anonymous fringe, overhead and G&A benchmarking for government contractors, with a DCAA audit-risk score, a contract profitability simulator and a Chrome extension for SAM.gov. Not launched yet. The hard part was the privacy model: rates encrypted at rest, small samples suppressed, and identities kept apart from submissions.',
  stack: 'Next.js · FastAPI · Supabase · Stripe',
  status: 'In development',
  image: { src: '/images/showcase/govrate-benchmarks.webp', alt: 'GovRate benchmarks dashboard on sample data', width: 1600, height: 1000 },
}

export const autoEditor: WorkItem = {
  id: 'auto-editor',
  name: 'Script-matched auto-editor',
  kicker: 'Solo · 2026',
  summary:
    'Cuts dead air, false starts and stutters from tutorial recordings by aligning the speech against the voiceover script. The hard part was cutting only what it is sure of, so ad-libs that aren’t in the script survive.',
  stack: 'Python · faster-whisper · FastAPI',
  status: 'In use',
  image: shot('auto-editor', 'Script-matched auto-editor'),
}

export const academic: WorkItem[] = [
  {
    id: 'baonbuddy',
    name: 'BaonBuddy',
    kicker: 'Team lead · Academic',
    summary:
      'Allowance and expense tracker for Filipino college students, with weekly budget math. I led the four-person team and built the authentication, sessions and database.',
    stack: 'PHP · MySQL · Bootstrap',
    status: 'Academic',
    image: shot('baonbuddy', 'BaonBuddy budget dashboard'),
  },
  {
    id: 'mutagen-arena',
    name: 'Mutagen Arena',
    kicker: 'AI case study · Academic',
    summary:
      'Top-down survival arena where the enemies evolve against the player using a genetic algorithm and simulated annealing. Built as the case study for an intro to AI course.',
    stack: 'Python · Genetic algorithms',
    status: 'Academic',
    image: shot('mutagen-arena', 'Mutagen Arena gameplay'),
  },
]

export const thisSite: WorkItem = {
  id: 'this-site',
  name: 'chevykt.github.io',
  kicker: 'Solo · 2026',
  summary:
    'This portfolio: Vite, React and TypeScript in a Liquid Glass theme. Every section has a Playwright check, and a content gate stops placeholder copy and client names from shipping.',
  stack: 'Vite · React · TypeScript · GSAP · Playwright',
  status: 'Live',
  image: shot('this-site', 'This portfolio’s home screen in the light theme', 1600, 900),
  href: repos.thisSite,
}

/** Every build on the site and the ones made for clients. Derived, never typed in. */
export const workCount = clientTools.length + 1 + 1 + academic.length + 1
export const clientToolCount = clientTools.length
