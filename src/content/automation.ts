import { method } from './method'

/**
 * The live automation diagram on Home: Keon's YouTube pipeline, drawn stage by stage as the page
 * scrolls (a URL -> uploads + transcript -> two Claude reads -> one of three outputs -> files).
 *
 * Coordinates are in the diagram's own 1200 x 600 units: research is the top row, the outputs the
 * bottom row. `plane` is who moves it: `lead` = the editor, `auto` = the pipeline. `step` is the
 * method step (0, 1 or 2: the three steps in method.ts). Nodes are listed in build order.
 */
export type FlowPlane = 'lead' | 'auto'
export type FlowIcon = 'url' | 'uploads' | 'transcript' | 'audience' | 'hooks' | 'brief' | 'clips' | 'ebook' | 'files'

export type FlowNode = {
  id: string
  title: string
  tag: string
  plane: FlowPlane
  icon: FlowIcon
  x: number
  y: number
  w: number
  h: number
  step: number
  /** One line for the inspector. */
  about: string
}

/** `solid` links carry the work (arrows a packet runs); `dashed` links are a choice: the analysis branches to one output. */
export type FlowLink = { from: string; to: string; style: 'solid' | 'dashed'; label?: string }

const ROWS = [64, 340]
const box = (col: number, row: number) => ({ x: 24 + col * 236, y: ROWS[row]!, w: 200, h: 136 })

export const liveAutomation = {
  eyebrow: 'How a pipeline runs',
  titleThin: 'Collect. Analyze.',
  titleBold: 'Deliver.',
  steps: method.steps.map((step) => ({ name: step.name, body: step.body })),
  panel: { lead: 'URL to', rest: 'Finished files' },
  legend: { auto: 'Automated', lead: 'Editor' },
  zones: { booking: 'Research', pipeline: 'Outputs' },
  connected: 'Pipeline live',
  hint: { hover: 'Hover a stage to inspect', tap: 'Tap a stage to inspect' },
  nodes: [
    { id: 'url', title: 'Channel or video URL', tag: 'The only input', plane: 'lead', icon: 'url', ...box(0, 0), step: 0, about: 'An editor pastes a YouTube channel and one of its videos. Nothing else to fill in.' },
    { id: 'api', title: 'YouTube Data API', tag: 'Last 30 uploads', plane: 'auto', icon: 'uploads', ...box(1, 0), step: 0, about: 'Pulls the channel’s last 30 uploads: titles, views and dates.' },
    { id: 'transcript', title: 'Transcript', tag: 'The chosen video', plane: 'auto', icon: 'transcript', ...box(2, 0), step: 0, about: 'Fetches the chosen video’s transcript, so every claim can point at a real line.' },
    { id: 'niche', title: 'Niche & audience', tag: 'Claude reads', plane: 'auto', icon: 'audience', ...box(3, 0), step: 1, about: 'First Claude pass: the niche, who watches and the pain points they keep coming back for.' },
    { id: 'hooks', title: 'Hooks & structure', tag: 'Claude reads', plane: 'auto', icon: 'hooks', ...box(4, 0), step: 1, about: 'Second pass: how the videos open, how they are built and the voice they use.' },
    { id: 'brief', title: 'Script brief', tag: 'For the editors', plane: 'auto', icon: 'brief', ...box(1, 1), step: 2, about: 'The context prompt editors write scripts from, every claim traced to a real title or transcript line.' },
    { id: 'clips', title: 'Clips + narration', tag: 'Editor picks clips', plane: 'lead', icon: 'clips', ...box(2, 1), step: 2, about: 'Candidates land in a review grid; the narration is written around the clips the editor picks.' },
    { id: 'ebook', title: 'Ebook + landing copy', tag: 'PDF + cover', plane: 'auto', icon: 'ebook', ...box(3, 1), step: 2, about: 'Chapters drafted from the back catalogue, checked for repeats, laid out with a cover and landing copy.' },
    { id: 'files', title: 'Render / files', tag: 'Ready to hand over', plane: 'auto', icon: 'files', ...box(4, 1), step: 2, about: 'Markers the render engine reads, or the finished PDF and copy, ready to hand over.' },
  ] satisfies FlowNode[],
  links: [
    { from: 'url', to: 'api', style: 'solid' },
    { from: 'api', to: 'transcript', style: 'solid' },
    { from: 'transcript', to: 'niche', style: 'solid' },
    { from: 'niche', to: 'hooks', style: 'solid' },
    { from: 'hooks', to: 'brief', style: 'dashed' },
    { from: 'hooks', to: 'clips', style: 'dashed' },
    { from: 'hooks', to: 'ebook', style: 'dashed' },
    { from: 'brief', to: 'files', style: 'solid' },
    { from: 'clips', to: 'files', style: 'solid' },
    { from: 'ebook', to: 'files', style: 'solid' },
  ] satisfies FlowLink[],
}
