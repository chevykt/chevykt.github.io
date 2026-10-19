// Proves the build runs under the LIVE Content-Security-Policy (deploy/*.conf), which no dev server sends.
// Serves dist/ with the exact header strings from the nginx snippets (SPA fallback like nginx), walks every
// route and a demo page in Chromium, and fails on any CSP refusal or page error.
// Usage: npm run build && node scripts/audit/csp-harness.mjs
import { createServer } from 'node:http'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { chromium } from 'playwright'

const root = new URL('../../', import.meta.url)
const dist = new URL('dist/', root).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const csp = (file) => readFileSync(new URL(`deploy/${file}`, root), 'utf8').match(/Content-Security-Policy "([^"]+)"/)[1]
const APP = csp('headers.conf')
const DEMOS = csp('demos-headers.conf')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' }

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = join(dist, path)
  if (!existsSync(file) || statSync(file).isDirectory()) file = path.startsWith('/demos/') ? file : join(dist, 'index.html')
  if (!existsSync(file)) return res.writeHead(404).end()
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Content-Security-Policy': path.startsWith('/demos/') ? DEMOS : APP })
  res.end(readFileSync(file))
}).listen(5199)

const demos = ['funnels', 'plans', 'sites'].flatMap((d) => readdirSync(join(dist, 'demos', d)).filter((f) => f.endsWith('.html')).map((f) => `/demos/${d}/${f}`))
const ROUTES = ['/', '/proof', '/showcase', '/contact', '/privacy', '/terms', '/work/websites', '/no-such-page', ...demos]
const browser = await chromium.launch()
const failures = []
for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const bad = []
  page.on('console', (m) => /Content Security Policy|Refused to/i.test(m.text()) && bad.push(m.text().slice(0, 160)))
  page.on('pageerror', (e) => bad.push(`pageerror ${e.message}`))
  await page.goto(`http://localhost:5199${route}`, { waitUntil: 'load' })
  // Walk the page so lazy chunks, the three.js background, videos and scroll scenes all start.
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h; y += 1200) {
    await page.evaluate((t) => window.scrollTo(0, t), y)
    await page.waitForTimeout(60)
  }
  await page.waitForTimeout(1500)
  const theme = await page.evaluate(() => document.documentElement.dataset.theme ?? null)
  if (!route.startsWith('/demos/') && theme !== 'dark') bad.push(`theme bootstrap did not run (data-theme=${theme})`)
  console.log(`${bad.length ? 'FAIL' : 'PASS'}  ${route}${bad.length ? `\n      ${bad.slice(0, 4).join('\n      ')}` : ''}`)
  if (bad.length) failures.push(route)
  await page.close()
}
await browser.close()
server.close()
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASS: no CSP refusals under the live headers')
process.exit(failures.length ? 1 : 0)
