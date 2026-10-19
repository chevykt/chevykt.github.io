import { site } from '@/content/site'

/** Your logo mark (content/site.ts). Both theme versions are in the DOM; CSS shows the one that matches. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      <img className="only-light" src={site.logo.headerLight} alt="" width={96} height={96} fetchPriority="high" />
      <img className="only-dark" src={site.logo.headerDark} alt="" width={96} height={96} fetchPriority="high" />
    </span>
  )
}
