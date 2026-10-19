import type { Icon } from '@phosphor-icons/react'
import { Briefcase, Cube, Envelope, House, SealCheck, ShieldCheck, Stack, User } from '@phosphor-icons/react'
import { workCount } from '@/content/work'
import { site } from '@/content/site'

/**
 * The route registry: the one list that drives the router, the sidebar, the search palette
 * and every page title. Add a page = add one entry here.
 */

export type NavGroupId = 'menu' | 'discover' | 'general'

export const NAV_GROUPS: { id: NavGroupId; label: string }[] = [
  { id: 'menu', label: 'Menu' },
  { id: 'discover', label: 'Discover' },
  { id: 'general', label: 'General' },
]

export type PageRoute = {
  kind: 'page'
  id: string
  path: string
  /** Short name for the sidebar and search. */
  label: string
  /** Unique document title. */
  title: string
  description: string
  icon: Icon
  /** Omit to keep the page out of the sidebar (legal pages). */
  group?: NavGroupId
  badge?: number
  /** A Home section id: the sidebar and search scroll Home to it instead of opening `path`. */
  section?: string
  /** Still the RouteStage placeholder: kept out of the sitemap (RouteStage also marks it noindex).
   *  Remove when the page is built and registered in router.tsx PAGE_COMPONENTS. */
  draft?: true
}

export type ExternalRoute = {
  kind: 'external'
  id: string
  href: string
  label: string
  description: string
  icon: Icon
  group: NavGroupId
}

export type NavEntry = PageRoute | ExternalRoute

/** Every page title ends with your name (content/site.ts). */
const SUFFIX = site.name

export const pages: PageRoute[] = [
  {
    kind: 'page',
    id: 'home',
    path: '/',
    label: 'Home',
    title: `${SUFFIX} | ${site.role}`,
    description: 'Keon Tabuena, full-stack developer in the Philippines. I build tools clients actually use: YouTube automation, lead research, rate benchmarking.',
    icon: House,
    group: 'menu',
  },
  {
    kind: 'page',
    id: 'work',
    draft: true,
    path: '/work',
    label: 'Work',
    title: `Work | ${SUFFIX}`,
    description: `${workCount} builds: client tools for YouTube automation and lead research, a GovCon product and my own tools.`,
    icon: Briefcase,
    group: 'menu',
    badge: workCount,
    section: 'work',
  },
  {
    kind: 'page',
    id: 'services',
    draft: true,
    path: '/services',
    label: 'Services',
    title: `Services | ${SUFFIX}`,
    description: 'Internal tools, Claude API pipelines, content and video automation, and web apps, each with the builds that prove it.',
    icon: Stack,
    group: 'menu',
    section: 'services',
  },
  {
    kind: 'page',
    id: 'about',
    draft: true,
    path: '/about',
    label: 'About',
    title: `About ${SUFFIX}`,
    description: 'Chief Engineer at Claude Automation and freelance developer in the Philippines, with a background in computer science.',
    icon: User,
    group: 'menu',
    section: 'about',
  },
  {
    kind: 'page',
    id: 'proof',
    path: '/proof',
    label: 'Proof',
    title: `Proof | ${SUFFIX}`,
    description: 'The test runs behind each build, confirmed offline, and where each one stands. Receipts, not testimonials.',
    icon: SealCheck,
    group: 'discover',
    section: 'proof',
  },
  {
    kind: 'page',
    id: 'showcase',
    path: '/showcase',
    label: 'Showcase',
    title: `Showcase | ${SUFFIX}`,
    description: 'GovRate, in development: anonymous indirect-rate benchmarks for government contractors, shown on a local build with sample data.',
    icon: Cube,
    group: 'discover',
    section: 'showcase',
  },
  {
    kind: 'page',
    id: 'contact',
    path: '/contact',
    label: 'Contact',
    title: `Contact | ${SUFFIX}`,
    description: 'Tell me what you need built. Quick answers first, then a short form; I reply within one business day.',
    icon: Envelope,
    group: 'general',
    section: 'contact',
  },
  {
    kind: 'page',
    id: 'privacy',
    path: '/privacy',
    label: 'Privacy Policy',
    title: `Privacy Policy | ${SUFFIX}`,
    description: 'What this site stores, what it does not, and how to ask for your data.',
    icon: ShieldCheck,
  },
]

/** Off-site sidebar links. None today; an entry here shows in its group after the pages. */
export const externals: ExternalRoute[] = []

/** Sidebar entries per group, in registry order (pages first, then external links). */
export function navEntries(group: NavGroupId): NavEntry[] {
  return [...pages.filter((p) => p.group === group), ...externals.filter((e) => e.group === group)]
}

/** Where a nav entry goes: its Home section when it has one, else its page. */
export function navTarget(page: PageRoute): string {
  return page.section ? `/#${page.section}` : page.path
}

export const notFoundTitle = `Page Not Found | ${SUFFIX}`
