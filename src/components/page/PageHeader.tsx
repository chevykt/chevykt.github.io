import type { ReactNode } from 'react'
import './page.css'

type Props = {
  eyebrow: string
  titleThin: string
  titleBold: string
  lede: string
  /** 1 on a standalone page (its one H1); 2 when the page runs as a Home section. */
  level?: 1 | 2
  /** The title's id, for the section's aria-labelledby. */
  id?: string
  children?: ReactNode
}

/** The head of a standalone page: eyebrow, the title (thin over bold, as Home), the answer-first lede. */
export function PageHeader({ eyebrow, titleThin, titleBold, lede, level = 1, id, children }: Props) {
  const Title = level === 1 ? 'h1' : 'h2'
  return (
    <header className="pg-head">
      <p className="pg-eyebrow">
        {eyebrow}
        <i aria-hidden />
      </p>
      <Title id={id} className="pg-title">
        <span>{titleThin}</span> <b>{titleBold}</b>
      </Title>
      <p className="pg-lede">{lede}</p>
      {children}
    </header>
  )
}
