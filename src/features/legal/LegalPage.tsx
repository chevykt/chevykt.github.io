import { PageMeta } from '@/app/PageMeta'
import type { PageRoute } from '@/app/routes'
import { PageHeader } from '@/components/page/PageHeader'
import { privacyPolicy } from '@/content/legal'
import './legal.css'

/** The privacy page: the page head (title split thin / bold like every page), then plain sections at a reading measure. */
export function LegalPage({ page }: { page: PageRoute }) {
  const doc = privacyPolicy
  const words = doc.title.split(' ')

  return (
    <div className="pg lg">
      <PageMeta page={page} />
      <PageHeader eyebrow={`Updated ${doc.updated}`} titleThin={words.slice(0, -1).join(' ')} titleBold={`${words.at(-1)}.`} lede={doc.intro} />
      <div className="lg-body">
        {doc.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
