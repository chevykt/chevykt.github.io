import type { MethodStep } from './schema'

/** How a pipeline of mine runs: the three jobs, in order. It names the steps of the Home automation diagram. */
export const method = {
  eyebrow: 'How I work',
  title: 'Collect. Analyze. Deliver.',
  summary: 'Every pipeline I build does three jobs, in order.',
  steps: [
    { name: 'Collect', body: 'Recent uploads and transcripts, pulled from the YouTube Data API.', inputs: ['Channel URL', 'Video URL', 'Recent uploads', 'Transcript'] },
    { name: 'Analyze', body: 'Claude reads the niche, audience and pain points, then the hook style and structure.', inputs: ['Niche', 'Audience', 'Hook style'] },
    { name: 'Deliver', body: 'A script brief, narrated clips or an ebook, rendered and ready to use.', inputs: ['Script brief', 'Clips', 'Ebook'] },
  ] satisfies MethodStep[],
}
