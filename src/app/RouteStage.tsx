import { PageMeta } from './PageMeta'
import type { PageRoute } from './routes'

type Props = {
  page?: PageRoute
  /** Used for the 404 stage, which has no registry entry. */
  title?: string
  label?: string
}

/**
 * Temporary stage for every route while the main-content design is being chosen.
 * It renders only registry data (unique title + description) so the sidebar can be judged
 * against a real page. Replace per route with the real page component.
 */
export function RouteStage({ page, title, label }: Props) {
  const heading = page?.label ?? label ?? ''
  return (
    <section className="mx-auto flex min-h-dvh max-w-[var(--content-max)] flex-col justify-center px-6 py-24 lg:px-12">
      {page ? <PageMeta page={page} /> : <title>{title}</title>}
      {/* A placeholder (or the 404) is never worth indexing: thin content. Built pages drop RouteStage. */}
      <meta name="robots" content="noindex, follow" />

      <p className="text-eyebrow text-ink-3">{page?.path ?? '404'}</p>
      <h1 className="mt-6 text-display">{heading}</h1>
      {page ? <p className="mt-8 max-w-[52ch] text-lede text-ink-2">{page.description}</p> : null}
    </section>
  )
}
