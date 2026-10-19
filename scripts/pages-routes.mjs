// GitHub Pages has no rewrites. Give every route in dist/sitemap.xml its own copy of the app shell
// (dist/proof.html, dist/work/client-tools.html), which Pages serves at /proof with a 200; any other
// path falls to dist/404.html, the same shell, so the app still renders its not-found page.
// Usage: node scripts/pages-routes.mjs   (after npm run build)
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

const shell = 'dist/index.html'
const paths = [...readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]).filter((p) => p !== '/')
if (!paths.length) throw new Error('pages-routes: no routes in dist/sitemap.xml')
for (const p of paths) {
  const file = `dist${p}.html`
  mkdirSync(dirname(file), { recursive: true })
  copyFileSync(shell, file)
}
copyFileSync(shell, 'dist/404.html')
console.log(`pages-routes: ${paths.length} route copies + 404.html`)
