import { Link } from 'react-router-dom'
import BrandLogo, { GlowmindsWordmark } from '@/components/BrandLogo'
import { LEGAL_CIN, LEGAL_NAME } from '@/config/legal'

const footerLink = 'text-xs text-muted-foreground transition-colors hover:text-foreground'

function FooterGroup({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</p>
      <nav className="flex flex-col gap-1.5">{children}</nav>
    </div>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <BrandLogo variant="full" size={24} alt="" aria-hidden />
              <GlowmindsWordmark className="text-sm text-foreground" />
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              One AI platform to build your resume, find jobs, and land your next role.
            </p>
          </div>

          <FooterGroup title="Product">
            <Link to="/features" className={footerLink}>Features</Link>
            <Link to="/pricing" className={footerLink}>Pricing</Link>
          </FooterGroup>

          <FooterGroup title="Company">
            <Link to="/about" className={footerLink}>About</Link>
            <Link to="/contact" className={footerLink}>Contact</Link>
            <Link to="/careers" className={footerLink}>We&apos;re hiring</Link>
          </FooterGroup>

          <FooterGroup title="Legal">
            <Link to="/privacy" className={footerLink}>Privacy Policy</Link>
            <Link to="/terms" className={footerLink}>Terms of Service</Link>
            <Link to="/refund" className={footerLink}>Refund Policy</Link>
          </FooterGroup>
        </div>

        <p className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
          © {year} {LEGAL_NAME}. CIN {LEGAL_CIN}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
