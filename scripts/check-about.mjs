// E2E check for the Home About section ("The floor"): placement after Services, the sidebar About
// link, Person JSON-LD, the picture standing on the floor (beside the lead on desktop, under it on phones),
// the scroll-in rise, logos, overflow.
// Usage: BASE=http://localhost:5190 node scripts/check-about.mjs   (screens -> scripts/out/about/)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5190'
// The site name, read from the identity file, so the page-title checks follow whatever you put there.
const NAME = readFileSync(new URL('../src/content/site.ts', import.meta.url), 'utf8').match(/name: '([^']*)'/)[1]
const OUT = new URL('./out/about/', import.meta.url)
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const shot = (page, name) => page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) })

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) failures.push(message)
}

/** Put the About section's top at screen y = offset. */
const sectionAt = (page, offset) =>
  page.evaluate((offset) => {
    const y = document.getElementById('about').getBoundingClientRect().top + scrollY - offset
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)
  }, offset)

const state = (page) =>
  page.evaluate(() => {
    const section = document.getElementById('about')
    const r = (el) => el.getBoundingClientRect()
    const pic = section.querySelector('.ab__pic')
    const stage = section.querySelector('.ab__stage')
    const lead = section.querySelector('.ab__lead')
    const order = [...document.querySelectorAll('.app-main__inner > section[id]')].map((s) => s.id)
    return {
      order,
      scrollY: Math.round(scrollY),
      top: Math.round(r(section).top + scrollY),
      navLit: document.querySelector('[data-nav-id="about"]')?.dataset.active === 'true',
      pic: { top: r(pic).top, bottom: r(pic).bottom, left: r(pic).left },
      stageBottom: r(stage).bottom,
      lead: { bottom: r(lead).bottom, right: r(lead).right },
      opacity: parseFloat(getComputedStyle(pic).opacity),
      lift: new DOMMatrix(getComputedStyle(pic).transform).m42,
      animations: pic.getAnimations().length,
      overflowX: document.documentElement.scrollWidth > innerWidth,
    }
  })

const browser = await chromium.launch()

for (const [label, viewport, extra, theme] of [
  ['desk', { width: 1440, height: 900 }, {}, 'dark'],
  ['laptop', { width: 1280, height: 720 }, {}, 'dark'],
  ['desk-light', { width: 1440, height: 900 }, {}, 'light'],
  ['phone', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, 'dark'],
  ['reduced', { width: 1440, height: 900 }, { reducedMotion: 'reduce' }, 'dark'],
]) {
  const phone = label === 'phone'
  const context = await browser.newContext({ viewport, ...extra })
  await context.addInitScript((t) => localStorage.setItem('pv2-theme', t), theme)
  const page = await context.newPage()
  const errors = []
  const bad = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`))
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  if (label === 'desk') {
    const head = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelector('#about h2')?.textContent.trim(),
      ld: [...document.querySelectorAll('#about script[type="application/ld+json"]')].map((s) => s.textContent),
    }))
    check(head.h1 === 1 && head.h2 === `Hi, I'm ${NAME}.`, `Home keeps one h1; About heads with an h2 (${head.h2})`)
    let p = null
    try {
      p = JSON.parse(head.ld[0])['@graph'][0]
    } catch (e) {
      check(false, `Person JSON-LD parses (${e.message})`)
    }
    check(p?.['@type'] === 'Person' && p['@id']?.endsWith('/#person'), 'JSON-LD: the #person node the other pages point at')
    check(!p?.hasCredential && p?.sameAs?.length === 2, `JSON-LD: no credential, ${p?.sameAs?.length} profiles (LinkedIn, GitHub)`)

    await page.click('[data-nav-id="about"]')
    await page.waitForTimeout(2400)
    const s = await state(page)
    const at = s.order.indexOf('about')
    check(s.order[at - 1] === 'services' && s.order[at + 1] === 'proof', `About is the section after Services, before Proof (${s.order.join(', ')})`)
    check(Math.abs(s.scrollY - s.top) < 40, `sidebar About glides Home to the section (scrollY ${s.scrollY}, section ${s.top})`)
    check(s.navLit, 'sidebar About is lit on the section')
  }

  // The floor 60px above the screen's bottom edge: the whole picture is on screen, so it has landed.
  await page.evaluate(() => {
    const y = document.querySelector('#about .ab__stage').getBoundingClientRect().bottom + scrollY - innerHeight + 60
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)
  })
  await page.waitForTimeout(900)
  let s = await state(page)
  await shot(page, `${label}-top`)
  check(Math.abs(s.pic.bottom - s.stageBottom) <= 2, `${label}: the picture stands on the floor (pic ${Math.round(s.pic.bottom)}, floor ${Math.round(s.stageBottom)})`)
  if (phone) check(s.pic.top >= s.lead.bottom, `${label}: the picture sits under the lead`)
  else check(s.pic.left >= s.lead.right - 40, `${label}: the lead keeps clear of the picture (lead right ${Math.round(s.lead.right)}, pic left ${Math.round(s.pic.left)})`)
  if (label === 'reduced') check(s.animations === 0 && s.opacity === 1, `${label}: no scroll animation, the picture simply stands there`)
  else check(s.opacity > 0.99 && Math.abs(s.lift) < 1, `${label}: the picture has risen into place (opacity ${s.opacity}, y ${s.lift.toFixed(1)})`)

  if (!phone && label !== 'reduced') {
    // Entering from below: the picture is still on its way up.
    await sectionAt(page, viewport.height - 260)
    await page.waitForTimeout(600)
    const early = await state(page)
    check(early.opacity < 0.9 && early.lift > 2, `${label}: entering, the picture is still rising (opacity ${early.opacity.toFixed(2)}, y ${early.lift.toFixed(1)})`)
  }

  await page.locator('#about .ab__creds').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  await shot(page, `${label}-below`)
  const imgs = await page.evaluate(() => [...document.querySelectorAll('#about img')].filter((i) => getComputedStyle(i).display !== 'none' && !(i.complete && i.naturalWidth > 0)).map((i) => i.src))
  check(imgs.length === 0, `${label}: the picture, every tool key and every shown badge load (the other theme's copy is hidden)${imgs.length ? ` (broken: ${imgs.join(', ')})` : ''}`)
  s = await state(page)
  check(!s.overflowX, `${label}: no sideways page scroll`)
  check(errors.length === 0, `${label}: no page errors${errors.length ? ` (${errors.join(' | ')})` : ''}`)
  check(bad.length === 0, `${label}: no 4xx/5xx responses${bad.length ? ` (${bad.join(', ')})` : ''}`)
  await context.close()
}

await browser.close()
console.log(failures.length ? `\n${failures.length} failed` : '\nall passed')
process.exit(failures.length ? 1 : 0)
