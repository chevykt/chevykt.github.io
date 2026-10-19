import { Navigate, useMatch } from 'react-router'
import { PageMeta } from '@/app/PageMeta'
import type { PageRoute } from '@/app/routes'
import { findChapter } from '@/content/home'
import { useHashLanding } from '@/hooks/use-hash-landing'
import { WorkSheet } from './work/WorkSheet'
import { homeSectionList } from './sections'

/**
 * Home: a scrolling page built from the section list in sections.ts, top to bottom.
 * At /work/<chapter> it stays mounted and that chapter's sheet opens over it (the sheet then owns
 * the page title, description and canonical URL).
 */
export function HomePage({ page }: { page: PageRoute }) {
  useHashLanding()
  const chapterId = useMatch('/work/:chapter')?.params.chapter
  const chapter = findChapter(chapterId) ?? null
  if (chapterId && !chapter) return <Navigate to="/" replace />

  return (
    <>
      {chapter ? null : <PageMeta page={page} />}
      {homeSectionList.map(({ id, Component }) => (
        <Component key={id} />
      ))}
      <WorkSheet chapter={chapter} />
    </>
  )
}
