import { Link } from 'react-router'
import { site } from '@/content/site'
import './site-footer.css'

/** One quiet line under every page: the owner, and the privacy page nothing else links to. */
export function SiteFooter() {
  return (
    <footer className="site-foot">
      <p>
        {site.name} · {site.role}
      </p>
      <nav aria-label="Legal">
        <Link to="/privacy">Privacy Policy</Link>
      </nav>
    </footer>
  )
}
