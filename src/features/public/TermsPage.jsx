import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import '@/styles/landing.css'

export default function TermsPage() {
  return (
    <div>
      <SEO
        title="Terms of Service"
        path="/terms"
        description="Glowminds Terms and Conditions for using our AI career platform. Read our service terms, user responsibilities, and policies."
        keywords="Glowminds terms of service, terms and conditions, user agreement, career platform terms, service terms India"
      />

      {/* Hero */}
      <section style={{ padding: 'calc(60px + 40px) 0 40px', position: 'relative', overflow: 'hidden' }}>
        <div className="page-container">
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 100,
            background: 'var(--color-grn2)', border: '1px solid rgba(63,185,80,.22)', color: 'var(--color-grn)',
            fontSize: '.72rem', fontWeight: 700, letterSpacing: '.5px', marginBottom: 18 }}>📜 TERMS OF SERVICE</div>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-.5px', marginBottom: 16 }}>
            Terms & <span className="grad-txt">Conditions</span>
          </h1>
          <p style={{ fontSize: 'clamp(.88rem,1.6vw,1rem)', color: 'var(--color-txt2)', lineHeight: 1.75, maxWidth: 600, margin: '0 auto 12px' }}>
            Last updated: May 4, 2026
          </p>
        </div>
        </div>
      </section>

      {/* Content */}
      <section style={{ paddingBottom: 80 }}>
        <div className="page-container" style={{ maxWidth: 900 }}>
        <div style={{ background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 16, padding: 'clamp(24px,4vw,48px)' }}>
          
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>1. Acceptance of Terms</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              By accessing or using Glowminds, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>2. Use License</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              Permission is granted to temporarily use Glowminds for personal, non-commercial purposes. You may not:
            </p>
            <ul style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, paddingLeft: 24 }}>
              <li>Modify or copy the materials</li>
              <li>Use the materials for commercial purposes</li>
              <li>Attempt to reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the materials to another person</li>
            </ul>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>3. User Accounts</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>4. Subscription & Payment</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              Pro subscriptions are billed annually at ₹399/year. Payments are processed securely through Razorpay. You can cancel your subscription at any time from your dashboard. Cancellations take effect at the end of the current billing period.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>5. Content Ownership</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              You retain all rights to the content you create using Glowminds (resumes, cover letters, etc.). We do not claim ownership of your content. However, you grant us a license to use, store, and process your content to provide our services.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>6. AI-Generated Content</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              Our AI tools provide suggestions and recommendations. While we strive for accuracy, AI-generated content may contain errors. You are responsible for reviewing and verifying all AI-generated content before use.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>7. Prohibited Activities</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              You may not:
            </p>
            <ul style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, paddingLeft: 24 }}>
              <li>Violate any laws or regulations</li>
              <li>Impersonate another person or entity</li>
              <li>Upload malicious code or viruses</li>
              <li>Scrape or harvest data from our platform</li>
              <li>Interfere with the proper functioning of the service</li>
            </ul>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>8. Disclaimer</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              The service is provided "as is" without warranties of any kind. We do not guarantee job placement, interview success, or any specific outcomes. Your success depends on many factors beyond our control.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>9. Limitation of Liability</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              Glowminds shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>10. Termination</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the service will immediately cease.
            </p>
          </div>

          <div style={{ padding: 20, borderRadius: 12, background: 'var(--color-bg2)', border: '1px solid var(--color-bdr)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>Contact Us</h3>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              Questions about these terms? Contact us at:
            </p>
            <p style={{ fontSize: '.9rem', color: 'var(--color-blu2)', marginTop: 8 }}>
              📧 legal@studentsai.in
            </p>
          </div>

        </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
