// E2E check for the Home Manifesto, "Reading band".
// Desktop: the screen holds and the statement glides up through a band in the middle; the line in the
// band is full ink, the rest fade back, the tracker lights as each keyword's line reaches the band.
// Phones: no hold, each line brightens as it crosses the middle of the screen (CSS view timeline).
// Reduced motion: still and complete.
// Usage: BASE=http://localhost:5190 node scripts/check-manifesto.mjs   (screens -> scripts/out/manifesto/)
import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5190'
const OUT = new URL('./out/manifesto/', import.meta.url)
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const shot = (page, name) => page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) })

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) failures.push(message)
}
const r2 = (v) => Math.round(v * 100) / 100

const jump = (page, y) =>
  page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)), y)

/** Desktop hold: progress p (0 = section top at the screen top, 1 = section bottom at the screen bottom). */
const holdTo = (page, p) =>
  page.evaluate((p) => {
    const el = document.getElementById('manifesto')
    const top = el.getBoundingClientRect().top + scrollY
    return Math.round(top + p * (el.offsetHeight - innerHeight))
  }, p).then((y) => jump(page, y))

/** Native scroll: put line i's center at the middle of the screen. */
const lineToMiddle = (page, i) =>
  page.evaluate((i) => {
    const lines = [...document.querySelectorAll('#manifesto [data-line]')]
    const line = lines[i < 0 ? lines.length + i : i]
    const r = line.getBoundingClientRect()
    return Math.round(scrollY + r.top + r.height / 2 - innerHeight / 2)
  }, i).then((y) => jump(page, y))

// A faded line rests on the contrast floor (manifesto.css --ms-floor: 0.4 dark, 0.5 light = 3:1 for large text).
const FADED = 0.51

const read = (page) =>
  page.evaluate(() => {
    const root = document.getElementById('manifesto')
    const pin = root.querySelector('.ms__pin')
    const win = root.querySelector('[data-ms-window]').getBoundingClientRect()
    const text = root.querySelector('[data-ms-text]')
    const lines = [...root.querySelectorAll('[data-line]')]
    const mid = win.top + win.height / 2
    const centers = lines.map((l) => {
      const r = l.getBoundingClientRect()
      return r.top + r.height / 2
    })
    const op = lines.map((l) => Number(getComputedStyle(l).opacity))
    const bright = op.indexOf(Math.max(...op))
    const progress = root.querySelector('[data-ms-progress]')
    return {
      held: getComputedStyle(pin).position === 'sticky',
      screens: root.offsetHeight / innerHeight,
      count: lines.length,
      words: lines.map((l) => l.children.length),
      op,
      bright,
      // which line sits nearest the middle of the window (desktop) / the screen (phones)
      nearWin: centers.reduce((b, c, i) => (Math.abs(c - mid) < Math.abs(centers[b] - mid) ? i : b), 0),
      offWin: centers.map((c) => Math.round(c - mid)),
      nearScreen: centers.reduce((b, c, i) => (Math.abs(c - innerHeight / 2) < Math.abs(centers[b] - innerHeight / 2) ? i : b), 0),
      ty: new DOMMatrix(getComputedStyle(text).transform).m42,
      keys: [...root.querySelectorAll('[data-ms-key]')].map((k) => Number(getComputedStyle(k).opacity)),
      bar: new DOMMatrix(getComputedStyle(progress).transform).a,
      timeline: lines.map((l) => `${getComputedStyle(l).animationName} ${getComputedStyle(l).animationTimeline}`)[0],
      fits: lines.every((l) => l.scrollWidth <= l.clientWidth + 2) && lines.every((l) => l.getBoundingClientRect().right <= root.getBoundingClientRect().right + 1),
      srOnce: [...document.querySelectorAll('.sr-only')].filter((e) => e.textContent.includes('before you see it')).length,
      overflowX: document.documentElement.scrollWidth > innerWidth,
    }
  })

const browser = await chromium.launch()

