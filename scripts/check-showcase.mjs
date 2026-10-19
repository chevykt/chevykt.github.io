// E2E check for the Showcase page (GovRate, in development): head + JSON-LD, honest copy (no traction
// claims), one room per built part, no film, the rooms walked by the scroll (desktop) or stacked (phone,
// reduced), images, overflow.
// Usage: BASE=http://localhost:5190 node scripts/check-showcase.mjs   (screens -> scripts/out/showcase/)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5190'
const NAME = readFileSync(new URL('../src/content/site.ts', import.meta.url), 'utf8').match(/name: '([^']*)'/)[1]
const ROOMS = ['Rate submission', 'Benchmarks', 'Audit-risk score', 'Contract simulator', 'Chrome extension']
const OUT = new URL('./out/showcase/', import.meta.url)
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const shot = (page, name, full = false) => page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1), fullPage: full })

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) failures.push(message)
}

const scrollTo = (page, y) =>
  page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)), y)

/** Scroll to walk progress p (0 = rooms top at the screen top, 1 = rooms bottom at the screen bottom). */
const walkTo = (page, p) =>
  page.evaluate((p) => {
    const el = document.querySelector('.kt-rooms')
    const top = el.getBoundingClientRect().top + scrollY
    const y = top + p * (el.offsetHeight - innerHeight)
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)
  }, p)

const rooms = (page) =>
  page.evaluate(() => {
    const section = document.querySelector('.kt-rooms')
    const panes = [...section.querySelectorAll('[data-kt-pane]')]
    const shown = panes.map((p) => getComputedStyle(p).visibility === 'visible' && parseFloat(getComputedStyle(p).opacity) > 0.5)
    const lit = [...section.querySelectorAll('[data-kt-room]')].findIndex((b) => b.getAttribute('aria-current') === 'true')
    const on = panes.findIndex((p) => p.hasAttribute('data-on'))
    const box = panes[on]?.getBoundingClientRect()
    return {
      height: section.offsetHeight,
      listShown: getComputedStyle(section.querySelector('.kt-rooms__list')).display !== 'none',
      shown,
      lit,
      on,
      paneInside: box ? box.top >= -1 && box.bottom <= innerHeight + 1 : false,
    }
  })

const browser = await chromium.launch()

