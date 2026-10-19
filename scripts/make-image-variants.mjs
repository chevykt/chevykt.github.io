// Writes right-sized WebP copies of one picture, following the srcset convention the site uses:
// <dir>/<width>/<name>.webp next to the original. Heights keep the aspect ratio.
// Usage: node scripts/make-image-variants.mjs <file> <width,width,...>
//   e.g. node scripts/make-image-variants.mjs public/images/covers/site-1.webp 480,640,960
// Copies get NEW paths (never an overwrite of the original), so long-cached assets stay valid.
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'

const [file, widthArg] = process.argv.slice(2)
const widths = (widthArg ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0)
if (!file || !widths.length) {
  console.error('usage: node scripts/make-image-variants.mjs <file> <width,width,...>')
  process.exit(1)
}
const src = resolve(file)
const ext = extname(src).toLowerCase()
const mime = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }[ext]
if (!mime) { console.error(`unsupported extension ${ext} (use webp, png or jpg)`); process.exit(1) }

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const dataUrl = `data:${mime};base64,${readFileSync(src).toString('base64')}`
  for (const w of widths) {
    const res = await page.evaluate(async ([url, width]) => {
      const img = new Image()
      img.src = url
      await img.decode()
      if (width >= img.naturalWidth) return { skip: img.naturalWidth }
      const h = Math.round((img.naturalHeight * width) / img.naturalWidth)
      const cv = document.createElement('canvas')
      cv.width = width
      cv.height = h
      const g = cv.getContext('2d')
      g.imageSmoothingQuality = 'high'
      g.drawImage(img, 0, 0, width, h)
      return { h, url: cv.toDataURL('image/webp', 0.82) }
    }, [dataUrl, w])
    if (res.skip) { console.warn(`skip ${w}: original is only ${res.skip}px wide`); continue }
    const out = join(dirname(src), String(w), `${basename(src, ext)}.webp`)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'))
    console.log(`wrote ${out}  ${w}x${res.h}  ${Math.round(statSync(out).size / 1024)} KB`)
  }
} finally {
  await browser.close()
}
