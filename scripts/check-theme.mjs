// E2E check for the Liquid Glass theme: Apple type stack, no thin type, no template blue, glass that turns
// solid under Reduce Transparency, AA contrast on glass, and no sideways scroll on a 360px phone.
// Usage: BASE=http://localhost:5190 node scripts/check-theme.mjs
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5190'
const ROUTES = ['/', '/work', '/services', '/about', '/proof', '/showcase', '/contact', '/privacy', '/nope']

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) failures.push(message)
}

/** Runs in the page: computed font, weights, blue, glass alpha and token contrast for the current theme. */
const inspect = () => {
  const parse = (value) => {
    const v = value.trim()
    if (v.startsWith('#')) {
      // #rgb, #rgba, #rrggbb or #rrggbbaa (the production minifier writes rgb(... / a) as 8-digit hex).
      let h = v.slice(1)
      if (h.length <= 4) h = [...h].map((c) => c + c).join('')
      const byte = (i) => parseInt(h.slice(i, i + 2), 16)
      return [byte(0), byte(2), byte(4), h.length === 8 ? byte(6) / 255 : 1]
    }
    const parts = v.match(/[\d.]+%?/g).map((p) => (p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p)))
    return [parts[0], parts[1], parts[2], parts[3] ?? 1]
  }
  const over = ([r, g, b, a], [R, G, B]) => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const contrast = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }

  const root = getComputedStyle(document.documentElement)
  const token = (name) => parse(root.getPropertyValue(name))
  const ground = over(token('--surface'), token('--bg').slice(0, 3))

  const visible = [...document.querySelectorAll('body *')].filter(
    (el) => el.childElementCount === 0 && el.textContent.trim() && el.getClientRects().length,
  )
  const light = visible.filter((el) => parseInt(getComputedStyle(el).fontWeight, 10) < 400)
  const blue = [...document.querySelectorAll('*')].filter((el) => {
    const s = getComputedStyle(el)
    return s.color === 'rgb(45, 120, 194)' || s.backgroundColor === 'rgb(45, 120, 194)'
  })
  const panel = document.querySelector('.sb-panel')
  const panelStyle = panel && getComputedStyle(panel)

  return {
    font: root.fontFamily,
    light: light.slice(0, 3).map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
    blue: blue.length,
    panelAlpha: panelStyle ? parse(panelStyle.backgroundColor)[3] : null,
    panelBlur: panelStyle ? panelStyle.backdropFilter : null,
    contrastInk2: contrast(token('--ink-2').slice(0, 3), ground),
    contrastInk3: contrast(token('--ink-3').slice(0, 3), ground),
  }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
const cdp = await page.context().newCDPSession(page)

for (const theme of ['light', 'dark']) {
  await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme)
  await page.waitForTimeout(400)
  const r = await page.evaluate(inspect)
  check(r.font.includes('Inter Variable'), `${theme}: font stack includes Inter Variable (got ${r.font})`)
  check(r.light.length === 0, `${theme}: no visible text below weight 400 (${r.light.join(', ') || 'none'})`)
  check(r.blue === 0, `${theme}: no template blue rgb(45,120,194) (${r.blue} elements)`)
  check(r.panelAlpha !== null && r.panelAlpha < 1, `${theme}: sidebar glass is translucent (alpha ${r.panelAlpha})`)
  check(r.contrastInk2 >= 4.5, `${theme}: --ink-2 on glass ${r.contrastInk2.toFixed(2)}:1 >= 4.5`)
  check(r.contrastInk3 >= 4.5, `${theme}: --ink-3 on glass ${r.contrastInk3.toFixed(2)}:1 >= 4.5`)

  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })
  await page.waitForTimeout(300)
  const solid = await page.evaluate(inspect)
  check(solid.panelAlpha === 1, `${theme}: Reduce Transparency makes the sidebar solid (alpha ${solid.panelAlpha})`)
  check(solid.panelBlur === 'none', `${theme}: Reduce Transparency turns the blur off (${solid.panelBlur})`)
  await cdp.send('Emulation.setEmulatedMedia', { features: [] })
}

// The Work sheet holds long text over a busy page: frosted and nearly opaque, never see-through glass.
for (const theme of ['light', 'dark']) {
  await page.addInitScript((t) => localStorage.setItem('pv2-theme', t), theme)
  await page.goto(`${BASE}/work/this-site`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const sheet = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('.sh__panel'))
    const a = s.backgroundColor.match(/[\d.]+/g).map(Number)[3] ?? 1
    return { alpha: a, blur: s.backdropFilter }
  })
  check(sheet.alpha >= 0.85 && sheet.blur !== 'none', `${theme}: the Work sheet is frosted and near-opaque (alpha ${sheet.alpha}, ${sheet.blur})`)
}

await page.setViewportSize({ width: 360, height: 800 })
for (const route of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
  const { scroll, inner } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }))
  check(scroll <= inner, `360px ${route}: no sideways scroll (${scroll} <= ${inner})`)
}

await browser.close()
if (failures.length) {
  console.log(`\n${failures.length} theme check(s) failed`)
  process.exit(1)
}
console.log('\ntheme OK')
