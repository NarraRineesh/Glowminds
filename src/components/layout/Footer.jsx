import { Link } from 'react-router-dom'
import BrandLogo, { GlowmindsWordmark } from '@/components/BrandLogo'

const footerLink = 'text-xs text-muted-foreground transition-colors hover:text-foreground'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8">
        <Link to="/" className="inline-flex shrink-0 items-center gap-2">
          <BrandLogo variant="full" size={24} alt="" aria-hidden />
          <GlowmindsWordmark className="text-sm text-foreground" />
        </Link>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Footer">
          <Link to="/features" className={footerLink}>Features</Link>
          <Link to="/pricing" className={footerLink}>Pricing</Link>
          <Link to="/about" className={footerLink}>About</Link>
          <Link to="/contact" className={footerLink}>Contact</Link>
          <Link to="/privacy" className={footerLink}>Privacy</Link>
          <Link to="/terms" className={footerLink}>Terms</Link>
        </nav>

        <p className="shrink-0 text-xs text-muted-foreground md:text-right">© {year} Glowminds</p>
      </div>
    </footer>
  )
}
