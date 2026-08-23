import { Link } from 'react-router-dom'
import BrandLogo, { GlowmindsWordmark } from '@/components/BrandLogo'
import { LEGAL_ADDRESS_ONE_LINE, LEGAL_CIN, LEGAL_NAME } from '@/config/legal'
import { AppAuthLink } from '@/components/HostLinks'

const footerLink =
  'inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground'

function FooterGroup({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</p>
      <nav className="flex flex-col gap-0.5">{children}</nav>
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
            <Link to="/" className="inline-flex min-h-11 items-center gap-2">
              <BrandLogo size={24} alt="" aria-hidden />
              <GlowmindsWordmark className="text-sm text-foreground" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            AI resume builder, job matching worldwide, Glow (Bot), upskilling, and interview prep — a Career Operating System for students and early-career professionals.
            </p>
            <AppAuthLink to="/signup" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
              Sign up free
            </AppAuthLink>
          </div>

          <FooterGroup title="Product">
            <Link to="/features" className={footerLink}>Features</Link>
            <Link to="/careers" className={footerLink}>We're hiring</Link>
            <Link to="/pricing" className={footerLink}>Pricing</Link>
            <AppAuthLink to="/signup" className={footerLink}>Get started</AppAuthLink>
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
          © {year} {LEGAL_NAME}. CIN {LEGAL_CIN}. {LEGAL_ADDRESS_ONE_LINE}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
