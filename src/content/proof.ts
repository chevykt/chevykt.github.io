import type { Quote, Receipt } from './schema'

export const proofPage = {
  eyebrow: 'Proof',
  titleThin: 'Receipts,',
  titleBold: 'not testimonials.',
  bands: { receipts: 'Test runs and status', quotes: 'In their words' },
  lede: 'No client quotes yet, so here is what you can check: the test suites behind each build, all run offline on October 19, 2026, and where each one stands.',
}

/**
 * Every fact here was confirmed by a run recorded in docs/superpowers/plans/receipts-evidence.md.
 * A build whose number could not be confirmed offline gets a status, never an estimate.
 */
export const receipts: Receipt[] = [
  { build: 'Channel → ebook generator', fact: '437 tests passing', detail: 'Delivered · pytest' },
  { build: 'Lead intelligence engine', fact: '404 offline proofs passing', detail: 'Delivered · 5 suites, no API keys' },
  { build: 'Script-matched auto-editor', fact: '333 tests passing', detail: 'In use on my own recordings · pytest' },
  { build: 'Channel research and TikTok clips tools', fact: '189 tests passing', detail: 'Delivered · 184 in the browser, 5 on the render host' },
  { build: 'DM video renderer', fact: '102 tests passing', detail: 'Delivered · Windows and macOS · pytest' },
  { build: 'Topic → video generator', fact: '33 tests passing', detail: 'Delivered · pytest' },
  { build: 'Domain Selector', fact: 'Delivered', detail: 'Public repo on GitHub' },
  { build: 'GovRate', fact: 'In development', detail: 'Built and working end to end, not launched' },
]

/** Named, dated client quotes, word for word. The quote block renders only once this list has one. */
export const quotes: Quote[] = []
