import type { ReactNode } from 'react'

type Props = { url: string; children: ReactNode; action?: ReactNode }

/** Browser chrome around a product screen: three dots, the address, an optional control on the right. */
export function BrowserWindow({ url, children, action }: Props) {
  return (
    <div className="kt-window">
      <div className="kt-window__bar">
        <span className="kt-window__dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="kt-window__url">{url}</span>
        <span className="kt-window__action">{action}</span>
      </div>
      {children}
    </div>
  )
}
