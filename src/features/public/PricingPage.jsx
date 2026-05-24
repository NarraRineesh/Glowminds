import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAppStore from '@/store/authStore'
import useUpgradePro from '@/hooks/useUpgradePro'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import { pageUrl } from '@/config/site'
import PublicFaqItem from '@/features/public/components/PublicFaqItem'
import { fadeUp, motionEase, staggerFast } from '@/features/public/motionVariants'
import { DEFAULT_LANDING_CONTENT } from '@/data/landingDefaults'
import '@/styles/pricing.css'

const {
  pricing,
  pricingComparison,
  pricingFaqs,
  freeFeatures,
  proFeatures,
} = DEFAULT_LANDING_CONTENT

export default function PricingPage() {
  const navigate = useNavigate()
  const { loggedIn } = useAppStore()
  const { startUpgrade, loading } = useUpgradePro()
  const [openFaq, setOpenFaq] = useState(null)

  // Calculate monthly price from yearly price
  const getMonthlyPrice = () => {
    const priceStr = pricing?.pro?.price || '₹399'
    const numericPrice = parseInt(priceStr.replace(/[^\d]/g, ''), 10)
    const monthlyPrice = Math.round(numericPrice / 12)
    return `₹${monthlyPrice}/month`
  }

  const handleSubscribe = () => startUpgrade({ plan: 'yearly' })

  return (
    <div className="pp">
      <SEO
        title="Pricing"
        path="/pricing"
        description="Glowminds Pro — AI Resume Builder, Career Coach, Interview Prep, and more. Just ₹399/year (₹33/month). Affordable plans built for Indian students and freshers."
        keywords="AI career platform pricing, student career tools pricing, resume builder price, career coach cost, interview prep pricing, affordable career tools India, student job platform pricing"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Offer",
          "name": "Glowminds Pro Plan",
          "price": "399",
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock",
          "url": pageUrl('/pricing'),
          "seller": {
            "@type": "Organization",
            "name": "Glowminds AI"
          }
        }}
      />

      {/* ===== HERO ===== */}
      <section className="pp-hero">
        <div className="pp-hero-mesh" />
        <div className="pp-hero-grid" />
        <div className="pp-hero-orb pp-hero-orb--1" />
        <div className="pp-hero-orb pp-hero-orb--2" />

        <div className="pp-hero-content">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: motionEase }}>
            <span className="pp-eyebrow">Simple, Transparent Pricing</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: motionEase, delay: .1 }}>
            One Plan. <span className="pp-grad">Everything Included.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: motionEase, delay: .2 }}>
            Unlimited access to AI-powered career tools. Built for students, priced for students. Just ₹33/month.
          </motion.p>
        </div>
      </section>

      {/* ===== PRICING CARDS ===== */}
      <section className="pp-cards">
        <motion.div variants={staggerFast} initial="hidden" animate="visible" style={{ display: 'contents' }}>

          {/* Free Plan */}
          <motion.div variants={fadeUp} transition={{ duration: .55, ease: motionEase }} className="pp-card">
            <div className="pp-card-glow" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(75,85,99,.06), transparent 70%)' }} />
            <div className="pp-plan-label" style={{ color: 'var(--color-muted)' }}>Free</div>
            <div className="pp-price">
              <span className="pp-price-val">{pricing?.free?.price || '₹0'}</span>
              <span className="pp-price-period">{pricing?.free?.period || '/forever'}</span>
            </div>
            <p className="pp-card-desc">Get started with core tools. No credit card needed.</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
              className="pp-btn pp-btn--outline"
              onClick={() => navigate(loggedIn ? '/dashboard' : '/signup')}>
              {loggedIn ? 'Go to Dashboard' : 'Start Free'}
            </motion.button>
            <div className="pp-features">
              {freeFeatures.map((f, i) => (
                <div key={i} className={`pp-feat ${!f.included ? 'pp-feat--disabled' : ''}`}>
                  <span className={`pp-feat-icon ${f.included ? 'pp-feat-icon--yes' : 'pp-feat-icon--no'}`}>
                    {f.included ? '✓' : '—'}
                  </span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div variants={fadeUp} transition={{ duration: .55, ease: motionEase }} className="pp-card pp-card--pro">
            <div className="pp-card-glow" style={{ background: 'radial-gradient(ellipse at 70% 20%, rgba(56,139,253,.08), transparent 70%)' }} />
            <div className="pp-popular">MOST POPULAR</div>
            <div className="pp-plan-label" style={{ color: 'var(--color-blu2)' }}>Pro</div>
            <div className="pp-price">
              <span className="pp-price-val" style={{ color: 'var(--color-txt)' }}>{pricing?.pro?.price || '₹399'}</span>
              <span className="pp-price-period">{pricing?.pro?.period || '/year'}</span>
            </div>
            <div className="pp-price-sub">That's just {getMonthlyPrice()} — less than a cup of coffee</div>
            <div className="pp-price-save">Save 32% vs monthly</div>
            <p className="pp-card-desc">Unlimited access to all AI-powered career tools for 12 months.</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
              className="pp-btn pp-btn--primary"
              disabled={loading}
              onClick={handleSubscribe}>
              {loading ? 'Processing...' : `Get Pro — ${pricing?.pro?.price || '₹399'}${pricing?.pro?.period || '/year'}`}
            </motion.button>
            <div className="pp-features">
              {proFeatures.map((f, i) => (
                <div key={i} className="pp-feat">
                  <span className="pp-feat-icon pp-feat-icon--yes">✓</span>
                  <span style={{ fontWeight: f.highlight ? 700 : 500, color: f.highlight ? 'var(--color-txt)' : undefined }}>{f.text}</span>
                  {f.highlight && <span style={{ fontSize: '.58rem', fontWeight: 800, padding: '2px 7px', borderRadius: 100, background: 'var(--color-blu3)', color: 'var(--color-blu2)', marginLeft: 'auto' }}>NEW</span>}
                </div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </section>

      <div className="pp-divider" />

      {/* ===== COMPARISON TABLE ===== */}
      <section className="pp-compare">
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .6, ease: motionEase }} className="pp-compare-head">
          <div className="pp-section-badge" style={{ background: 'var(--color-blu3)', border: '1px solid rgba(56,139,253,.2)', color: 'var(--color-blu2)' }}>Compare Plans</div>
          <h2>Feature <span className="pp-grad">Comparison</span></h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .5, ease: motionEase }} className="pp-table-wrap">
          <div className="pp-table-header">
            <span className="pp-table-th">Feature</span>
            <span className="pp-table-th">Free</span>
            <span className="pp-table-th pp-table-th--pro">Pro</span>
          </div>
          {pricingComparison.map((row, i) => (
            <div key={i} className="pp-table-row">
              <span className="pp-table-cell pp-table-cell--feature">{row.feature}</span>
              <span className="pp-table-cell" style={{ color: row.free === '—' ? 'var(--color-muted)' : 'var(--color-txt2)' }}>{row.free}</span>
              <span className="pp-table-cell" style={{ color: 'var(--color-blu2)' }}>{row.pro}</span>
            </div>
          ))}
        </motion.div>
      </section>

      <div className="pp-divider" />

      {/* ===== TRUST BADGES ===== */}
      <section className="pp-trust">
        {[
          { ico: '🔒', title: 'Secure Payments', desc: 'Encrypted via Razorpay. UPI, cards, wallets accepted.' },
          { ico: '⚡', title: 'Instant Activation', desc: 'Pro features unlock the moment your payment is confirmed.' },
          { ico: '🔄', title: 'Cancel Anytime', desc: 'No lock-in. Cancel from your dashboard. Access until period ends.' },
        ].map((t, i) => (
          <div key={i} className="pp-trust-card">
            <div className="pp-trust-ico">{t.ico}</div>
            <div className="pp-trust-title">{t.title}</div>
            <div className="pp-trust-desc">{t.desc}</div>
          </div>
        ))}
      </section>

      <div className="pp-divider" />

      {/* ===== FAQ ===== */}
      <section className="pp-faq">
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .6, ease: motionEase }} className="pp-faq-head">
          <div className="pp-section-badge" style={{ background: 'var(--color-gold2)', border: '1px solid rgba(210,153,34,.2)', color: 'var(--color-gold)' }}>FAQ</div>
          <h2>Frequently Asked <span className="pp-grad">Questions</span></h2>
        </motion.div>

        <motion.div variants={staggerFast} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
          {pricingFaqs.map((f, i) => (
            <motion.div key={i} variants={fadeUp} transition={{ duration: .4, ease: motionEase }}>
              <PublicFaqItem
                q={f.q}
                a={f.a}
                index={i}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                variant="pricing"
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== CTA ===== */}
      <motion.div initial={{ opacity: 0, scale: .96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: .6, ease: motionEase }} className="pp-cta">
        <div className="pp-cta-mesh" />
        <h2>Ready to Go Pro?</h2>
        <p>Join thousands of students landing their dream jobs with Glowminds Pro.</p>
        <div className="pp-cta-btns">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }}
            className="pp-cta-btn pp-cta-btn--primary"
            disabled={loading}
            onClick={handleSubscribe}>
            {loading ? 'Processing...' : `Get Pro — ${pricing?.pro?.price || '₹399'}${pricing?.pro?.period || '/year'}`}
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }}
            className="pp-cta-btn pp-cta-btn--secondary"
            onClick={() => navigate(loggedIn ? '/dashboard' : '/signup')}>
            Start Free
          </motion.button>
        </div>
        <p className="pp-cta-sub">Cancel anytime · Free tier available forever</p>
      </motion.div>

      <Footer />
    </div>
  )
}
