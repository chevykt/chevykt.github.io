import type { Service } from './schema'
import { tools } from './tools'

export const servicesPage = {
  eyebrow: 'Services',
  title: 'Four things clients hire me for.',
  lede: 'Each one opens the builds that prove it.',
}

/**
 * The Home Services section: a stack of cards dealt onto a pile as the page scrolls. The display line
 * is the thin + bold pair below.
 */
export const servicesSection = {
  eyebrow: servicesPage.eyebrow,
  titleThin: 'Four things',
  titleBold: 'clients hire me for.',
  explore: 'See the builds',
  /** The Work chapter each card opens, by service id (a chapter id from home.ts). */
  work: {
    'internal-tools': 'client-tools',
    'ai-pipelines': 'client-tools',
    'content-automation': 'my-tools',
    'web-apps': 'products',
  } as Record<string, string>,
}

export const services: Service[] = [
  {
    id: 'internal-tools',
    title: 'Internal tools',
    summary: 'Software your team opens every morning instead of a spreadsheet.',
    outcome: 'Less busywork',
    bullets: ['Built around how your team already works', 'Tested before it reaches you', 'Handed over with a guide'],
    tools: [tools.react, tools.typescript, tools.supabase],
  },
  {
    id: 'ai-pipelines',
    title: 'AI automation pipelines',
    summary: 'Claude API pipelines that read, sort and write the work you now do by hand.',
    outcome: 'Research on autopilot',
    bullets: ['Prompts tuned on your real inputs', 'Every output checked before it ships', 'Cost per run kept visible'],
    tools: [tools.claudeApi, tools.python, tools.node],
  },
  {
    id: 'content-automation',
    title: 'Content and video automation',
    summary: 'From a channel or a script to finished files, without the manual steps in between.',
    outcome: 'Faster output',
    bullets: ['YouTube research turned into briefs', 'Clips cut and narrated to a script', 'Built by a developer who also edits'],
    tools: [tools.python, tools.claudeApi, tools.premiere],
  },
  {
    id: 'web-apps',
    title: 'Web apps',
    summary: 'Full-stack apps with accounts, payments and a real database behind them.',
    outcome: 'Ready to launch',
    bullets: ['Auth, billing and data from day one', 'Fast on phones and desktops', 'Deployed and documented'],
    tools: [tools.react, tools.postgres, tools.vite],
  },
]
