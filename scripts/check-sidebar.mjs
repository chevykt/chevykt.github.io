// E2E check for the sidebar. Drives it like a visitor and screenshots each state.
// Usage: BASE=http://localhost:5190 node scripts/check-sidebar.mjs   (screens -> scripts/out/)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE ?? 'http://localhost:5190'
const OUT = new URL('./out/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`)
  if (!ok) failures.push(message)
}
const shot = (page, name) => page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, OUT)) })
const settle = (page) => page.waitForTimeout(800) // longer than the slowest spring (587ms)

const browser = await chromium.launch()

/* ---------- First visit: dark by default ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  const first = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, color: document.querySelector('meta[name="theme-color"]').content }))
  check(first.theme === 'dark' && first.color === '#0d0d0f', `a first visit lands in dark mode (${JSON.stringify(first)})`)
  await page.evaluate(() => localStorage.setItem('pv2-theme', 'light'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  const picked = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, color: document.querySelector('meta[name="theme-color"]').content }))
  check(picked.theme === 'light' && picked.color === '#efeee9', `a saved light pick is applied before paint (${JSON.stringify(picked)})`)
  await page.close()
}

/* ---------- Desktop (starts from a saved light pick, then switches to dark) ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.addInitScript(() => localStorage.setItem('pv2-theme', 'light'))
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto(`${BASE}/proof`)
  await settle(page)
  check((await page.title()).startsWith('Proof | '), 'unique title on /proof (a page of its own; /work now redirects to /#work)')
  await shot(page, 'desktop-expanded')

  const indicatorY = () => page.$eval('.sb-float .sb-indicator', (el) => new DOMMatrix(getComputedStyle(el).transform).m42)
  const itemY = (id) => page.$eval(`.sb-float [data-nav-id="${id}"]`, (el) => el.offsetTop)

  const indicatorShown = () => page.$eval('.sb-float .sb-indicator', (el) => getComputedStyle(el).opacity === '1')
  const litCount = () => page.$$eval('.sb-float [data-highlighted="true"]', (l) => l.length)

  check(!(await indicatorShown()) && (await litCount()) === 0, 'nothing highlighted at rest')
  check((await page.$eval('.sb-float [data-nav-id="proof"]', (el) => getComputedStyle(el).color)) !== (await page.$eval('.sb-float [data-nav-id="home"]', (el) => getComputedStyle(el).color)), 'current page marked in blue text')

  // Logo: the light-theme file is the one showing, and it actually loaded.
  const logo = await page.$$eval('.sb-float .sb-logo__mark img', (imgs) =>
    imgs.map((i) => ({ src: i.getAttribute('src'), shown: getComputedStyle(i).display !== 'none', loaded: i.naturalWidth > 0 })),
  )
  check(logo.length === 2 && logo[0].shown && logo[0].loaded && !logo[1].shown, `logo shows the light version (${JSON.stringify(logo)})`)

  // Socials replace search: the links from content/site.ts, in order, opening in a new tab.
  const social = await page.$$eval('.sb-float .social-key', (links) =>
    links.map((a) => ({ label: a.getAttribute('title'), href: a.getAttribute('href'), blank: a.target === '_blank', h: a.offsetHeight })),
  )
  check(social.map((s) => s.label).join(',') === 'LinkedIn,GitHub', `socials in order (${social.map((s) => s.label)})`)
  check(social.every((s) => s.blank && s.href && s.h >= 44), 'socials open in a new tab with 44px targets')
  check((await page.$('.sb-float .sb-search')) === null, 'search field is gone from the card')
  check((await page.$$('.sb-float .social-key svg')).length === social.length, 'every social key draws its mark')

  await page.hover('.sb-float [data-nav-id="services"]')
  await settle(page)
  await page.hover('.sb-float [data-nav-id="proof"]')
  await settle(page)
  check((await indicatorShown()) && (await indicatorY()) === (await itemY('proof')), 'highlight glides to the hovered item')
  await shot(page, 'desktop-hover')

  await page.mouse.move(900, 450)
  await settle(page)
  check(!(await indicatorShown()) && (await litCount()) === 0, 'highlight clears when the pointer leaves')
  check((await indicatorY()) === (await itemY('proof')), 'highlight fades out in place (no slide on leave)')

  await page.click('.sb-toggle')
  await settle(page)
  const clip = await page.$eval('.sb-float .sb-panel', (el) => getComputedStyle(el).clipPath)
  check(clip.includes('196px'), `collapsed clip leaves a 76px rail (${clip})`)
  const labelOpacity = await page.$eval('.sb-float .sb-item__label', (el) => getComputedStyle(el).opacity)
  check(labelOpacity === '0', 'labels hidden on the rail')
  const rail = await page.evaluate(() => {
    const panel = document.querySelector('.sb-float .sb-panel').getBoundingClientRect()
    const pic = document.querySelector('.sb-float .sb-pic').getBoundingClientRect()
    const mark = document.querySelector('.sb-float .sb-logo__mark').getBoundingClientRect()
    return { pic: Math.round(pic.x + pic.width / 2 - panel.x), size: Math.round(pic.width), mark: Math.round(mark.x + mark.width / 2 - panel.x) }
  })
  check(rail.pic === 38 && rail.size === 44 && rail.mark === 38, `picture shrinks to 44px and centers on the rail with the logo mark (${JSON.stringify(rail)})`)
  // On the rail a visitor points at the icon (x = 38), not the clipped-away row center.
  await page.hover('.sb-float [data-nav-id="services"]', { position: { x: 38, y: 20 } })
  await settle(page)
  check((await page.$eval('.sb-tip', (el) => el.dataset.visible)) === 'true', 'rail tooltip shows the hovered label')
  const blocker = await page.evaluate(() => document.elementFromPoint(200, 300)?.closest('.sb-float') === null)
  check(blocker, 'the hidden strip right of the rail does not block the page')
  check((await page.$eval('.sb-tip', (el) => el.textContent)) === 'Services', 'rail tooltip text matches')
  await shot(page, 'desktop-collapsed')

  // Interrupt: click twice fast, the card must end expanded with no stuck state.
  await page.click('.sb-toggle')
  await page.waitForTimeout(120)
  await page.click('.sb-toggle')
  await page.waitForTimeout(120)
  await page.click('.sb-toggle')
  await settle(page)
  check((await page.$eval('.sb-float', (el) => el.dataset.collapsed)) === 'false', 'reversal mid-flight lands expanded')

  await page.reload()
  await settle(page)
  check((await page.$eval('.sb-float', (el) => el.dataset.collapsed)) === 'false', 'collapse state persists across reload')

  await page.keyboard.press('Control+k')
  await settle(page)
  check(await page.$eval('dialog.search', (el) => el.open), 'Ctrl+K opens search')
  await page.keyboard.type('showc')
  await page.keyboard.press('Enter')
  await settle(page)
  await page.waitForTimeout(800) // the Lenis glide to a section runs ~1.1s
  check(new URL(page.url()).pathname === '/' && (await page.$eval('#showcase', (el) => Math.abs(el.getBoundingClientRect().top) < 4)), 'search + Enter scrolls Home to Showcase')

  // Theme switch with a real mouse. The cross-fade overlay must not throw the highlight around.
  const themeBox = await (await page.$('.sb-float [data-nav-id="theme"]')).boundingBox()
  const themeRowY = await itemY('theme')
  await page.mouse.move(themeBox.x + 60, themeBox.y + themeBox.height / 2)
  await settle(page)
  await page.mouse.down()
  await page.mouse.up()
  const samples = []
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(75)
    samples.push(Math.round(await indicatorY()))
  }
  check(samples.every((y) => y === themeRowY) && (await indicatorShown()), `highlight holds on Dark mode through the fade (${samples.join(',')})`)
  check((await page.$eval('html', (el) => el.dataset.theme)) === 'dark', 'dark mode switch')
  const darkLogoShown = await page.$$eval('.sb-float .sb-logo__mark img', (imgs) => getComputedStyle(imgs[1]).display !== 'none' && getComputedStyle(imgs[0]).display === 'none')
  check(darkLogoShown, 'dark mode swaps to the light-cup logo')
  await shot(page, 'desktop-dark')

  // Click, then leave the sidebar mid-fade: once the fade ends the highlight must be gone.
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(60)
  await page.mouse.move(900, 450)
  await settle(page)
  check(!(await indicatorShown()) && (await litCount()) === 0, 'leaving mid-fade clears the highlight')

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  check(!overflow, 'no horizontal overflow at 1440')
  check(errors.length === 0, `no console errors ${errors.join(' | ')}`)
  await page.close()
}

/* ---------- Phone ---------- */
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await context.newPage()
  await page.goto(`${BASE}/proof`)
  await settle(page)
  check((await page.$('.sb-float')) === null, 'no desktop sidebar on a phone')
  await shot(page, 'phone-closed')

  await page.tap('[aria-label="Open menu"]')
  await settle(page)
  check((await page.$eval('.mb-drawer', (el) => el.dataset.open)) === 'true', 'menu opens the drawer')
  await shot(page, 'phone-drawer')

  await page.keyboard.press('Escape')
  await settle(page)
  check((await page.$eval('.mb-drawer', (el) => el.dataset.open)) === 'false', 'Escape closes the drawer')

  await page.tap('[aria-label="Open menu"]')
  await settle(page)
  // From another page, a section entry (Contact) navigates to Home at its section.
  await page.tap('.mb-drawer [data-nav-id="contact"]')
  await settle(page)
  const landed = new URL(page.url())
  check(landed.pathname === '/' && landed.hash === '#contact', `drawer link navigates to Home at #contact (${landed.pathname}${landed.hash})`)
  check((await page.$eval('.mb-drawer', (el) => el.dataset.open)) === 'false', 'drawer closes after navigating')

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  check(!overflow, 'no horizontal overflow at 390')
  await context.close()
}

