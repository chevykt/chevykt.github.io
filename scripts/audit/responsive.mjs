// Responsive sweep on the PRODUCTION build (vite preview on 5191): every route at 11 widths, fails on
// sideways page scroll, names the widest offending element, and shoots every Home section at 320 / 768 / 1024
// so a person can look. Usage: node scripts/audit/responsive.mjs   (screens -> scripts/out/audit/responsive/)
import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE ?? 'http://localhost:5191'
const OUT = fileURLToPath(new URL('../out/audit/responsive/', import.meta.url))
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const WIDTHS = [320, 360, 375, 390, 414, 768, 834, 1024, 1280, 1440, 1920]
const ROUTES = ['/', '/contact', '/proof', '/showcase', '/privacy', '/work/websites']
const SHOOT = [320, 768, 1024]
const SECTIONS = ['hero', 'manifesto', 'automation', 'work', 'services', 'about', 'proof', 'showcase', 'contact']

const failures = []
const browser = await chromium.launch()

for (const width of WIDTHS) {
  const phone = width < 1024
  const context = await browser.newContext({ viewport: { width, height: phone ? 844 : 900 }, isMobile: phone, hasTouch: phone })
  for (const route of ROUTES) {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(900)
    // Walk the page so scroll-built layouts (pins, rails) measure themselves.
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < height; y += 900) {
      await page.evaluate((top) => window.scrollTo(0, top), y)
      await page.waitForTimeout(40)
    }
    const res = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const over = document.documentElement.scrollWidth - vw
      let worst = null
      if (over > 0) {
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect()
          if (el.closest('.mb-drawer')) continue // off-canvas by design, clipped by its own layer
          if (r.width && r.right > vw + 1 && (!worst || r.right > worst.right)) worst = { right: Math.round(r.right), tag: `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}` }
        }
      }
      return { over, worst }
    })
    const ok = res.over <= 0 && errors.length === 0
    if (!ok) failures.push(`${width} ${route}: overflow ${res.over}px ${res.worst ? `${res.worst.tag} to ${res.worst.right}` : ''} ${errors.join(' | ')}`)

    if (route === '/' && SHOOT.includes(width)) {
      for (const id of SECTIONS) {
        const el = await page.$(`#${id}`)
        if (!el) continue
        await page.evaluate((s) => document.getElementById(s).scrollIntoView({ block: 'start', behavior: 'instant' }), id)
        await page.waitForTimeout(500)
        await page.screenshot({ path: `${OUT}${width}-${id}.png` })
      }
    }
    await page.close()
  }
  await context.close()
  console.log(`${width}: ${failures.filter((f) => f.startsWith(`${width} `)).length ? 'FAIL' : 'ok'}`)
}

await browser.close()
console.log(failures.length ? `\n${failures.join('\n')}\n${failures.length} FAILED` : '\nALL PASS: no sideways scroll, no page errors, 11 widths x 6 routes')
process.exit(failures.length ? 1 : 0)
