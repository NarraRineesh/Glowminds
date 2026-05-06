import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import '@/styles/landing.css'

export default function PrivacyPage() {
  return (
    <div>
      <SEO
        title="Privacy Policy"
        path="/privacy"
        description="Glowminds Privacy Policy - Learn how we protect your data. We never sell your information. End-to-end encryption, secure payments via Razorpay."
        keywords="Glowminds privacy policy, data protection policy, student data privacy, secure career platform, GDPR compliance India, data security"
      />

      {/* Hero */}
      <section style={{ padding: 'calc(60px + 40px) 0 40px', position: 'relative', overflow: 'hidden' }}>
        <div className="page-container">
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 100,
            background: 'var(--color-blu3)', border: '1px solid rgba(56,139,253,.22)', color: 'var(--color-blu2)',
            fontSize: '.72rem', fontWeight: 700, letterSpacing: '.5px', marginBottom: 18 }}>🔒 PRIVACY POLICY</div>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-.5px', marginBottom: 16 }}>
            Your Privacy <span className="grad-txt">Matters</span>
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
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>1. Information We Collect</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              We collect information you provide directly to us when you:
            </p>
            <ul style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, paddingLeft: 24, marginBottom: 12 }}>
              <li>Create an account (name, email, password)</li>
              <li>Build your profile (education, experience, skills)</li>
              <li>Use our services (resumes, job applications, AI interactions)</li>
              <li>Contact us (support requests, feedback)</li>
            </ul>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              We automatically collect certain information about your device and usage patterns through cookies and similar technologies.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>2. How We Use Your Information</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              We use the information we collect to:
            </p>
            <ul style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, paddingLeft: 24 }}>
              <li>Provide, maintain, and improve our services</li>
              <li>Match you with relevant job opportunities</li>
              <li>Generate AI-powered career recommendations</li>
              <li>Send you service updates and notifications</li>
              <li>Respond to your requests and support inquiries</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>3. Information Sharing</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              <strong style={{ color: 'var(--color-txt)' }}>We never sell your personal information.</strong> We may share your information only in these limited circumstances:
            </p>
            <ul style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, paddingLeft: 24 }}>
              <li><strong style={{ color: 'var(--color-txt)' }}>With your consent:</strong> When you apply to jobs, we share your resume with employers</li>
              <li><strong style={{ color: 'var(--color-txt)' }}>Service providers:</strong> Third-party vendors who help us operate our platform (hosting, analytics, payment processing)</li>
              <li><strong style={{ color: 'var(--color-txt)' }}>Legal requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>4. Data Security</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>5. Your Rights</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              You have the right to:
            </p>
            <ul style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, paddingLeft: 24 }}>
              <li>Access and download your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Request data portability</li>
            </ul>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>6. Cookies</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content. You can control cookies through your browser settings.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>7. Children's Privacy</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              Our services are not intended for children under 13. We do not knowingly collect information from children under 13.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>8. Changes to This Policy</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              We may update this privacy policy from time to time. We will notify you of significant changes via email or through our platform.
            </p>
          </div>

          <div style={{ padding: 20, borderRadius: 12, background: 'var(--color-bg2)', border: '1px solid var(--color-bdr)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>Contact Us</h3>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              If you have questions about this privacy policy or our data practices, please contact us at:
            </p>
            <p style={{ fontSize: '.9rem', color: 'var(--color-blu2)', marginTop: 8 }}>
              📧 privacy@studentsai.in
            </p>
          </div>

        </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
