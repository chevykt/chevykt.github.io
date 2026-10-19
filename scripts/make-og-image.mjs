// Renders public/og-image.png (1200x630, the link-preview image index.html points at) from the real
// Home hero in the light theme, after its intro has settled. Re-run when the hero changes.
// Usage: node scripts/make-og-image.mjs   (needs the dev server: npm run dev, or BASE=<preview url>)
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE ?? 'http://localhost:5190'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
await page.addInitScript(() => localStorage.setItem('pv2-theme', 'light'))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(2500)
await page.screenshot({ path: fileURLToPath(new URL('../public/og-image.png', import.meta.url)) })
await browser.close()
console.log('wrote public/og-image.png')
