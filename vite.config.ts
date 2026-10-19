import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { createServer, defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const src = fileURLToPath(new URL('./src', import.meta.url))

/**
 * Writes dist/sitemap.xml, dist/llms.txt and dist/robots.txt from the route registry, the Work chapters
 * (src/app/sitemap.ts) and site.url (src/content/site.ts), so a new page, a chapter or a new domain is in
 * all three without anyone typing a URL twice.
 */
function sitemap(): Plugin {
  let outDir = 'dist'
  return {
    name: 'pv2-sitemap',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    async closeBundle() {
      const server = await createServer({
        configFile: false,
        logLevel: 'silent',
        resolve: { alias: { '@': src } },
        server: { middlewareMode: true, hmr: false },
        appType: 'custom',
      })
      try {
        const { sitemapPaths, llmsTxt } = (await server.ssrLoadModule('/src/app/sitemap.ts')) as {
          sitemapPaths: () => string[]
          llmsTxt: () => string
        }
        const { site } = (await server.ssrLoadModule('/src/content/site.ts')) as { site: { url: string } }
        const urls = sitemapPaths().map((path) => `  <url><loc>${site.url}${path}</loc></url>`)
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
        writeFileSync(join(outDir, 'sitemap.xml'), xml)
        writeFileSync(join(outDir, 'llms.txt'), llmsTxt())
        writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`)
      } finally {
        await server.close()
      }
    },
  }
}

/**
 * Inlines the entry stylesheet into index.html, so first paint waits on one request less (Lighthouse
 * render-blocking, 2026-10-03). The deploy CSP allows inline styles ('unsafe-inline' in style-src), so
 * no hash to keep in sync. The .css file still ships for anything that asks for it by URL.
 */
function inlineEntryCss(): Plugin {
  return {
    name: 'pv2-inline-entry-css',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        return html.replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g, (tag, file: string) => {
          const asset = ctx.bundle?.[file]
          return asset?.type === 'asset' ? `<style>${String(asset.source)}</style>` : tag
        })
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sitemap(), inlineEntryCss()],
  resolve: {
    alias: { '@': src },
  },
  // Public maps: Lighthouse flags large first-party JS without them, and DevTools traces read as source.
  build: { sourcemap: true },
})
