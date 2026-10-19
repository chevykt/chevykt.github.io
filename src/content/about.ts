import type { Icon } from '@phosphor-icons/react'
import { Briefcase, GraduationCap } from '@phosphor-icons/react'
import type { Image, ToolMark } from './schema'
import { site } from './site'
import { tools } from './tools'

/**
 * The Home About section: the photo stands on a hairline floor with the lead over its space;
 * roles with tool logos as raised keys, credentials below.
 */
export const aboutSection = {
  eyebrow: 'About',
  titleThin: "Hi, I'm",
  titleBold: `${site.name}.`,
  lede: 'A full-stack developer who builds the tools content and research teams run every day.',
  lead: 'Chief Engineer at Claude Automation.',
  leadQuiet: 'Freelance client tools for a content studio and others. Computer Science at PUP, class of 2027.',
  note: 'I also edit video, which is why so many of my builds are for content teams: I know where their hours go.',
  /** Who the Person JSON-LD says you work for. */
  employer: 'Claude Automation',
  picture: {
    src: '/images/profile/keon.webp',
    alt: `${site.name} in a green pullover, looking down`,
    width: 767,
    height: 568,
  } satisfies Image,
}

export const capabilities: { title: string; tools: ToolMark[] }[] = [
  { title: 'Full-stack web apps', tools: [tools.react, tools.typescript, tools.vite, tools.postgres, tools.supabase] },
  { title: 'AI pipelines', tools: [tools.claudeApi, tools.python, tools.node] },
  { title: 'Daily workflow', tools: [tools.vscode, tools.claude, tools.git, tools.github] },
  { title: 'Video', tools: [tools.premiere, tools.afterEffects] },
]

export type AboutCredential = {
  id: 'place' | 'role' | 'school'
  title: string
  detail: string
  /** A glyph when there is no picture; the map pin otherwise. */
  icon?: Icon
  image?: Image
  /** A dark-theme version of the mark, when the light one would vanish on a dark ground (or the reverse). */
  imageDark?: Image
  href?: string
}

export const credentials: AboutCredential[] = [
  { id: 'role', title: 'Chief Engineer', detail: 'Claude Automation · 2026 to now', icon: Briefcase },
  { id: 'school', title: 'BS Computer Science', detail: 'Polytechnic University of the Philippines · 2023 to 2027', icon: GraduationCap },
  { id: 'place', title: `Based ${site.timePlace}`, detail: 'GMT+8 · Remote' },
]
