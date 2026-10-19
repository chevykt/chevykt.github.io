import type { ReactNode } from 'react'
import { PageMeta } from '@/app/PageMeta'
import type { PageRoute } from '@/app/routes'
import { PageHeader } from '@/components/page/PageHeader'
import { proofPage, quotes, receipts } from '@/content/proof'
import { isoDay, proofJsonLd } from '@/lib/seo'
import './proof.css'

const pad2 = (n: number) => String(n).padStart(2, '0')

/** One band of the ledger: a label that holds while its band scrolls by, the record beside it. */
function Band({ id, title, count, nested, children }: { id: string; title: string; count: string; nested: boolean; children: ReactNode }) {
  const H = nested ? 'h3' : 'h2'
  return (
    <section className="pf-band" aria-labelledby={id}>
      <div className="pf-band__label">
        <H id={id}>{title}</H>
        <span className="pg-mono">{count}</span>
      </div>
      <div className="pf-band__body">{children}</div>
    </section>
  )
}

/** The receipts, then the quotes once a real one exists. Nested = inside a Home section, so every heading steps down one level. */
function ProofLedger({ nested }: { nested: boolean }) {
  const c = proofPage
  const Build = nested ? 'h4' : 'h3'
  const at = nested ? '-home' : ''

  return (
    <div className="pf-ledger">
      <Band id={`pf-receipts${at}`} title={c.bands.receipts} count={`${pad2(receipts.length)} receipts`} nested={nested}>
        <ul className="pf-receipts">
          {receipts.map((r) => (
            <li key={r.build} className="pf-receipt">
              <Build className="pf-receipt__build">{r.build}</Build>
              <p className="pf-receipt__fact">{r.fact}</p>
              {r.detail ? <p className="pf-receipt__detail pg-mono">{r.detail}</p> : null}
            </li>
          ))}
        </ul>
      </Band>

      {quotes.length > 0 ? (
        <Band id={`pf-quotes${at}`} title={c.bands.quotes} count={`${pad2(quotes.length)} notes`} nested={nested}>
          {quotes.map((q) => (
            <blockquote key={q.name} className="pf-quote">
              <p>{q.text}</p>
              <footer>
                <cite>{q.name}</cite>
                <span className="pg-mono">{q.context}</span>
                <time className="pg-mono" dateTime={isoDay(q.date)}>
                  {q.date}
                </time>
              </footer>
            </blockquote>
          ))}
        </Band>
      ) : null}
    </div>
  )
}

/**
 * Proof, "the ledger": hairline bands to scan like a record. Receipts first: each build paired with a
 * fact anyone can check. Quotes join only when a real, named, dated one exists, as visible text so
 * answer engines can cite it.
 */
export function ProofPage({ page }: { page: PageRoute }) {
  const c = proofPage

  return (
    <div className="pg pf">
      <PageMeta page={page} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: proofJsonLd({ path: page.path, title: page.title, description: page.description, quotes }),
        }}
      />

      <PageHeader eyebrow={c.eyebrow} titleThin={c.titleThin} titleBold={c.titleBold} lede={c.lede} />
      <ProofLedger nested={false} />
    </div>
  )
}

/** The same ledger as a Home section after About (the sidebar Proof entry scrolls Home to #proof). */
export function ProofSection() {
  const c = proofPage

  return (
    <section id="proof" className="pg pg--section pf" aria-labelledby="proof-title">
      <PageHeader level={2} id="proof-title" eyebrow={c.eyebrow} titleThin={c.titleThin} titleBold={c.titleBold} lede={c.lede} />
      <ProofLedger nested />
    </section>
  )
}
