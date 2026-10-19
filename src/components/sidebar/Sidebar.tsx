import { useRef, useState, type CSSProperties } from 'react'
import { CaretLeft } from '@phosphor-icons/react'
import { useShell } from '@/app/shell-context'
import { SidebarPanel } from './SidebarPanel'
import type { HoverTarget } from './types'
import './sidebar.css'

const COLLAPSE_HINT = 'Ctrl B'

type Tip = { label: string; y: number; visible: boolean }

/**
 * The floating desktop sidebar. Collapsing clips the card down to an icon rail (clip-path,
 * no layout change) while labels fade; the toggle rides the edge. Every part is a CSS
 * transition on a state attribute, so a second click mid-flight reverses from where it is.
 */
export function Sidebar() {
  const { collapsed, toggleCollapsed } = useShell()
  const rootRef = useRef<HTMLElement>(null)
  const [tip, setTip] = useState<Tip>({ label: '', y: 0, visible: false })

  // The collapsed rail shows the hovered item's label beside it. The last label is kept
  // while the tooltip fades out so it never empties mid-fade.
  const onHoverChange = (target: HoverTarget | null) => {
    const root = rootRef.current
    if (!target || !root) {
      setTip((current) => ({ ...current, visible: false }))
      return
    }
    const rootTop = root.getBoundingClientRect().top
    const box = target.element.getBoundingClientRect()
    setTip({ label: target.label, y: box.top - rootTop + box.height / 2, visible: true })
  }

  return (
    <aside ref={rootRef} className="sb-float" data-collapsed={collapsed} aria-label="Sidebar">
      <SidebarPanel variant="floating" collapsed={collapsed} onHoverChange={onHoverChange} />

      <button
        type="button"
        className="sb-toggle"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-keyshortcuts="Control+B"
      >
        <CaretLeft size={14} weight="bold" aria-hidden />
        <span className="sb-toggle__tip" aria-hidden>
          {collapsed ? 'Expand' : 'Collapse'}
          <kbd>{COLLAPSE_HINT}</kbd>
        </span>
      </button>

      <span
        className="sb-tip"
        aria-hidden
        data-visible={collapsed && tip.visible}
        style={{ '--tip-y': `${tip.y}px` } as CSSProperties}
      >
        {tip.label}
      </span>
    </aside>
  )
}
