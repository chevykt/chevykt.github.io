// E2E check for the Home live automation diagram (scroll-built, hover / tap inspect).
// Usage: BASE=http://localhost:5190 node scripts/check-automation.mjs   (screens -> scripts/out/automation/)
import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5190'
const OUT = new URL('./out/automation/', import.meta.url)
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const shot = (page, name) => page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) })

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) failures.push(message)
}

/** Scroll so the pinned section is at progress p (0 = section top at the screen top). */
const goTo = (page, p) =>
  page.evaluate((p) => {
    const el = document.getElementById('automation')
    const top = el.getBoundingClientRect().top + scrollY
    const y = top + p * (el.offsetHeight - innerHeight)
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)
  }, p)

const read = (page) =>
  page.evaluate(() => {
    const root = document.getElementById('automation')
    const num = (v) => (v === '' ? null : Number(v))
    const pin = root.querySelector('.fl__pin').getBoundingClientRect()
    return {
      built: [...root.querySelectorAll('.fl__contour')].filter((c) => num(c.style.strokeDashoffset) !== null && num(c.style.strokeDashoffset) < 0.01).length,
      links: [...root.querySelectorAll('.fl__signal')].filter((c) => num(c.style.strokeDashoffset) !== null && num(c.style.strokeDashoffset) < 0.01).length,
      label: root.querySelector('.fl__link-label') ? getComputedStyle(root.querySelector('.fl__link-label')).opacity : null,
      dashes: [...root.querySelectorAll('.fl__mask-draw')].filter((c) => num(c.style.strokeDashoffset) !== null && num(c.style.strokeDashoffset) < 0.01).length,
      packets: [...root.querySelectorAll('.fl__packet')].filter((c) => getComputedStyle(c).opacity === '1').length,
      step: [...root.querySelectorAll('[data-fl-step]')].findIndex((s) => s.hasAttribute('data-on')),
      readout: root.querySelector('[data-fl-readout]').textContent,
      titles: [...root.querySelectorAll('.fl__title')].map((t) => t.textContent),
      tags: Object.fromEntries([...root.querySelectorAll('[data-fl-node]')].map((n) => [n.dataset.flNode, n.querySelector('.fl__tag text').textContent])),
      live: root.hasAttribute('data-live'),
      viewBox: root.querySelector('.fl__svg').getAttribute('viewBox'),
      inspect: root.querySelector('.fl__card h4')?.textContent ?? root.querySelector('.fl__hint')?.textContent,
      pager: root.querySelector('.fl__pager span')?.textContent ?? null,
      fitsPin: [...root.querySelector('.fl__pin').children].every((c) => c.getBoundingClientRect().bottom <= pin.bottom + 1),
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
  await page.waitForTimeout(1500)

  if (label === 'reduced') {
    await page.locator('#automation').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const s = await read(page)
    check(!s.live, `${label}: no scroll story, the finished diagram shows`)
    await shot(page, label)
  } else {
    const at = {}
    const seq = [] // in scroll order (an object lists integer keys 0 and 1 first)
    for (const p of [0, 0.12, 0.3, 0.5, 0.7, 0.8, 0.9, 1]) {
      await goTo(page, p)
      await page.waitForTimeout(400)
      at[p] = await read(page)
      seq.push(at[p])
      await shot(page, `${label}-${String(p).replace('.', '')}`)
    }
    check(at[0].built === 0 && at[0].links === 0, `${label}: nothing drawn at the start`)
    check(at[0.5].built > 1 && at[0.5].built < 9, `${label}: half way, part of the pipeline is drawn (${at[0.5].built} stages, ${at[0.5].links} links)`)
    check(at[1].built === 9 && at[1].links === 7 && at[1].dashes === 3, `${label}: at the end every stage and link is drawn (${at[1].built}/9, ${at[1].links}/7, ${at[1].dashes}/3)`)
    check(at[1].titles.join(' | ') === 'Channel or video URL | YouTube Data API | Transcript | Niche & audience | Hooks & structure | Script brief | Clips + narration | Ebook + landing copy | Render / files', `${label}: the YouTube pipeline, stage by stage (${at[1].titles.join(' | ')})`)
    check(/Claude/.test(at[1].tags.niche) && /Claude/.test(at[1].tags.hooks), `${label}: both analysis stages are Claude (${at[1].tags.niche}, ${at[1].tags.hooks})`)
    check(
      seq.every((s, i) => i === 0 || s.built >= seq[i - 1].built),
      `${label}: stages build in order, never back`,
    )
    check(at[0].step === 0 && at[0.5].step >= 1 && at[1].step === 2, `${label}: rail walks Collect -> Analyze -> Deliver (${at[0].step}, ${at[0.5].step}, ${at[1].step})`)
    check(at[0.9].readout === 'Pipeline live', `${label}: readout says the pipeline is live at the end (${at[0.9].readout})`)
    check(at[0.12].packets >= 1 || at[0.3].packets >= 1, `${label}: a packet runs a link while it draws`)
    check(at[0.5].fitsPin, `${label}: everything fits the pinned screen`)
    check(!at[0.5].overflowX, `${label}: no sideways scroll`)

    if (label === 'phone') {
      await goTo(page, 1)
      await page.waitForTimeout(300)
      await page.locator('[data-fl-node="transcript"]').tap()
      await page.waitForTimeout(1000)
      let s = await read(page)
      check(s.viewBox !== '0 15 1200 545' && s.inspect === 'Transcript' && s.pager === '03 / 09', `${label}: tap zooms onto the stage and inspects it (${s.viewBox}, ${s.inspect}, ${s.pager})`)
      await shot(page, `${label}-zoom`)
      await page.getByRole('button', { name: 'Next stage' }).tap()
      await page.waitForTimeout(900)
      s = await read(page)
      check(s.inspect === 'Niche & audience' && s.pager === '04 / 09', `${label}: next moves to the following stage (${s.inspect})`)
      await page.locator('[data-fl-node="niche"]').tap()
      await page.waitForTimeout(900)
      s = await read(page)
      check(s.viewBox === '0 15 1200 545', `${label}: tapping it again zooms back out (${s.viewBox})`)
    } else {
      await goTo(page, 1)
      await page.waitForTimeout(300)
      await page.locator('[data-fl-node="hooks"] .fl__box').hover()
      await page.waitForTimeout(600)
      const s = await read(page)
      check(s.inspect === 'Hooks & structure', `${label}: hovering a stage inspects it (${s.inspect})`)
      await shot(page, `${label}-hover`)
    }
  }
  check(errors.length === 0, `${label}: no page errors ${errors.join(' | ')}`)
  await context.close()
}

await browser.close()
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASS')
process.exit(failures.length ? 1 : 0)
