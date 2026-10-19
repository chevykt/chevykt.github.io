import { chapterPath, workChapters } from '@/content/home'
import { site } from '@/content/site'
import { pages } from './routes'

/** Every indexable path: each built page (drafts are placeholders) plus each Work chapter. Read at build by vite.config.ts. */
export function sitemapPaths(): string[] {
  return [...pages.filter((page) => !page.draft).map((page) => page.path), ...workChapters.map((chapter) => chapterPath(chapter.id))]
}

/**
 * /llms.txt (llmstxt.org): the site in Markdown for AI agents, from the same registry as the sitemap,
 * so a new page or chapter shows up here without anyone typing it twice. Read at build by vite.config.ts.
 */
export function llmsTxt(): string {
  const home = pages.find((page) => page.path === '/')!
  const link = (label: string, path: string, about: string) => `- [${label}](${site.url}${path}): ${about}`
  return [
    `# ${site.name} - ${site.brand}`,
    '',
    `> ${home.description}`,
    '',
    `${site.role}, ${site.location}. Email: ${site.email}`,
    '',
    '## Pages',
    '',
    ...pages.filter((page) => !page.draft).map((page) => link(page.label, page.path, page.description)),
    '',
    '## Work',
    '',
    ...workChapters.map((chapter) => link(chapter.title, chapterPath(chapter.id), chapter.description)),
    '',
  ].join('\n')
}
