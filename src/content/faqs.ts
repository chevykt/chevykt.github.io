import type { Faq } from './schema'

/** The questions people ask before they write. Pages pick the ones that answer their own objection. */
export const faqs = {
  whatYouBuild: {
    question: 'What do you actually build?',
    answer: 'Internal tools, AI pipelines on the Claude API, content and video automation, and full-stack web apps. Most of my clients are content studios and small agencies that need a tool their team opens every day.',
  },
  startSpeed: {
    question: 'How fast can you start?',
    answer: 'Usually within a week for a small build. I work from the Philippines (GMT+8), which overlaps US evenings and Australian business hours, and I reply within one business day.',
  },
  needStack: {
    question: 'Do I need a specific platform?',
    answer: 'No. I work mostly in TypeScript, React, Node and Python, with Postgres or Supabase behind them, and I can build inside your existing app when that fits better. If your stack is a poor fit for the job, I say so before we start.',
  },
  pricing: {
    question: 'How much do you charge?',
    answer: 'Per project, quoted after a short call or a written brief, so you know the full cost before any work starts. Bigger builds are split into stages, each with its own price and a working delivery at the end.',
  },
  afterWrite: {
    question: 'What happens after I write?',
    answer: 'I reply within one business day from my own email. You get either a short plan with my questions, or a straight no if I am the wrong fit.',
  },
} satisfies Record<string, Faq>

export const allFaqs: Faq[] = Object.values(faqs)
