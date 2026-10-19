// E2E check for Proof as receipts: head + JSON-LD (no Review, no VideoObject), one row per receipt, no
// template client accounts or clips, the quote block hidden while there are no quotes, no money amounts,
// images, overflow. Runs on /proof and on the Home section.
// Usage: BASE=http://localhost:5190 node scripts/check-proof.mjs   (screens -> scripts/out/proof/)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5190'
const read = (file) => readFileSync(new URL(`../src/content/${file}`, import.meta.url), 'utf8')
const NAME = read('site.ts').match(/name: '([^']*)'/)[1]
// One `build:` per receipt in the content file, so the row count follows the data.
const RECEIPTS = (read('proof.ts').match(/\bbuild: '/g) ?? []).length
const OUT = new URL('./out/proof/', import.meta.url)
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const shot = (page, name, full = false) => page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1), fullPage: full })

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) failures.push(message)
}

const browser = await chromium.launch()
check(RECEIPTS >= 6, `proof.ts lists the receipts (${RECEIPTS})`)

for (const [label, viewport, extra, theme] of [
  ['desk', { width: 1440, height: 900 }, {}, 'light'],
  ['desk-dark', { width: 1440, height: 900 }, {}, 'dark'],
  ['phone', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, 'light'],
]) {
  const context = await browser.newContext({ viewport, ...extra })
  await context.addInitScript((t) => localStorage.setItem('pv2-theme', t), theme)
  const page = await context.newPage()
  const errors = []
  const bad = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`))
  await page.goto(`${BASE}/proof`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await shot(page, `${label}-top`)

  if (label === 'desk') {
    const head = await page.evaluate(() => ({
      title: document.title,
      canonical: document.querySelector('link[rel=canonical]')?.href,
      h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
    }))
    check(head.title.startsWith('Proof') && head.title.endsWith(NAME), `title is the route's own, ends with the site name (${head.title})`)
    check(head.canonical?.endsWith('/proof'), `canonical is /proof (${head.canonical})`)
    check(head.h1.length === 1, `one h1 (${head.h1.join(' | ')})`)
    let nodes = []
    try {
      nodes = head.ld.flatMap((s) => JSON.parse(s)['@graph'] ?? [])
    } catch (e) {
      check(false, `JSON-LD parses (${e.message})`)
    }
    const text = JSON.stringify(nodes)
    check(!/"(Review|AggregateRating|VideoObject|Quotation)"/.test(text), 'JSON-LD has no Review, rating, video or quote while none exist')
    check(nodes.some((n) => n['@type'] === 'BreadcrumbList'), 'JSON-LD has a BreadcrumbList')
  }

  const s = await page.evaluate(() => {
    const main = document.querySelector('main')
    const rows = [...main.querySelectorAll('.pf-receipt')]
    return {
      rows: rows.length,
      money: rows.filter((r) => /[$₱]/.test(r.textContent)).map((r) => r.textContent.trim().slice(0, 60)),
      empty: rows.filter((r) => !r.querySelector('.pf-receipt__build')?.textContent.trim() || !r.querySelector('.pf-receipt__fact')?.textContent.trim()).length,
      template: main.querySelectorAll('.pf-clip, .pf-clips, .pf-account, video').length,
      quotes: main.querySelectorAll('.pf-quote, #pf-quotes').length,
      placeholder: /PLACEHOLDER/.test(main.textContent),
      overflowX: document.documentElement.scrollWidth > innerWidth,
      broken: [...main.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
    }
  })
  check(s.rows === RECEIPTS, `${label}: one row per receipt (${s.rows} of ${RECEIPTS})`)
  check(s.empty === 0, `${label}: every row pairs a build with a fact`)
  check(s.money.length === 0, `${label}: no money amounts in the receipts (${s.money.join(' | ') || 'none'})`)
  check(s.template === 0, `${label}: no template client accounts or clips (${s.template})`)
  check(s.quotes === 0, `${label}: the quote block is hidden while there are no quotes (${s.quotes})`)
  check(!s.placeholder, `${label}: no placeholder copy`)
  check(s.broken.length === 0 && !s.overflowX, `${label}: images load, no sideways scroll`)
  await shot(page, `${label}-full`, true)

  // The Home section carries the same receipts.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.locator('#proof').scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  const home = await page.evaluate(() => document.querySelectorAll('#proof .pf-receipt').length)
  check(home === RECEIPTS, `${label}: the Home Proof section shows the same ${RECEIPTS} receipts (${home})`)

  check(errors.length === 0, `${label}: no page errors${errors.length ? ` (${errors.join(' | ')})` : ''}`)
  check(bad.length === 0, `${label}: no 4xx/5xx responses${bad.length ? ` (${bad.join(', ')})` : ''}`)
  await context.close()
}

await browser.close()
console.log(failures.length ? `\n${failures.length} failed` : '\nall passed')
process.exit(failures.length ? 1 : 0)
