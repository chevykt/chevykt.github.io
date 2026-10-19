import { liveAutomation, type FlowLink, type FlowNode } from '@/content/automation'

/*
 * The diagram's geometry and its build schedule, derived from the content. Scroll progress p runs
 * 0 -> 1 over the pinned section. The graph builds from the trigger outwards across BUILD_FROM-BUILD_TO:
 * a stage builds once the link into it lands, a link draws once its stage is built (a reroute back,
 * like a reschedule, draws alongside the next forward link). At CONNECTED the system reads live and
 * packets run the whole path once more.
 */
export const VIEW = { w: 1200, h: 600 }
const BUILD_FROM = 0.015
const BUILD_TO = 0.8
export const CONNECTED = 0.85
export const REPLAY = [0.85, 0.96] as const

export type Timed = { a: number; b: number }
export type PlacedLink = FlowLink & Timed & { id: string; d: string; x1: number; x2: number; y: number; lx: number; ly: number }
export type PlacedNode = FlowNode & Timed & { index: number }

const nodes = liveAutomation.nodes as FlowNode[]
const links = liveAutomation.links as FlowLink[]
const byId = new Map(nodes.map((node) => [node.id, node]))
const node = (id: string) => byId.get(id)!
const order = (id: string) => nodes.indexOf(node(id))
const mid = (n: FlowNode) => n.y + n.h / 2
const cx = (n: FlowNode) => n.x + n.w / 2
const isBack = (l: FlowLink) => order(l.to) < order(l.from)
/** A stage sits on the row between the two ends: a straight line would run through it. */
const skips = (a: FlowNode, b: FlowNode) =>
  nodes.some((n) => n.y === a.y && n !== a && n !== b && n.x > Math.min(a.x, b.x) && n.x < Math.max(a.x, b.x))

// Build schedule in units (a stage or a link = 1 unit), then mapped onto BUILD_FROM-BUILD_TO.
const nodeStart = new Map<string, number>()
const startOf = (id: string): number => {
  if (!nodeStart.has(id)) {
    const into = links.filter((l) => l.to === id && !isBack(l))
    nodeStart.set(id, into.length ? Math.max(...into.map((l) => startOf(l.from) + 2)) : 0)
  }
  return nodeStart.get(id)!
}
const units = Math.max(...nodes.map((n) => startOf(n.id) + 1))
const unit = (BUILD_TO - BUILD_FROM) / units
const timed = (u: number): Timed => ({ a: BUILD_FROM + u * unit, b: BUILD_FROM + u * unit + unit * 0.8 })

export const placedNodes: PlacedNode[] = nodes.map((n, i) => ({ ...n, index: i, ...timed(startOf(n.id)) }))

export const placedLinks: PlacedLink[] = links.map((l) => {
  const from = node(l.from)
  const to = node(l.to)
  const base = { ...l, id: `${l.from}-${l.to}`, ...timed(startOf(l.from) + 1), x1: 0, x2: 0, y: 0, lx: 0, ly: 0 }
  if (from.y === to.y && !isBack(l) && !skips(from, to)) {
    // Along a row: straight across, stopping short of the arrowhead.
    const x1 = from.x + from.w
    const x2 = to.x - 6
    const y = mid(from)
    return { ...base, d: `M${x1} ${y} H${x2}`, x1, x2, y }
  }
  if (from.y === to.y) {
    // A reroute back along the row, or a link that skips a stage: down under the row, across, up into the stage.
    const y = from.y + from.h + 48
    return { ...base, d: `M${cx(from)} ${from.y + from.h} V${y} H${cx(to)} V${to.y + to.h}`, lx: (cx(from) + cx(to)) / 2, ly: y + 22 }
  }
  // Down to the next row: a bus under the top row, across, down into the stage.
  return { ...base, d: `M${cx(from)} ${from.y + from.h} V${to.y - 74} H${cx(to)} V${to.y}` }
})

/** Where each method step starts: the first stage of that step begins to build. */
export const stepStarts = liveAutomation.steps.map((_, k) =>
  k === 0 ? 0 : Math.min(...placedNodes.filter((n) => n.step === k).map((n) => n.a)),
)

/** The zone boxes: research (the top row after the input) and the outputs (the bottom row). */
const frame = (members: PlacedNode[], pad: { x: number; top: number; bottom: number }) => {
  const x = Math.min(...members.map((n) => n.x)) - pad.x
  const y = Math.min(...members.map((n) => n.y)) - pad.top
  const a = Math.min(...members.map((n) => n.a))
  return {
    x,
    y,
    w: Math.max(...members.map((n) => n.x + n.w)) + pad.x - x,
    h: Math.max(...members.map((n) => n.y + n.h)) + pad.bottom - y,
    a,
    b: a + unit * 0.4,
  }
}
const top = placedNodes.filter((n) => n.y === placedNodes[0]!.y)
export const zones = {
  booking: frame(top.slice(1), { x: 14, top: 24, bottom: 20 }),
  pipeline: frame(placedNodes.filter((n) => n.y !== placedNodes[0]!.y), { x: 14, top: 24, bottom: 20 }),
}

/** Nodes joined to `id` by any link (the inspector keeps them lit). */
export function related(id: string): Set<string> {
  const set = new Set([id])
  for (const l of links) {
    if (l.from === id) set.add(l.to)
    if (l.to === id) set.add(l.from)
  }
  return set
}

/** A window on the diagram centred on a node, for the phone zoom (same 2:1 shape as the view). */
export function zoomBox(n: FlowNode, width = 380) {
  const height = width / 2
  const x = Math.min(VIEW.w - width, Math.max(0, n.x + n.w / 2 - width / 2))
  const y = Math.min(VIEW.h - height, Math.max(0, n.y + n.h / 2 - height / 2))
  return `${x} ${y} ${width} ${height}`
}