for (const [label, viewport, extra, theme] of [
  ['desk', { width: 1440, height: 900 }, {}, 'light'],
  ['laptop', { width: 1280, height: 720 }, {}, 'light'],
  ['desk-dark', { width: 1440, height: 900 }, {}, 'dark'],
  ['phone', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, 'light'],
  ['reduced', { width: 1440, height: 900 }, { reducedMotion: 'reduce' }, 'light'],
]) {
  const walk = label === 'desk' || label === 'laptop' || label === 'desk-dark'
  const context = await browser.newContext({ viewport, ...extra })
  await context.addInitScript((t) => localStorage.setItem('pv2-theme', t), theme)
  const page = await context.newPage()
  const errors = []
  const bad = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`))
  await page.goto(`${BASE}/showcase`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1800)
  await shot(page, `${label}-top`)

  if (label === 'desk') {
    const head = await page.evaluate(() => ({
      title: document.title,
      canonical: document.querySelector('link[rel=canonical]')?.href,
      h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
      faq: document.querySelectorAll('.kt-faq dt').length,
      captions: [...document.querySelectorAll('.kt-room figcaption h3')].map((h) => h.textContent.trim()),
    }))
    check(head.title.startsWith('Showcase') && head.title.endsWith(NAME), `title is the route's own, ends with the site name (${head.title})`)
    check(head.canonical?.endsWith('/showcase'), `canonical is /showcase (${head.canonical})`)
    check(head.h1.length === 1, `one h1 (${head.h1.join(' | ')})`)
    let types = []
    try {
      types = head.ld.flatMap((s) => JSON.parse(s)['@graph'].map((n) => n['@type']))
    } catch (e) {
      check(false, `JSON-LD parses (${e.message})`)
    }
    for (const t of ['SoftwareApplication', 'FAQPage', 'BreadcrumbList']) check(types.includes(t), `JSON-LD has ${t}`)
    check(!types.includes('VideoObject'), 'JSON-LD has no VideoObject (there is no film)')
    check(head.faq === 3 && head.captions.join(' | ') === ROOMS.join(' | '), `visible FAQ (${head.faq}) and a room per built part (${head.captions.join(' | ')})`)
  }

  // Honest copy: the product, its status, no traction claims; no film, and no empty or placeholder video.
  const copy = await page.evaluate(() => {
    const main = document.querySelector('main')
    return {
      text: main.textContent,
      videos: [...main.querySelectorAll('video')].map((v) => v.getAttribute('src') ?? v.querySelector('source')?.getAttribute('src') ?? ''),
      film: !!main.querySelector('.kt-film'),
    }
  })
  check(copy.text.includes('GovRate') && /in development/i.test(copy.text), `${label}: names GovRate and says it is in development`)
  const claims = ['500+', 'customers', 'users', 'contractors use'].filter((w) => copy.text.toLowerCase().includes(w.toLowerCase()))
  check(claims.length === 0, `${label}: no traction claims (${claims.join(', ') || 'none'})`)
  check(!/PLACEHOLDER|Product Name|yourproduct/i.test(copy.text), `${label}: no template copy`)
  check(copy.videos.length === 0 && !copy.film, `${label}: no film and no video element (${copy.videos.join(', ') || 'none'})`)

  let r = await rooms(page)
  if (walk) {
    check(r.listShown, `${label}: the room list shows beside the screen`)
    check(Math.abs(r.height - (viewport.height + 4 * 0.55 * viewport.height)) < 4, `${label}: rooms section = one screen + 4 x 55svh (${r.height})`)
    const seq = []
    for (let i = 0; i < 5; i++) {
      await walkTo(page, (i + 0.5) / 5)
      await page.waitForTimeout(700)
      r = await rooms(page)
      seq.push(r)
      if (label !== 'desk-dark' || i === 2) await shot(page, `${label}-room-${i + 1}`)
    }
    check(seq.every((s, i) => s.on === i && s.lit === i), `${label}: the scroll walks the rooms in order (${seq.map((s) => `${s.on}/${s.lit}`).join(' ')})`)
    check(seq.every((s) => s.shown.filter(Boolean).length === 1), `${label}: one screen shows at a time`)
    check(seq.every((s) => s.paneInside), `${label}: the lit window + caption fit inside the held screen`)
    await walkTo(page, 0.1)
    await page.waitForTimeout(500)
    await page.click('[data-kt-room="3"]')
    await page.waitForTimeout(1800)
    r = await rooms(page)
    check(r.on === 3 && r.lit === 3, `${label}: clicking a room scrolls to it (${r.on})`)
  } else {
    check(!r.listShown && r.shown.every(Boolean), `${label}: every room stacks as screen + caption`)
  }

  // Walk the whole page so lazy images load, then check every image and the width.
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h; y += Math.round(viewport.height * 0.8)) {
    await scrollTo(page, y)
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(800)
  const imgs = await page.evaluate(() => [...document.querySelectorAll('main img')].filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.src))
  check(imgs.length === 0, `${label}: every image loads${imgs.length ? ` (broken: ${imgs.join(', ')})` : ''}`)
  check(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `${label}: no sideways page scroll`)
  if (label === 'phone' || label === 'reduced') await shot(page, `${label}-full`, true)
  check(errors.length === 0, `${label}: no page errors${errors.length ? ` (${errors.join(' | ')})` : ''}`)
  check(bad.length === 0, `${label}: no 4xx/5xx responses${bad.length ? ` (${bad.join(', ')})` : ''}`)
  await context.close()
}

await browser.close()
console.log(failures.length ? `\n${failures.length} failed` : '\nall passed')
process.exit(failures.length ? 1 : 0)