for (const [label, viewport, extra] of [
  ['desk', { width: 1440, height: 900 }, {}],
  ['laptop', { width: 1280, height: 720 }, {}],
  ['phone', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['reduced', { width: 1440, height: 900 }, { reducedMotion: 'reduce' }],
]) {
  const context = await browser.newContext({ viewport, ...extra })
  await context.addInitScript(() => localStorage.setItem('pv2-theme', 'dark'))
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1500)

  const first = await read(page)
  check(first.count >= 3 && first.fits, `${label}: statement wraps into ${first.count} lines (${first.words}), each fits the column`)
  check(first.srOnce === 1, `${label}: the sentence is read once by screen readers`)

  if (label === 'desk' || label === 'laptop') {
    check(first.held && Math.abs(first.screens - 3.2) < 0.05, `${label}: the screen holds (sticky, section ${r2(first.screens)} screens)`)
    const at = {}
    for (const p of [0.02, 0.2, 0.35, 0.5, 0.65, 0.8, 0.98]) {
      await holdTo(page, p)
      await page.waitForTimeout(350)
      at[p] = await read(page)
    }
    const last = first.count - 1
    const s = at[0.02]
    const m = at[0.5]
    const e = at[0.98]
    check(s.nearWin === 0 && Math.abs(s.offWin[0]) < 4, `${label} start: the first line sits in the band (${s.offWin[0]}px off centre)`)
    check(s.op[0] > 0.99 && s.op.slice(1).every((o) => o <= FADED), `${label} start: only the first line is full ink, the rest faded back to the contrast floor (${s.op.map(r2)})`)
    check(s.keys.some((k) => k < 0.5) && s.bar < 0.1, `${label} start: the tracker is not complete yet (${s.keys.map(r2)}), progress ${r2(s.bar)}`)
    check(
      m.bright > 0 && m.bright < last && m.op[m.bright] > 0.6 && m.op[0] <= FADED && m.op[last] <= FADED,
      `${label} middle: line ${m.bright + 1} of ${first.count} reads in the band, the first faded back, the last not reached (${m.op.map(r2)})`,
    )
    check(e.nearWin === last && Math.abs(e.offWin[last]) < 4 && e.op[last] > 0.99, `${label} end: the last line sits in the band at full ink (${e.offWin[last]}px off centre)`)
    check(e.keys.every((k) => k > 0.99) && e.bar > 0.97, `${label} end: every keyword lit in the tracker (${e.keys.map(r2)}), progress ${r2(e.bar)}`)
    const seq = Object.values(at)
    check(
      seq.every((x, i) => i === 0 || (x.bright >= seq[i - 1].bright && x.ty <= seq[i - 1].ty + 0.5)),
      `${label}: the statement glides up and the band walks the lines in order (${seq.map((x) => x.bright).join(',')})`,
    )
    check(seq.every((x) => x.keys.every((k, i) => i === 0 || k <= x.keys[i - 1] + 0.01)), `${label}: the tracker lights in reading order`)
    check(seq.every((x) => !x.overflowX), `${label}: no sideways scroll`)
    if (label === 'desk') {
      for (const [name, p] of [['start', 0.02], ['middle', 0.5], ['end', 0.98]]) {
        await holdTo(page, p)
        await page.waitForTimeout(350)
        await shot(page, `${label}-${name}`)
      }
      // Collapsing the sidebar widens the column: the lines re-wrap and the band follows them.
      await page.keyboard.press('Control+b')
      await page.waitForTimeout(900)
      await holdTo(page, 0.98)
      await page.waitForTimeout(400)
      const wide = await read(page)
      check(
        wide.fits && wide.nearWin === wide.count - 1 && Math.abs(wide.offWin[wide.count - 1]) < 4,
        `desk, sidebar collapsed: re-wrapped into ${wide.count} lines (${wide.words}), all fit, the band still lands on the last`,
      )
      await shot(page, 'desk-collapsed-end')
    }
  } else if (label === 'phone') {
    check(!first.held && first.screens < 1.6, `${label}: no hold (${r2(first.screens)} screens, not sticky)`)
    check(/ms-band/.test(first.timeline) && /view/.test(first.timeline), `${label}: each line runs a view timeline (${first.timeline})`)
    const at = {}
    for (const [name, i] of [['start', 0], ['middle', Math.floor(first.count / 2)], ['end', -1]]) {
      await lineToMiddle(page, i)
      await page.waitForTimeout(500)
      at[name] = await read(page)
      await shot(page, `${label}-${name}`)
    }
    const last = first.count - 1
    check(at.start.op[0] > 0.95 && at.start.op[last] < at.start.op[0] - 0.1, `${label} start: the first line at the middle is full ink, the last still dim (${at.start.op.map(r2)})`)
    const k = Math.floor(first.count / 2)
    check(at.middle.op[k] > 0.95, `${label} middle: line ${k + 1} at the middle is full ink (${at.middle.op.map(r2)})`)
    check(at.end.op[last] > 0.95 && at.end.op[0] < at.end.op[last] - 0.1, `${label} end: the last line at the middle is full ink, the first has faded (${at.end.op.map(r2)})`)
    check(Object.values(at).every((x) => !x.overflowX), `${label}: no sideways scroll`)
  } else {
    await page.locator('#manifesto').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const s = await read(page)
    check(!s.held && s.screens < 1.6 && Math.abs(s.ty) < 0.5, `${label}: no hold, nothing moves (${r2(s.screens)} screens)`)
    check(s.op.every((o) => o > 0.99), `${label}: every line reads at full ink (${s.op.map(r2)})`)
    check(s.keys.every((k) => k > 0.99) && s.bar > 0.99, `${label}: the tracker reads complete`)
    await shot(page, label)
  }

  check(errors.length === 0, `${label}: no page errors ${errors.join(' | ')}`)
  await context.close()
}

await browser.close()
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASS')
process.exit(failures.length ? 1 : 0)