// Keon's identity, and the template pieces the spec cuts (Resources, Terms, the verified check).
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${BASE}/`)
  await page.waitForTimeout(800)
  const card = await page.$eval('.sb-float', (el) => el.innerText)
  check(card.includes('Keon Tabuena') && card.includes('Full-stack developer'), 'sidebar shows Keon Tabuena, Full-stack developer')
  const hrefs = await page.$$eval('.sb-float .social-key', (links) => links.map((a) => a.getAttribute('href')))
  check(hrefs.join(' ') === 'https://linkedin.com/in/keontabz https://github.com/chevykt', `social hrefs are Keon's (${hrefs.join(' ')})`)
  check(!/\bResources\b/.test(card), 'no Resources item in the sidebar')
  check((await page.$('.sb-pic__check')) === null, 'no verified check on the photo')
  const footer = await page.$eval('.site-foot', (el) => el.innerText)
  check(!/\bterms\b/i.test(footer), `footer has no Terms link (${footer.replace(/\s+/g, ' ')})`)
  await page.goto(`${BASE}/terms`)
  await page.waitForTimeout(800)
  check((await page.content()).includes('Page not found'), '/terms renders the not-found page')
  await page.close()
}

await browser.close()
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASS')
process.exit(failures.length ? 1 : 0)
