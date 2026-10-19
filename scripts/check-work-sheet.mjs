// E2E check for the Home Work bento + chapter sheet, driven like a visitor.
// Usage: BASE=http://localhost:5190 node scripts/check-work-sheet.mjs   (screens -> scripts/out/sheet/)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5190'
// The site name, read from the identity file, so the page-title checks follow whatever you put there.
const NAME = readFileSync(new URL('../src/content/site.ts', import.meta.url), 'utf8').match(/name: '([^']*)'/)[1]
const OUT = new URL('./out/sheet/', import.meta.url)
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const shot = (page, name) => page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) })

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) failures.push(message)
}

/** Head + sheet state in one read. */
const read = (page) =>
  page.evaluate(() => {
    // The sheet's CollectionPage (Home also carries the About section's Person block).
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].find((s) => s.textContent.includes('"CollectionPage"'))
    let items = null
    try {
      items = ld ? JSON.parse(ld.textContent).mainEntity.numberOfItems : null
    } catch {
      items = 'bad json'
    }
    return {
      path: location.pathname,
      title: document.title,
      canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((l) => l.href),
      descriptions: document.querySelectorAll('meta[name="description"]').length,
      open: !!document.querySelector('dialog.sh')?.open,
      ldItems: items,
      locked: document.documentElement.dataset.scrollLocked === 'true',
      scrollY: Math.round(scrollY),
      workTop: Math.round(document.getElementById('work').getBoundingClientRect().top + scrollY),
      workActive: document.querySelector('[data-nav-id="work"]')?.dataset.active === 'true',
    }
  })

/** The bento: tile edges, sizes, loaded pictures, width. */
const bento = (page) =>
  page.evaluate(() => {
    const tiles = [...document.querySelectorAll('#work .wb__tile')]
    const area = (t) => {
      const r = t.getBoundingClientRect()
      return r.width * r.height
    }
    return {
      count: tiles.length,
      edges: [...new Set(tiles.map((t) => `${getComputedStyle(t).borderTopWidth} ${getComputedStyle(t, '::after').boxShadow}`))],
      biggest: tiles.reduce((a, b) => (area(b) > area(a) ? b : a)).getAttribute('href'),
      broken: [...document.querySelectorAll('#work img')].filter((i) => i.complete && i.naturalWidth === 0).length,
      hrefs: tiles.map((t) => t.getAttribute('href')),
      titles: tiles.map((t) => t.querySelector('.wb__cap b').textContent),
      overflowX: document.documentElement.scrollWidth > innerWidth,
    }
  })

const browser = await chromium.launch()

