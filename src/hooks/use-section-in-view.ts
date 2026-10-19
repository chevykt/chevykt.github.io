import { useEffect, useState } from 'react'

/**
 * Which of the elements #ids crosses the middle of the viewport (null when none). Drives the sidebar
 * highlight for entries that point at a Home section. Pass enabled=false off Home and it reads null.
 */
export function useSectionInView(ids: string[], enabled: boolean): string | null {
  const [inView, setInView] = useState<string | null>(null)
  const key = ids.join(' ')

  useEffect(() => {
    if (!enabled) return
    const targets = key
      .split(' ')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (!targets.length) return
    const hits = new Set<string>()
    // A thin band just above the middle: a section "owns" the screen once it reaches it.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) hits.add(entry.target.id)
          else hits.delete(entry.target.id)
        }
        setInView(targets.find((target) => hits.has(target.id))?.id ?? null)
      },
      { rootMargin: '-45% 0px -54% 0px' },
    )
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [key, enabled])

  return enabled ? inView : null
}
