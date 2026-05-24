import { Link } from 'react-router-dom'

const LogoSvg = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gf" x1="10" y1="38" x2="38" y2="10" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff" stopOpacity=".85" />
        <stop offset="1" stopColor="#fff" />
      </linearGradient>
    </defs>
    <path
      d="M36 17 A 14 14 0 1 0 36 31 L 36 24 L 27 24"
      stroke="url(#gf)"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

const footerLink = 'text-sm text-[var(--color-txt2)] transition-colors hover:text-[var(--color-txt)]'

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-bdr)] py-10 px-4 md:px-8 lg:px-16">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="md:col-span-2">
          <Link to="/" className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#388bfd] to-[#1a5ae0]">
              <LogoSvg />
            </div>
            <span className="text-base font-bold">
              Glow
              <span className="bg-gradient-to-r from-[var(--color-blu2)] to-[var(--color-grn)] bg-clip-text text-transparent">minds</span>
            </span>
          </Link>
          <p className="mb-4 max-w-[300px] text-sm leading-relaxed text-[var(--color-txt2)]">
            AI-powered career platform for students and fresh graduates. Build resumes, match with jobs, ace interviews.
          </p>
          <div className="flex gap-2.5">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-lg border border-[var(--color-bdr)] bg-[var(--color-surf)] text-sm transition-colors hover:border-[var(--color-bdr2)]" aria-label="Glowminds on X">𝕏</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-lg border border-[var(--color-bdr)] bg-[var(--color-surf)] text-sm transition-colors hover:border-[var(--color-bdr2)]" aria-label="Glowminds on LinkedIn">in</a>
            <a href="mailto:hello@studentsai.in" className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-lg border border-[var(--color-bdr)] bg-[var(--color-surf)] text-sm transition-colors hover:border-[var(--color-bdr2)]" aria-label="Email Glowminds">📧</a>
          </div>
        </div>

        {/* Product */}
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Product</h4>
          <div className="flex flex-col gap-2">
            <Link to="/features" className={footerLink}>Features</Link>
            <Link to="/pricing" className={footerLink}>Pricing</Link>
            <span className={`${footerLink} cursor-default`}>Resume Builder</span>
            <span className={`${footerLink} cursor-default`}>Job Search</span>
            <span className={`${footerLink} cursor-default`}>AI Coach</span>
          </div>
        </div>

        {/* Company */}
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Company</h4>
          <div className="flex flex-col gap-2">
            <Link to="/about" className={footerLink}>About</Link>
            <Link to="/contact" className={footerLink}>Contact</Link>
            <span className={`${footerLink} cursor-default`}>Careers</span>
            <span className={`${footerLink} cursor-default`}>Blog</span>
          </div>
        </div>

        {/* Legal */}
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Legal</h4>
          <div className="flex flex-col gap-2">
            <Link to="/privacy" className={footerLink}>Privacy Policy</Link>
            <Link to="/terms" className={footerLink}>Terms of Service</Link>
            <Link to="/refund" className={footerLink}>Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
