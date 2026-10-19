// E2E check for the Home Services "Card stack", the sidebar
// Services link, and the Work logo card faces.
// Desktop: the heading holds while the five cards are dealt onto a pile; each covered card sinks back
// (scale) and dims under the next, a thin edge of every earlier card stays in view.
// Phones and tablets: the same pile on native CSS sticky, without the sink. Reduced motion: a plain stack.
// Usage: BASE=http://localhost:5190 node scripts/check-services.mjs   (screens -> scripts/out/services/)
import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5190'
const OUT = new URL('./out/services/', import.meta.url)
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const shot = (page, name) => page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) })

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) failures.push(message)
}
const r2 = (v) => Math.round(v * 100) / 100

/** Jump the page (through Lenis on desktop, so it does not fight back). */
const scrollTo = (page, y) =>
  page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)), y)

const read = (page) =>
  page.evaluate(() => {
    const section = document.getElementById('services')
    const head = section.querySelector('.sv__head')
    const items = [...section.querySelectorAll('.sv__item')]
    const cards = items.map((item) => item.querySelector('[data-card]'))
    const rule = section.querySelector('[data-sv-rule]')
    const tops = items.map((item) => item.getBoundingClientRect().top)
    const sticks = items.map((item) => parseFloat(getComputedStyle(item).top) || 0)
    return {
      scrollY: Math.round(scrollY),
      top: Math.round(section.getBoundingClientRect().top + scrollY),
      bottom: Math.round(section.getBoundingClientRect().bottom + scrollY),
      headTop: Math.round(head.getBoundingClientRect().top),
      headSticky: getComputedStyle(head).position === 'sticky',
      itemPos: getComputedStyle(items[0]).position,
      tops: tops.map(Math.round),
      // landed = the card rests at its sticky offset (on the pile)
      landed: tops.map((t, i) => Math.abs(t - sticks[i]) < 2),
      step: sticks[1] - sticks[0],
      scales: cards.map((c) => new DOMMatrix(getComputedStyle(c).transform).a),
      dims: cards.map((c) => Number(getComputedStyle(c.querySelector('.sv__dim')).opacity)),
      rule: rule ? new DOMMatrix(getComputedStyle(rule).transform).a : null,
      gaps: cards.slice(1).map((c, i) => Math.round(c.getBoundingClientRect().top - cards[i].getBoundingClientRect().bottom)),
      fits: cards.every((c) => c.scrollHeight <= c.clientHeight + 1),
      overflowX: document.documentElement.scrollWidth > innerWidth,
      navLit: document.querySelector('[data-nav-id="services"]')?.dataset.active === 'true',
    }
  })

/** Walk the section in small scroll steps and keep every reading. */
const walk = async (page, stepPx) => {
  // Bring the section near first and re-read its bounds every step: lazy pictures above it (Work)
  // land while the walk runs and push it down.
  await page.locator('#services').scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  const vh = page.viewportSize().height
  const seq = []
  // Until the section has left the top: on phones the last card lands after its bottom passed the screen bottom.
  for (let y = (await read(page)).top - vh; y <= (seq.at(-1) ?? (await read(page))).bottom; y += stepPx) {
    await scrollTo(page, y)
    await page.waitForTimeout(90)
    seq.push(await read(page))
  }
  return seq
}
const count = (r) => r.landed.filter(Boolean).length

const browser = await chromium.launch()