/* ---------- Desktop ---------- */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addInitScript(() => localStorage.setItem('pv2-theme', 'dark'))
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)

  await page.click('[data-nav-id="work"]')
  await page.waitForTimeout(1800)
  let s = await read(page)
  check(s.path === '/' && Math.abs(s.scrollY - s.workTop) < 40, `sidebar Work glides Home to the section (scrollY ${s.scrollY}, work ${s.workTop})`)
  check(s.workActive, 'sidebar Work is lit while the section is on screen')
  check(s.canonicals.length === 1 && new URL(s.canonicals[0]).pathname === '/', `home canonical (${s.canonicals})`)
  await page.waitForTimeout(800)
  await shot(page, 'desk-bento')

  const b = await bento(page)
  check(b.count === 5 && new Set(b.hrefs).size === 5 && b.hrefs.every((h) => h.startsWith('/work/')), `5 tiles, each a link to its chapter (${b.hrefs.join(' ')})`)
  check(b.titles.join(' | ') === 'Client tools | Products | Tools I use myself | Academic | This site', `Keon's five chapters (${b.titles.join(' | ')})`)
  check(b.edges.length === 1 && b.edges[0] === '0px rgba(255, 255, 255, 0.14) 0px 0px 0px 1px inset', `dark: every tile has the soft hairline edge (${b.edges})`)
  check(b.biggest === '/work/client-tools', `Client tools (7 builds) is the biggest tile (${b.biggest})`)
  const badge = await page.$eval('[data-nav-id="work"]', (el) => el.textContent.match(/\d+/)?.[0])
  check(badge === '12', `sidebar Work badge reads 12 (${badge})`)
  check(b.broken === 0 && !b.overflowX, `pictures load, no sideways scroll (broken ${b.broken})`)
  s = await read(page)
  const homeY = s.scrollY

  await page.click('#work a[href="/work/client-tools"]')
  await page.waitForTimeout(160)
  await shot(page, 'desk-open-mid')
  await page.waitForTimeout(900)
  s = await read(page)
  check(s.path === '/work/client-tools' && s.open, 'the Client tools tile opens /work/client-tools as an open sheet')
  check(s.title.startsWith('Client tools'), `chapter title (${s.title})`)
  check(s.canonicals.length === 1 && s.canonicals[0].endsWith('/work/client-tools'), `chapter canonical (${s.canonicals})`)
  check(s.descriptions === 1, `one meta description (${s.descriptions})`)
  check(s.ldItems === 7, `JSON-LD lists 7 builds (${s.ldItems})`)
  check(s.locked && Math.abs(s.scrollY - homeY) < 4, 'page behind is locked and did not move')
  await shot(page, 'desk-open')
  await page.locator('.sh__body').evaluate((el) => (el.scrollTop = 900))
  await page.waitForTimeout(400)
  await shot(page, 'desk-scrolled')

  await page.locator('.sh__next a').click()
  await page.waitForTimeout(900)
  s = await read(page)
  check(s.path === '/work/products' && s.open, 'Next swaps to products in place')
  await shot(page, 'desk-next')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  s = await read(page)
  check(s.path === '/' && !s.open && !s.locked, `Escape closes back to Home (path ${s.path}, open ${s.open}, locked ${s.locked})`)
  check(Math.abs(s.scrollY - homeY) < 40, `closing lands back on the bento (scrollY ${s.scrollY} vs ${homeY})`)
  check(s.title.startsWith(`${NAME} |`) && s.canonicals.length === 1, `Home head restored (${s.title})`)

  await page.click('#work a[href="/work/products"]')
  await page.waitForTimeout(1000)
  await shot(page, 'desk-products')
  await page.goBack()
  await page.waitForTimeout(1000)
  s = await read(page)
  check(s.path === '/' && !s.open, 'browser Back closes the sheet')

  // Direct visit: the sheet opens with Home behind it; closing leaves Home.
  await page.goto(`${BASE}/work/academic`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1600)
  s = await read(page)
  check(s.open && s.title.startsWith('Academic'), 'direct /work/academic opens its sheet')
  await shot(page, 'desk-direct-academic')
  await page.click('.sh__close')
  await page.waitForTimeout(1200)
  s = await read(page)
  check(s.path === '/' && !s.open, 'closing a direct visit leaves Home')

  await page.goto(`${BASE}/work/this-site`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1600)
  await shot(page, 'desk-this-site')
  await page.goto(`${BASE}/work/nope`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  check((await read(page)).path === '/', 'unknown chapter redirects Home')


  // Every sheet: how many builds it shows, which GitHub links it carries, and that every picture loads.
  const SHEETS = { 'client-tools': 7, products: 1, 'my-tools': 1, academic: 2, 'this-site': 1 }
  const REPOS = ['https://github.com/chevykt/domain-selector', 'https://github.com/chevykt/chevykt.github.io']
  for (const [id, n] of Object.entries(SHEETS)) {
    await page.goto(`${BASE}/work/${id}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1400)
    const sh = await page.evaluate(async () => {
      const body = document.querySelector('.sh__body')
      for (const img of body.querySelectorAll('img')) img.loading = 'eager'
      await Promise.all([...body.querySelectorAll('img')].map((img) => img.decode().catch(() => {})))
      return {
        items: body.querySelectorAll('.sh__item, .sh__row').length,
        single: !!body.querySelector('.sh__single'),
        github: [...new Set([...body.querySelectorAll('a[href*="github.com"]')].map((a) => a.href.replace(/\/$/, '')))],
        broken: [...body.querySelectorAll('img')].filter((img) => img.naturalWidth === 0).map((img) => img.getAttribute('src')),
        placeholder: /PLACEHOLDER/.test(body.textContent),
        // A build without a public link says why: its code is a private repo.
        unlabelled: [...body.querySelectorAll('.sh__item, .sh__single')].filter((el) => !el.querySelector('a[href*="github.com"]') && !/Private repo/.test(el.textContent)).length,
      }
    })
    if (n === 1) check(sh.single, `${id}: a single-build sheet`)
    else check(sh.items === n, `${id}: lists ${n} builds (${sh.items})`)
    const allowed = id === 'this-site' ? [REPOS[1]] : id === 'client-tools' ? [REPOS[0]] : []
    check(sh.github.join(' ') === allowed.join(' '), `${id}: GitHub links are only ${allowed.join(', ') || 'none'} (${sh.github.join(', ') || 'none'})`)
    check(sh.broken.length === 0, `${id}: every picture loads (${sh.broken.join(', ') || 'all'})`)
    check(!sh.placeholder, `${id}: no placeholder copy`)
    check(sh.unlabelled === 0, `${id}: every build without a public repo says "Private repo" (${sh.unlabelled} unlabelled)`)
  }
  check(errors.length === 0, `desktop: no page errors ${errors.join(' | ')}`)
  await context.close()
}

/* ---------- Light theme ---------- */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  await context.addInitScript(() => localStorage.setItem('pv2-theme', 'light'))
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  await page.evaluate(() => document.getElementById('work').scrollIntoView())
  await page.waitForTimeout(1200)
  const b = await bento(page)
  check(b.edges.length === 1 && b.edges[0] === '0px rgba(14, 27, 42, 0.14) 0px 0px 0px 1px inset', `light: every tile has the soft hairline edge (${b.edges})`)
  check(!b.overflowX, 'light 1280: no sideways scroll')
  await shot(page, 'laptop-light-bento')
  await context.close()
}

/* ---------- Phone ---------- */
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  await context.addInitScript(() => localStorage.setItem('pv2-theme', 'dark'))
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  await page.evaluate(() => document.getElementById('work').scrollIntoView())
  await page.waitForTimeout(900)
  await shot(page, 'phone-bento')
  const cols = await page.evaluate(() => getComputedStyle(document.querySelector('.wb__grid')).gridTemplateColumns.split(' ').length)
  check(cols === 2, `phone: the bento is two columns (${cols})`)
  await page.locator('#work a[href="/work/products"]').tap()
  await page.waitForTimeout(1100)
  let s = await read(page)
  check(s.path === '/work/products' && s.open, `phone: tapping a tile opens its sheet (${s.path})`)
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: no sideways scroll')
  await shot(page, 'phone-open')

  // Swipe the grab bar down with a flick: the sheet should close.
  const grab = await page.locator('.sh__grab').boundingBox()
  const x = grab.x + grab.width / 2
  let y = grab.y + grab.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 0; i < 6; i++) {
    y += 40
    await page.mouse.move(x, y)
    await page.waitForTimeout(16)
  }
  await page.mouse.up()
  await page.waitForTimeout(1100)
  s = await read(page)
  check(s.path === '/' && !s.open && !s.locked, `phone: a flick down on the grab bar closes it (path ${s.path})`)
  check(errors.length === 0, `phone: no page errors ${errors.join(' | ')}`)
  await context.close()
}

await browser.close()
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASS')
process.exit(failures.length ? 1 : 0)
