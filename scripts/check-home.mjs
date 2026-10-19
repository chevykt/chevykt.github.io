// E2E check for the Home hero at desktop (sidebar open + collapsed), laptop and phone widths.
// Usage: BASE=http://localhost:5190 node scripts/check-home.mjs   (screens -> scripts/out/)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE ?? 'http://localhost:5190'
// The site name, read from the identity file, so the page-title checks follow whatever you put there.
const NAME = readFileSync(new URL('../src/content/site.ts', import.meta.url), 'utf8').match(/name: '([^']*)'/)[1]
const OUT = new URL('./out/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) failures.push(message)
}

/** Hero geometry: every line inside the hero box, and the block centered in the visible column. */
const measure = (page) =>
  page.evaluate(() => {
    const hero = document.querySelector('.hero').getBoundingClientRect()
    const lines = [...document.querySelectorAll('.hero__line')].map((el) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      const r = range.getBoundingClientRect()
      return { left: Math.round(r.left), right: Math.round(r.right), weight: getComputedStyle(el).fontWeight, size: parseFloat(getComputedStyle(el).fontSize) }
    })
    const sub = document.querySelector('.hero__sub').getBoundingClientRect()
    return {
      hero: { left: Math.round(hero.left), right: Math.round(hero.right) },
      lines,
      subCenter: Math.round(sub.left + sub.width / 2),
      heroCenter: Math.round(hero.left + hero.width / 2),
      titleTop: Math.round(document.querySelector('.hero__title').getBoundingClientRect().top),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }
  })

const browser = await chromium.launch()
const cases = [
  { name: 'home-1440', width: 1440, height: 900 },
  { name: 'home-1440-collapsed', width: 1440, height: 900, collapse: true },
  { name: 'home-1024', width: 1024, height: 768 },
  { name: 'home-390', width: 390, height: 844, mobile: true },
]

for (const c of cases) {
  const context = await browser.newContext({ viewport: { width: c.width, height: c.height }, isMobile: !!c.mobile, hasTouch: !!c.mobile })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${BASE}/`)
  if (c.collapse) await page.click('.sb-toggle')
  await page.waitForTimeout(1000)
  const m = await measure(page)

  check((await page.title()).startsWith(`${NAME} |`), `${c.name}: page title`)
  check(m.lines[0].weight === '700' && m.lines[1].weight === '700', `${c.name}: large title, one bold weight on both lines`)
  check(m.lines.every((l) => l.left >= m.hero.left && l.right <= m.hero.right), `${c.name}: both headline lines fit (${JSON.stringify(m.lines)})`)
  check(Math.abs(m.subCenter - m.heroCenter) <= 2, `${c.name}: centered (${m.subCenter} vs ${m.heroCenter})`)
  check(!m.overflow, `${c.name}: no horizontal overflow`)
  check(errors.length === 0, `${c.name}: no page errors ${errors.join(' | ')}`)
  console.log(`      font ${m.lines[1].size}px, title top ${m.titleTop}px`)
  await page.screenshot({ path: fileURLToPath(new URL(`${c.name}.png`, OUT)) })
  await context.close()
}

await browser.close()
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASS')
process.exit(failures.length ? 1 : 0)