for (const [label, viewport, extra] of [
  ['desk', { width: 1440, height: 900 }, {}],
  ['laptop', { width: 1280, height: 720 }, {}],
  ['tablet', { width: 820, height: 1180 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['phone', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['reduced', { width: 1440, height: 900 }, { reducedMotion: 'reduce' }],
]) {
  const desktop = label === 'desk' || label === 'laptop'
  const context = await browser.newContext({ viewport, ...extra })
  await context.addInitScript(() => localStorage.setItem('pv2-theme', 'dark'))
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1500)

  if (label === 'desk') {
    await page.click('[data-nav-id="services"]')
    await page.waitForTimeout(2200)
    const s = await read(page)
    check(Math.abs(s.scrollY - s.top) < 40, `${label}: sidebar Services glides Home to the section (scrollY ${s.scrollY}, section ${s.top})`)
    check(s.navLit, `${label}: sidebar Services is lit on the section`)
  }

  if (label === 'reduced') {
    await page.locator('#services').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const s = await read(page)
    check(s.itemPos === 'static' && !s.headSticky, `${label}: a plain stack, nothing sticks (${s.itemPos})`)
    check(s.gaps.every((g) => g >= 15) && s.scales.every((v) => v === 1) && s.dims.every((d) => d === 0), `${label}: cards sit apart, still and undimmed (gaps ${s.gaps})`)
    check(s.fits && !s.overflowX, `${label}: cards fit their text, no sideways scroll`)
    await shot(page, label)
  } else {
    const seq = await walk(page, desktop ? 60 : 50)
    const outOfOrder = seq.find((r) => !r.landed.every((l, k) => !l || k === 0 || r.landed[k - 1]))
    check(!outOfOrder, `${label}: cards land on the pile in order${outOfOrder ? ` (at scrollY ${outOfOrder.scrollY}: ${outOfOrder.landed} tops ${outOfOrder.tops})` : ''}`)
    const start = seq.find((r) => r.landed[0] && !r.landed[1])
    const middle = seq.find((r) => r.landed[2] && !r.landed[3])
    const end = seq.find((r) => r.landed.every(Boolean))
    check(
      Boolean(start && middle && end),
      `${label}: the walk reaches start (1 card), middle (3 cards) and end (all ${end?.landed.length} cards) (landed counts ${[...new Set(seq.map(count))].join(',')})`,
    )
    if (start && middle && end) {
      const expectStep = desktop ? 16 : 12
      check(end.step === expectStep && end.tops.every((t, i) => i === 0 || t - end.tops[i - 1] === expectStep), `${label} end: a ${expectStep}px edge of every earlier card shows (${end.tops})`)
      if (desktop) {
        const held = seq.filter((r) => count(r) >= 1)
        check(held.every((r) => Math.abs(r.headTop - held[0].headTop) <= 1) && end.headSticky, `${label}: the heading holds while the pile builds (top ${held[0].headTop})`)
        check(start.scales[0] > 0.99 && start.dims[0] < 0.01, `${label} start: the first card rests at full size (scale ${r2(start.scales[0])})`)
        check(
          middle.scales[0] < middle.scales[1] && middle.scales[1] < 1 && middle.dims[0] > 0.3 && middle.dims[1] > 0.3,
          `${label} middle: the covered cards sink back and dim (scales ${middle.scales.map(r2)}, dims ${middle.dims.map(r2)})`,
        )
        check(
          end.scales.every((v, i) => i === 0 || v > end.scales[i - 1]) && end.scales.at(-1) > 0.99 && Math.abs(end.scales[0] - (1 - 0.04 * (end.scales.length - 1))) < 0.01,
          `${label} end: the pile steps from ${r2(1 - 0.04 * (end.scales.length - 1))} at the bottom to the full top card (${end.scales.map(r2)})`,
        )
        check(end.dims.at(-1) < 0.01 && end.dims.slice(0, -1).every((d) => d > 0.5), `${label} end: every card under the top one is dimmed (${end.dims.map(r2)})`)
        check(start.rule < middle.rule && end.rule > 0.99, `${label}: the eyebrow rule fills as the pile lands (${r2(start.rule)} -> ${r2(middle.rule)} -> ${r2(end.rule)})`)
      } else {
        check(!end.headSticky, `${label}: the heading scrolls away (no hold)`)
        check(seq.every((r) => r.scales.every((v) => v === 1) && r.dims.every((d) => d === 0)), `${label}: the same pile without the sink (no scale, no dim)`)
      }
      for (const [name, r] of [['start', start], ['middle', middle], ['end', end]]) {
        await scrollTo(page, r.scrollY)
        await page.waitForTimeout(300)
        await shot(page, `${label}-${name}`)
      }
    }
    check(seq.every((r) => r.fits), `${label}: card text fits inside every card`)
    check(seq.every((r) => !r.overflowX), `${label}: no sideways page scroll`)

    // A card opens the Work chapter that shows that service (the first card, while it is on top).
    if (start) {
      await scrollTo(page, start.scrollY)
      await page.waitForTimeout(400)
      await page.locator('#services [data-card]').first().click()
      await page.waitForTimeout(1200)
      const path = await page.evaluate(() => location.pathname)
      check(path === '/work/client-tools', `${label}: the first card opens its Work chapter (${path})`)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1000)
    }
  }

  // Work bento logo faces: every chapter now has a landscape capture, so none shows a logo face.
  if (label === 'desk' || label === 'phone') {
    for (const id of ['this-site']) {
      await page.locator(`#work a[href="/work/${id}"]`).scrollIntoViewIfNeeded()
      await page.waitForTimeout(900)
      await shot(page, `${label}-face-${id}`)
    }
    const faces = await page.evaluate(() =>
      [...document.querySelectorAll('#work .wa__face')].map((f) => ({
        chapter: f.closest('a').getAttribute('href'),
        layout: f.dataset.layout,
        loaded: [...f.querySelectorAll('img')].every((img) => img.complete && img.naturalWidth > 0),
      })),
    )
    // 1 = one large mark.
    check(
      faces.length === 0,
      `${label}: no chapter falls back to a logo face, every logo loaded (${faces.map((f) => `${f.chapter} ${f.layout}`).join(', ')})`,
    )
  }

  check(errors.length === 0, `${label}: no page errors ${errors.join(' | ')}`)
  await context.close()
}

// Keon's four services, each opening the Work chapter that proves it (chapter ids from Task 5).
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${BASE}/`)
  await page.waitForTimeout(800)
  const cards = await page.$$eval('#services .sv__card', (els) => els.map((a) => `${a.querySelector('.sv__name').textContent} -> ${a.getAttribute('href')}`))
  const want = [
    'Internal tools -> /work/client-tools',
    'AI automation pipelines -> /work/client-tools',
    'Content and video automation -> /work/my-tools',
    'Web apps -> /work/products',
  ]
  check(cards.join(' | ') === want.join(' | '), `four services, each linked to its proof (${cards.join(' | ')})`)
  check(!/PLACEHOLDER/.test(await page.$eval('#services', (el) => el.textContent)), 'no placeholder copy in Services')
  await page.close()
}

await browser.close()
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASS')
process.exit(failures.length ? 1 : 0)
