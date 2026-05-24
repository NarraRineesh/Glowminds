import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import { SITE_URL } from '@/config/site'
import PublicFaqItem from '@/features/public/components/PublicFaqItem'
import { fadeUp, motionEase, stagger } from '@/features/public/motionVariants'
import { DEFAULT_LANDING_CONTENT } from '@/data/landingDefaults'
import '@/styles/landing-v2.css'
import '@/styles/landing.css'

const {
  companies,
  features,
  steps,
  tools,
  testimonials,
  trustLogos,
  faqs,
  stats,
  pricing,
} = DEFAULT_LANDING_CONTENT

export default function LandingPage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="lp">
      <SEO 
        path="/" 
        title="AI Career Platform for Students & Job Seekers"
        description="15+ AI-powered tools for students and job seekers in India. Build ATS-optimized resumes, get matched to 12,400+ daily jobs, practice AI interviews, check grammar, generate cover letters. Free tier available."
        keywords="AI resume builder, job search India, student career platform, AI interview prep, fresher jobs, internship finder, career coach AI, cover letter generator, grammar checker, job application tracker, Glowminds"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Glowminds AI",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "52000"
          },
          "description": "AI-powered career platform for students with resume builder, job matching, interview prep, and 15+ career tools",
          "author": {
            "@type": "Organization",
            "name": "Glowminds AI",
            "url": SITE_URL
          }
        }}
      />

      {/* ===== HERO ===== */}
      <section className="min-h-screen flex items-center px-4 md:px-12 pt-20 pb-16 relative overflow-hidden">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-particles">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="relative z-10 max-w-[1100px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="text-center md:text-left">
            <motion.div variants={fadeUp} transition={{ duration: .6, ease: motionEase }} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-grn2)] border border-[var(--color-grn)]/20 text-[var(--color-grn)] text-xs font-bold tracking-wide mb-4">
              <span className="live-dot" /> LIVE · {stats?.dailyJobs || '12,400+'} jobs posted today
            </motion.div>
            <motion.h1 variants={fadeUp} transition={{ duration: .7, ease: motionEase }} className="text-[clamp(2rem,4.5vw,3.4rem)] font-black leading-tight tracking-tight mb-4">
              Your Career Starts<br /><span className="grad-txt">Right Here</span>
            </motion.h1>
            <motion.p variants={fadeUp} transition={{ duration: .7, ease: motionEase }} className="text-[clamp(0.88rem,1.6vw,1rem)] text-[var(--color-txt2)] leading-relaxed mb-7">
              Build a beautiful resume in minutes, get AI-matched to jobs across 50+ portals, and apply with one click — built for students and fresh graduates.
            </motion.p>
            <motion.div variants={fadeUp} transition={{ duration: .6, ease: motionEase }} className="flex gap-2.5 flex-wrap mb-9">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-p btn-glow text-sm px-6 py-3" onClick={() => navigate('/signup')}>
                🚀 Get Started Now
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-o text-sm px-6 py-3" onClick={() => navigate('/features')}>
                ✦ Explore Features
              </motion.button>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: .6, ease: motionEase }} className="flex gap-7 flex-wrap">
              <div className="flex flex-col"><strong className="text-2xl font-black font-mono bg-gradient-to-r from-[var(--color-blu2)] to-[var(--color-grn)] bg-clip-text text-transparent">{stats?.students || '52K+'}</strong><span className="text-xs text-[var(--color-muted)]">Students</span></div>
              <div className="flex flex-col"><strong className="text-2xl font-black font-mono bg-gradient-to-r from-[var(--color-blu2)] to-[var(--color-grn)] bg-clip-text text-transparent">{stats?.dailyJobs || '12K+'}</strong><span className="text-xs text-[var(--color-muted)]">Daily Jobs</span></div>
              <div className="flex flex-col"><strong className="text-2xl font-black font-mono bg-gradient-to-r from-[var(--color-blu2)] to-[var(--color-grn)] bg-clip-text text-transparent">{stats?.matchRate || '94%'}</strong><span className="text-xs text-[var(--color-muted)]">Match Rate</span></div>
              <div className="flex flex-col"><strong className="text-2xl font-black font-mono bg-gradient-to-r from-[var(--color-blu2)] to-[var(--color-grn)] bg-clip-text text-transparent">{stats?.rating || '4.9★'}</strong><span className="text-xs text-[var(--color-muted)]">Rating</span></div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: .8, ease: motionEase }}
            className="relative order-1 md:order-2"
          >
            <div className="bg-[var(--color-surf)] border border-[var(--color-bdr2)] rounded-2xl p-4.5 shadow-2xl relative">
              <div className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wide mb-3">
                🎯 Top Matches for You
              </div>
              <div className="flex items-center gap-2.5 p-2.5 bg-[var(--color-surf2)] rounded-xl mb-2 transition-transform hover:translate-x-1">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 bg-blue-100">🔍</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--color-txt)] mb-0.5">Software Intern — Python</div>
                  <div className="text-xs text-[var(--color-muted)]">Google · Hyderabad</div>
                </div>
                <div className="text-xs font-extrabold text-[var(--color-grn)] bg-[var(--color-grn2)] px-2 py-1 rounded-md flex-shrink-0">96%</div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 bg-[var(--color-surf2)] rounded-xl mb-2 transition-transform hover:translate-x-1">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 bg-green-100">🍔</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--color-txt)] mb-0.5">Frontend Developer</div>
                  <div className="text-xs text-[var(--color-muted)]">Swiggy · Bangalore</div>
                </div>
                <div className="text-xs font-extrabold text-[var(--color-grn)] bg-[var(--color-grn2)] px-2 py-1 rounded-md flex-shrink-0">91%</div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 bg-[var(--color-surf2)] rounded-xl mb-2 transition-transform hover:translate-x-1">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 bg-purple-100">💳</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--color-txt)] mb-0.5">Full Stack Engineer</div>
                  <div className="text-xs text-[var(--color-muted)]">Razorpay · Remote</div>
                </div>
                <div className="text-xs font-extrabold text-[var(--color-grn)] bg-[var(--color-grn2)] px-2 py-1 rounded-md flex-shrink-0">85%</div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 bg-[var(--color-surf2)] rounded-xl mb-2 transition-transform hover:translate-x-1">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 bg-yellow-100">📦</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--color-txt)] mb-0.5">Data Analyst Trainee</div>
                  <div className="text-xs text-[var(--color-muted)]">Amazon · Chennai</div>
                </div>
                <div className="text-xs font-extrabold text-[var(--color-grn)] bg-[var(--color-grn2)] px-2 py-1 rounded-md flex-shrink-0">82%</div>
              </div>
            </div>
            <div className="fl-badge fb1">✅ Resume Score: <strong className="text-[var(--color-grn)]">94/100</strong></div>
            <div className="fl-badge fb2">🔔 <strong>5 new jobs</strong> match today!</div>
          </motion.div>
        </div>

        <div className="lp-scroll-cue-wrap">
          <motion.a
            href="#lp-marquee"
            aria-label="Scroll to next section"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6, ease: motionEase }}
            className="lp-scroll-cue"
          >
            <span className="lp-scroll-cue-label">Scroll</span>
            <span className="lp-scroll-cue-mouse" aria-hidden>
              <span className="lp-scroll-cue-dot" />
            </span>
          </motion.a>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <motion.section id="lp-marquee" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: .6, ease: motionEase }} className="lp-marquee-section py-6 md:py-8">
        <div className="lp-marquee-label">Trusted by students placed at top companies</div>
        <div className="lp-marquee-wrap">
          <div className="lp-marquee-track">
            {companies && [...companies, ...companies].map((c, i) => (
              <div className="lp-marquee-item" key={`${c}-${i}`}>{c}</div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== FEATURE ROWS ===== */}
      <section className="py-10 md:py-14">
        <div className="max-w-[1200px] mx-auto px-4 md:px-16">
          {features && features.map((f, idx) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .7, ease: motionEase }}
              className={`lp-feature-row${f.reverse ? ' lp-feature-row--reverse' : ''}`}>
              <div className="lp-feature-text">
                <span className="lp-feature-badge" style={{ background: f.badgeBg, color: f.badgeColor }}>{f.badge}</span>
                <h2>{f.title}</h2>
                <p>{f.desc}</p>
                <div className="lp-feature-bullets">
                  {f.bullets.map(b => (
                    <div key={b} className="lp-feature-bullet">
                      <span className="lp-feature-bullet-icon">✓</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
                {idx === 0 && (
                  <div className="lp-feature-cta">
                    <button className="btn btn-p text-sm px-6 py-3" onClick={() => navigate('/signup')}>Try Resume Builder Free</button>
                  </div>
                )}
              </div>
              <motion.div className="lp-feature-visual"
                initial={{ opacity: 0, scale: .92 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }} transition={{ duration: .6, ease: motionEase, delay: .2 }}>
                <motion.div className="lp-feature-mockup" whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }} transition={{ duration: .3 }}>
                  <div className="lp-feature-mockup-bar">
                    <div className="lp-mockup-dots"><span /><span /><span /></div>
                  </div>
                  <img src={f.image} alt={f.badge} className="lp-mockup-img" />
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-10 md:py-14 bg-[var(--color-bg2)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-16">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .6, ease: motionEase }} className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-4">From Zero to <span className="grad-txt">Offer Letter</span></h2>
            <p className="text-base md:text-lg text-[var(--color-txt2)] max-w-2xl mx-auto">Four simple steps. No experience needed. Our AI handles the heavy lifting.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="lp-steps">
            {steps && steps.map(s => (
              <motion.div key={s.num} variants={fadeUp} transition={{ duration: .5, ease: motionEase }} className="lp-step">
                <div className="lp-step-num">{s.ico}</div>
                <div className="lp-step-label">Step {s.num}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== ALL TOOLS GRID ===== */}
      <section className="py-10 md:py-14">
        <div className="max-w-[1200px] mx-auto px-4 md:px-16">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .6, ease: motionEase }} className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Expand All <span className="grad-txt">AI Tools</span></h2>
            <p className="text-base md:text-lg text-[var(--color-txt2)] max-w-2xl mx-auto">15+ AI-powered tools to cover every step of your career journey — from resume to offer letter and beyond.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="lp-tools-grid">
            {tools && tools.map(t => (
              <motion.div key={t.title} variants={fadeUp} transition={{ duration: .5, ease: motionEase }} className="lp-tool-card">
                <div className="lp-tool-ico" style={{ background: t.bg }}>{t.ico}</div>
                <h4>{t.title}</h4>
                <p>{t.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== PRICING PREVIEW ===== */}
      <section className="py-10 md:py-14 bg-[var(--color-bg2)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-16">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .6, ease: motionEase }} className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Only Pay for What You <span className="grad-txt">Actually Use</span></h2>
            <p className="text-base md:text-lg text-[var(--color-txt2)] max-w-2xl mx-auto">Start free. Upgrade when you need more power.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, ease: motionEase, delay: .15 }} className="lp-pricing-row">
            {pricing && (
              <>
                <div className="lp-pricing-card">
                  <div className="lp-pricing-label text-[var(--color-muted)]">{pricing.free.label}</div>
                  <div className="lp-pricing-price"><strong>{pricing.free.price}</strong><span>{pricing.free.period}</span></div>
                  <div className="lp-pricing-desc">{pricing.free.desc}</div>
                  <div className="lp-pricing-features">
                    {pricing.free.features.map(f => (
                      <div key={f} className="lp-pricing-feat"><span className="check">✓</span> {f}</div>
                    ))}
                  </div>
                  <button className="btn btn-o w-full justify-center" onClick={() => navigate('/signup')}>Get Started Free</button>
                </div>
                <div className="lp-pricing-card lp-pricing-card--pro">
                  <div className="lp-pricing-label text-[var(--color-blu2)]">{pricing.pro.label}</div>
                  <div className="lp-pricing-price"><strong>{pricing.pro.price}</strong><span>{pricing.pro.period}</span></div>
                  <div className="lp-pricing-desc">{pricing.pro.desc}</div>
                  <div className="lp-pricing-features">
                    {pricing.pro.features.map(f => (
                      <div key={f} className="lp-pricing-feat"><span className="check">✓</span> {f}</div>
                    ))}
                  </div>
                  <button className="btn btn-p w-full justify-center" onClick={() => navigate('/login')}>Upgrade to Pro</button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>


      {/* ===== TESTIMONIALS ===== */}
      <section className="py-10 md:py-14">
        <div className="max-w-[1200px] mx-auto px-4 md:px-16">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .6, ease: motionEase }} className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Students <span className="grad-txt">Love Us</span></h2>
            <p className="text-base md:text-lg text-[var(--color-txt2)] max-w-2xl mx-auto">Real stories from students who landed their dream jobs.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="lp-testimonials-grid">
            {testimonials && testimonials.map(t => (
              <motion.div key={t.name} variants={fadeUp} transition={{ duration: .5, ease: motionEase }} whileHover={{ y: -4 }} className="lp-testimonial">
                <div className="lp-testimonial-stars">⭐⭐⭐⭐⭐</div>
                <div className="lp-testimonial-text">"{t.text}"</div>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar">{t.avatar}</div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== TRUST LOGOS ===== */}
      <section className="py-10 md:py-14 bg-[var(--color-bg2)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-16">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .6, ease: motionEase }} className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Trusted by Top <span className="grad-txt">Educational Institutions</span></h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, ease: motionEase, delay: .1 }} className="lp-trust-grid">
            {trustLogos && trustLogos.map(l => (
              <div key={l} className="lp-trust-logo">{l}</div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-10 md:py-14">
        <div className="max-w-[1200px] mx-auto px-4 md:px-16">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .6, ease: motionEase }} className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Frequently Asked <span className="grad-txt">Questions</span></h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="max-w-3xl mx-auto flex flex-col gap-2.5">
            {faqs && faqs.map((f, i) => (
              <motion.div key={i} variants={fadeUp} transition={{ duration: .4, ease: motionEase }}>
                <PublicFaqItem
                  q={f.q}
                  a={f.a}
                  index={i}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                  variant="landing"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="pb-10 md:pb-14">
        <div className="max-w-[1200px] mx-auto px-4 md:px-16">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .6, ease: motionEase }} className="lp-cta">
            <div className="lp-cta-mesh" />
            <h2>Ready to Launch Your <span className="lp-hero-grad">Career?</span></h2>
            <p>Join 52,000+ students already using 15+ AI tools to land their dream jobs. Start free today — no credit card required.</p>
            <div className="lp-cta-btns">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-p btn-glow text-base px-8 py-3.5 rounded-2xl" onClick={() => navigate('/signup')}>
                Get Started Free
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-o text-base px-8 py-3.5 rounded-2xl bg-white/5 border-white/15 text-[#e6edf3]" onClick={() => navigate('/pricing')}>
                View Pricing
              </motion.button>
            </div>
            <div className="lp-cta-sub">No credit card required · Free forever plan · Cancel anytime</div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
