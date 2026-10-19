// Release gate: fails on template leftovers, client names and claims that must never ship.
// Scans src/, index.html, dist/ once built, and (for client names) every tracked file.
// Usage: npm run check:content  (exits 1 on any FAIL)
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const TEXT = /\.(tsx?|css|html|js|mjs|json|svg|txt|xml)$/

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const path = join(dir, name)
        return statSync(path).isDirectory() ? walk(path) : TEXT.test(name) ? [path] : []
      })
    : []

const src = walk(join(ROOT, 'src'))
const dist = walk(join(ROOT, 'dist'))
const html = [join(ROOT, 'index.html')]
const everything = [...src, ...html, ...dist]
// Every tracked text file: the repo is public and the site links to it, so docs and scripts count too.
const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((f) => f && /\.(tsx?|css|html|js|mjs|json|svg|txt|xml|md|yml|yaml|patch)$/.test(f))
  .map((f) => join(ROOT, f))
  .filter((f) => existsSync(f))

// The client names live in a gitignored file (publishing the ban list would publish the names).
const NAMES = join(ROOT, 'scripts/client-names.local')
const names = existsSync(NAMES)
  ? readFileSync(NAMES, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  : []
if (!names.length) console.log('SKIP client-names: no scripts/client-names.local on this machine')

// Each rule: a pattern that must NOT appear, in the listed files.
const rules = [
  { name: 'placeholder', files: everything, re: /PLACEHOLDER|Your Name|Your Brand|Your Role|you@example|example\.com|href: '#'/ },
  { name: 'template-blue', files: everything, re: /2d78c2/i },
  { name: 'template-fonts', files: everything, re: /Geist|IBM Plex/ },
  // `font-weight: 100 900` is a variable-font range in @font-face, not thin type.
  { name: 'thin-type', files: everything.filter((f) => /\.(css|tsx?)$/.test(f)), re: /font-weight:\s*(?:100|200|300)\b(?!\s+\d)|\bfont-(?:thin|extralight|light)\b/ },
  // Labels track at 0.04em at most; the template's wide-tracked caps must not come back.
  { name: 'wide-tracking', files: src, re: /tracking-\[0\.(?:0[5-9]|[1-9])/ },
  { name: 'signal-flow', files: src, re: /SignalFlowBackground/ },
  ...(names.length ? [{ name: 'client-names', files: [...new Set([...everything, ...tracked])], re: new RegExp(names.join('|'), 'i') }] : []),
  { name: 'template-readme', files: [join(ROOT, 'README.md'), join(ROOT, 'package.json')], re: /Portfolio Template|portfolio-template/i },
  { name: 'traction-claim', files: everything, re: /500\+/ },
]

const failures = []
for (const rule of rules) {
  let hits = 0
  for (const file of rule.files) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (!rule.re.test(line)) return
        hits++
        if (hits <= 5) console.log(`FAIL ${rule.name} ${relative(ROOT, file)}:${i + 1}`)
      })
  }
  if (hits > 5) console.log(`FAIL ${rule.name} ... and ${hits - 5} more`)
  if (hits) failures.push(rule.name)
}

// Presence rule: the hero says exactly what the spec says.
const home = readFileSync(join(ROOT, 'src/content/home.ts'), 'utf8')
for (const line of ['Full-stack developer.', 'I build tools clients actually use.']) {
  if (!home.includes(line)) {
    console.log(`FAIL hero-copy src/content/home.ts missing "${line}"`)
    failures.push('hero-copy')
  }
}

if (failures.length) {
  console.log(`\ncontent check failed: ${[...new Set(failures)].join(', ')}`)
  process.exit(1)
}
console.log('content OK')
