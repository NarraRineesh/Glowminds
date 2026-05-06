import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import '@/styles/landing.css'

export default function RefundPage() {
  return (
    <div>
      <SEO
        title="Refund Policy"
        path="/refund"
        description="Glowminds refund and cancellation policy. 7-day money-back guarantee on Pro plans. No questions asked refunds."
        keywords="Glowminds refund policy, cancellation policy, money-back guarantee, student platform refund, career tools refund"
      />

      {/* Hero */}
      <section style={{ padding: 'calc(60px + 40px) 0 40px', position: 'relative', overflow: 'hidden' }}>
        <div className="page-container">
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 100,
            background: 'var(--color-gold2)', border: '1px solid rgba(210,153,34,.22)', color: 'var(--color-gold)',
            fontSize: '.72rem', fontWeight: 700, letterSpacing: '.5px', marginBottom: 18 }}>💰 REFUND POLICY</div>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-.5px', marginBottom: 16 }}>
            Refund & <span className="grad-txt">Cancellation</span>
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
          
          <div style={{ marginBottom: 32, padding: 20, borderRadius: 12, background: 'var(--color-grn2)', border: '1px solid rgba(63,185,80,.2)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-grn)' }}>✓ 7-Day Money-Back Guarantee</h3>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              We offer a full refund within 7 days of purchase if you're not satisfied with Glowminds Pro. No questions asked.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>1. Refund Eligibility</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              You are eligible for a full refund if:
            </p>
            <ul style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, paddingLeft: 24 }}>
              <li>You request a refund within 7 days of your initial purchase</li>
              <li>You have not violated our Terms of Service</li>
              <li>Your account is in good standing</li>
            </ul>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>2. Non-Refundable Situations</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              Refunds will not be provided if:
            </p>
            <ul style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, paddingLeft: 24 }}>
              <li>More than 7 days have passed since purchase</li>
              <li>Your account has been suspended or terminated for policy violations</li>
              <li>You have already received a refund for a previous subscription</li>
              <li>The subscription was purchased through a third-party platform (subject to their refund policy)</li>
            </ul>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>3. How to Request a Refund</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              To request a refund:
            </p>
            <ol style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, paddingLeft: 24, marginBottom: 12 }}>
              <li>Email us at <strong style={{ color: 'var(--color-blu2)' }}>refunds@studentsai.in</strong></li>
              <li>Include your account email and order ID</li>
              <li>Briefly explain your reason for the refund (optional but helpful)</li>
            </ol>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              We typically process refund requests within 2-3 business days.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>4. Refund Processing Time</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              Once approved, refunds are processed within 5-7 business days. The refund will be credited to your original payment method. Depending on your bank or payment provider, it may take an additional 3-5 business days to reflect in your account.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>5. Subscription Cancellation</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              You can cancel your Pro subscription at any time from your dashboard:
            </p>
            <ul style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, paddingLeft: 24, marginBottom: 12 }}>
              <li>Go to Settings → Subscription</li>
              <li>Click "Cancel Subscription"</li>
              <li>Confirm cancellation</li>
            </ul>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              <strong style={{ color: 'var(--color-txt)' }}>Important:</strong> Cancelling your subscription does not automatically trigger a refund. You will retain Pro access until the end of your current billing period. To request a refund, follow the process in section 3.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>6. Free Tier</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              Our free tier is available forever with no payment required. There are no refunds for free accounts as no payment is involved.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>7. Partial Refunds</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              We do not offer partial refunds for unused portions of your subscription. If you cancel mid-cycle, you will retain access until the end of your billing period, but no prorated refund will be issued.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>8. Technical Issues</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              If you experience technical issues that prevent you from using our service, please contact support first at <strong style={{ color: 'var(--color-blu2)' }}>support@studentsai.in</strong>. We will work to resolve the issue. If we cannot resolve it within a reasonable timeframe, we may offer a refund at our discretion.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>9. Changes to This Policy</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75 }}>
              We reserve the right to modify this refund policy at any time. Changes will be posted on this page with an updated "Last updated" date. Continued use of the service after changes constitutes acceptance of the new policy.
            </p>
          </div>

          <div style={{ padding: 20, borderRadius: 12, background: 'var(--color-bg2)', border: '1px solid var(--color-bdr)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>Need Help?</h3>
            <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, marginBottom: 12 }}>
              Have questions about refunds or cancellations?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: '.9rem', color: 'var(--color-blu2)' }}>
                📧 Refunds: refunds@studentsai.in
              </p>
              <p style={{ fontSize: '.9rem', color: 'var(--color-blu2)' }}>
                💬 Support: support@studentsai.in
              </p>
            </div>
          </div>

        </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
