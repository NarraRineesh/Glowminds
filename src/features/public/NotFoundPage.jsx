import { Link } from 'react-router-dom'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import '@/styles/landing.css'

export default function NotFoundPage() {
  return (
    <>
      <SEO
        title="Page Not Found"
        path="/404"
        description="The page you are looking for does not exist or has been moved."
        noIndex
      />
      <div className="flex min-h-screen flex-col pb-12 pt-[88px]">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
          <div className="max-w-[420px] text-center">
            <div className="mb-3 bg-gradient-to-br from-[var(--color-blu)] to-[var(--color-grn)] bg-clip-text text-[clamp(4rem,12vw,6rem)] font-black leading-none tracking-tight text-transparent">
              404
            </div>
            <h1 className="mb-2.5 text-[clamp(1.25rem,3vw,1.5rem)] font-extrabold">Page not found</h1>
            <p className="mb-5 text-[.9rem] leading-relaxed text-[var(--color-txt2)]">
              That link may be broken or the page was removed. Head home or open your dashboard if you are signed in.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link to="/" className="btn btn-p min-h-[44px]">← Back home</Link>
              <Link to="/dashboard" className="btn btn-o min-h-[44px]">Dashboard</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  )
}
