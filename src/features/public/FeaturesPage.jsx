import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import { pageUrl } from '@/config/site'
import { fadeUp, motionEase, staggerFast } from '@/features/public/motionVariants'
import '@/styles/features.css'

const MORE_FEATURES = [
  { ico: '🔔', bg: 'var(--color-prp2)', title: 'Real-time Job Alerts', desc: 'Instant push + email alerts the moment a high-match job drops. Be first in line, every time.' },
  { ico: '⚡', bg: 'var(--color-red2)', title: '1-Click Apply', desc: 'Your profile auto-fills every form. One click, details go straight to the recruiter.' },
  { ico: '✉️', bg: 'var(--color-blu3)', title: 'Cover Letter AI', desc: 'AI reads the JD, pulls your achievements, and generates a tailored cover letter in seconds.' },
  { ico: '💰', bg: 'var(--color-gold2)', title: 'Salary Insights', desc: 'Real market-rate salary data for your target role, city, and experience level.' },
  { ico: '📈', bg: 'var(--color-grn2)', title: 'Career Analytics', desc: 'Track response rates, interview conversion, and time-to-offer with visual dashboards.' },
  { ico: '🛡️', bg: 'var(--color-prp2)', title: 'Privacy & Security', desc: 'End-to-end encryption, zero data selling, and full control to export or delete anytime.' },
  { ico: '🌐', bg: 'var(--color-blu3)', title: 'Multi-Portal Sync', desc: 'One profile syncs across 50+ job portals. Update once, apply everywhere.' },
  { ico: '🧠', bg: 'var(--color-gold2)', title: 'Skill Gap Analysis', desc: 'AI identifies missing skills for your dream role and recommends courses to bridge the gap.' },
]

const STEPS = [
  { n: '01', t: 'Create Profile', d: 'Sign up in 30 seconds. Add skills, education, and preferences.', color: 'var(--color-blu2)' },
  { n: '02', t: 'Build Resume', d: 'AI generates an ATS-optimized resume with live preview.', color: 'var(--color-grn)' },
  { n: '03', t: 'Get Matched', d: '50+ portals scanned. Jobs ranked by your match score.', color: 'var(--color-gold)' },
  { n: '04', t: 'Land Offers', d: 'One-click apply, AI interview prep, Kanban tracking.', color: 'var(--color-prp)' },
]

const PREVIEW_JOBS = [
  { logo: '🔍', bg: '#dbeafe', title: 'Software Intern — Python', co: 'Google · Hyderabad', score: '96%', scoreColor: 'var(--color-grn)', scoreBg: 'var(--color-grn2)' },
  { logo: '🍔', bg: '#dcfce7', title: 'Frontend Developer', co: 'Swiggy · Bangalore', score: '91%', scoreColor: 'var(--color-grn)', scoreBg: 'var(--color-grn2)' },
  { logo: '💳', bg: '#ede9fe', title: 'Full Stack Engineer', co: 'Razorpay · Remote', score: '85%', scoreColor: 'var(--color-blu2)', scoreBg: 'var(--color-blu3)' },
]

export default function FeaturesPage() {
  const navigate = useNavigate()

  return (
    <div className="fp">
      <SEO 
        title="Features" 
        path="/features"
        description="Explore 15+ AI-powered career tools: AI Resume Builder, Smart Job Matching across 50+ portals, AI Career Coach, Interview Prep, Application Tracker, Cover Letter Generator, and more."
        keywords="AI resume builder features, smart job matching, AI career coach, interview prep features, application tracker, cover letter generator, career tools"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Glowminds AI Features",
          "description": "Explore 15+ AI-powered career tools for students and job seekers",
          "url": pageUrl('/features')
        }}
      />

      {/* ===== HERO ===== */}
      <section className="fp-hero">
        <div className="fp-hero-mesh" />
        <div className="fp-hero-grid" />
        <div className="fp-hero-orb fp-hero-orb--1" />
        <div className="fp-hero-orb fp-hero-orb--2" />
        <div className="fp-hero-orb fp-hero-orb--3" />

        <div className="fp-hero-content">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: motionEase }}>
            <span className="fp-eyebrow"><span className="fp-eyebrow-dot" /> Platform Features</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: motionEase, delay: .1 }}>
            Everything You Need to <span className="fp-hero-grad">Land Your Dream Job</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: motionEase, delay: .2 }}>
            From resume to offer letter — AI-powered tools that cover the full career journey for students and fresh graduates.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: motionEase, delay: .3 }} className="flex flex-wrap justify-center gap-3">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }} className="fp-btn fp-btn--primary" onClick={() => navigate('/signup')}>Get Started Free</motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }} className="fp-btn fp-btn--secondary" onClick={() => navigate('/pricing')}>View Pricing</motion.button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .6, delay: .5 }} className="fp-hero-stats">
            {[['12K+','Daily Jobs'],['94%','Match Rate'],['52K+','Students'],['4.9★','Rating']].map(([v,l]) => (
              <div className="fp-hero-stat" key={l}>
                <strong>{v}</strong>
                <span>{l}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FLAGSHIP BENTO GRID ===== */}
      <section className="fp-section">
        <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .6, ease: motionEase }} className="fp-section-head">
          <div className="fp-badge" style={{ background: 'var(--color-blu3)', border: '1px solid rgba(56,139,253,.2)', color: 'var(--color-blu2)' }}>Core Features</div>
          <h2>Powerful Tools, <span className="fp-hero-grad">One Platform</span></h2>
          <p>Every feature is designed to eliminate friction from your job search and maximize your chances.</p>
        </motion.div>

        <motion.div variants={staggerFast} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="fp-bento">

          {/* Card 1: AI Resume Builder (hero size) */}
          <motion.div variants={fadeUp} transition={{ duration: .55, ease: motionEase }} className="fp-card fp-card--hero">
            <div className="fp-card-glow" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(56,139,253,.08), transparent 70%)' }} />
            <div className="fp-card-body">
              <div className="fp-card-ico" style={{ background: 'var(--color-blu3)' }}>📄</div>
              <h3>AI Resume Builder</h3>
              <p>Answer a few questions about your education, skills, and experience — our AI crafts a polished, ATS-optimized PDF resume in under 2 minutes. Multiple professional templates with live preview.</p>
              <div className="fp-checks">
                {['6 Pro Templates','ATS Score Checker','Live Preview','PDF Export','AI Keywords','Drag & Drop Sections'].map(c => (
                  <div className="fp-check" key={c}><span className="fp-check-icon">✓</span>{c}</div>
                ))}
              </div>
              <div className="fp-tags">
                <span className="fp-tag" style={{ background: 'var(--color-blu3)', color: 'var(--color-blu2)' }}>Pro Feature</span>
                <span className="fp-tag" style={{ background: 'var(--color-grn2)', color: 'var(--color-grn)' }}>Most Popular</span>
              </div>
              <div className="fp-preview">
                <div className="fp-preview-bar">
                  <span className="fp-preview-label">ATS Score</span>
                  <span className="fp-preview-val" style={{ color: 'var(--color-grn)' }}>96/100</span>
                </div>
                <div className="fp-progress-track">
                  <div className="fp-progress-fill" style={{ width: '96%' }} />
                </div>
                <div className="fp-preview-metrics">
                  <div className="fp-preview-metric"><span>Keywords</span><strong style={{ color: 'var(--color-grn)' }}>14/15</strong></div>
                  <div className="fp-preview-metric"><span>Format</span><strong style={{ color: 'var(--color-grn)' }}>Perfect</strong></div>
                  <div className="fp-preview-metric"><span>Length</span><strong style={{ color: 'var(--color-blu2)' }}>1 Page</strong></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Smart Job Matching (side) */}
          <motion.div variants={fadeUp} transition={{ duration: .55, ease: motionEase }} className="fp-card fp-card--side">
            <div className="fp-card-glow" style={{ background: 'radial-gradient(ellipse at 70% 20%, rgba(63,185,80,.08), transparent 70%)' }} />
            <div className="fp-card-body">
              <div className="fp-card-ico" style={{ background: 'var(--color-grn2)' }}>🎯</div>
              <h3>Smart Job Matching</h3>
              <p>AI scans 50+ portals daily and ranks every job by how well it fits your skills, role, and location preferences.</p>
              <div className="fp-tags">
                <span className="fp-tag" style={{ background: 'var(--color-grn2)', color: 'var(--color-grn)' }}>94% Accuracy</span>
                <span className="fp-tag" style={{ background: 'var(--color-blu3)', color: 'var(--color-blu2)' }}>Free Tier</span>
              </div>
              <div className="fp-jobs-preview">
                {PREVIEW_JOBS.map(j => (
                  <div className="fp-job-row" key={j.title}>
                    <div className="fp-job-logo" style={{ background: j.bg }}>{j.logo}</div>
                    <div className="fp-job-info">
                      <div className="fp-job-title">{j.title}</div>
                      <div className="fp-job-meta">{j.co}</div>
                    </div>
                    <span className="fp-job-score" style={{ color: j.scoreColor, background: j.scoreBg }}>{j.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 3: AI Career Coach */}
          <motion.div variants={fadeUp} transition={{ duration: .55, ease: motionEase }} className="fp-card fp-card--side">
            <div className="fp-card-glow" style={{ background: 'radial-gradient(ellipse at 30% 80%, rgba(210,153,34,.08), transparent 70%)' }} />
            <div className="fp-card-body">
              <div className="fp-card-ico" style={{ background: 'var(--color-gold2)' }}>🤖</div>
              <h3>AI Career Coach</h3>
              <p>A senior mentor available 24/7. Resume tips, interview prep, salary negotiation — expert-level, personalised answers instantly.</p>
              <div className="fp-tags">
                <span className="fp-tag" style={{ background: 'var(--color-gold2)', color: 'var(--color-gold)' }}>Gemini Powered</span>
                <span className="fp-tag" style={{ background: 'var(--color-prp2)', color: 'var(--color-prp)' }}>STAR Method</span>
              </div>
              <div className="fp-chat-preview">
                <div className="fp-chat-header">
                  <div className="fp-chat-avatar">🤖</div>
                  <div>
                    <div className="fp-chat-name">Glowminds Coach</div>
                    <div className="fp-chat-status">Online</div>
                  </div>
                </div>
                <div className="fp-chat-messages">
                  <div className="fp-chat-bubble fp-chat-bubble--user">How do I answer "Tell me about yourself"?</div>
                  <div className="fp-chat-bubble fp-chat-bubble--ai">Use a <strong>Present-Past-Future</strong> formula: start with your current role/studies, highlight relevant achievements, then connect to why this role excites you...</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Application Tracker (hero size) */}
          <motion.div variants={fadeUp} transition={{ duration: .55, ease: motionEase }} className="fp-card fp-card--hero">
            <div className="fp-card-glow" style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(248,117,186,.06), transparent 70%)' }} />
            <div className="fp-card-body">
              <div className="fp-card-ico" style={{ background: 'rgba(248,117,186,.1)' }}>📊</div>
              <h3>Kanban Application Tracker</h3>
              <p>Manage your entire job hunt visually. A drag-and-drop board organises every application into stages — see your full pipeline at a glance.</p>
              <div className="fp-checks">
                {['Drag & Drop Board','Status Tracking','Notes & Deadlines','Visual Pipeline','Export History','Auto-Sync'].map(c => (
                  <div className="fp-check" key={c}><span className="fp-check-icon">✓</span>{c}</div>
                ))}
              </div>
              <div className="fp-kanban-cols">
                {[
                  { l: 'Applied', v: '12', c: 'var(--color-blu2)' },
                  { l: 'Review', v: '8', c: 'var(--color-gold)' },
                  { l: 'Interview', v: '5', c: 'var(--color-prp)' },
                  { l: 'Offered', v: '3', c: 'var(--color-grn)' },
                ].map(k => (
                  <div className="fp-kanban-col" key={k.l}>
                    <div className="fp-kanban-col-label">{k.l}</div>
                    <div className="fp-kanban-col-val" style={{ color: k.c }}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 5: Mock Interviews — Full Width Showcase */}
          <motion.div variants={fadeUp} transition={{ duration: .55, ease: motionEase }} className="fp-card fp-card--full">
            <div className="fp-card-glow" style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(188,140,255,.08), transparent 60%), radial-gradient(ellipse at 80% 60%, rgba(63,185,80,.06), transparent 60%)' }} />
            <div className="fp-card-body fp-interview-layout">
              {/* Left: Info */}
              <div className="fp-interview-info">
                <div className="fp-card-ico" style={{ background: 'var(--color-prp2)' }}>🎤</div>
                <h3>AI Mock Interviews</h3>
                <p>Practice with an AI interviewer that adapts to your target role. Get scored on content, structure, and delivery — with actionable feedback after every answer.</p>
                <div className="fp-checks">
                  {['Technical Questions','Behavioral (STAR)','HR & Culture Fit','Real-time Scoring','Detailed Feedback','Sample Answers'].map(c => (
                    <div className="fp-check" key={c}><span className="fp-check-icon">✓</span>{c}</div>
                  ))}
                </div>
                <div className="fp-tags">
                  <span className="fp-tag" style={{ background: 'var(--color-prp2)', color: 'var(--color-prp)' }}>AI Evaluator</span>
                  <span className="fp-tag" style={{ background: 'var(--color-grn2)', color: 'var(--color-grn)' }}>12 Roles</span>
                  <span className="fp-tag" style={{ background: 'var(--color-blu3)', color: 'var(--color-blu2)' }}>Pro Feature</span>
                </div>
              </div>

              {/* Right: Interview Simulation Preview */}
              <div className="fp-interview-preview">
                {/* Question Card */}
                <div className="fp-iv-question">
                  <div className="fp-iv-question-header">
                    <span className="fp-iv-badge" style={{ background: 'var(--color-prp2)', color: 'var(--color-prp)' }}>Technical</span>
                    <span className="fp-iv-badge" style={{ background: 'var(--color-gold2)', color: 'var(--color-gold)' }}>Medium</span>
                    <span className="fp-iv-q-num">Q3 of 5</span>
                  </div>
                  <p className="fp-iv-q-text">"Explain the difference between useEffect and useLayoutEffect in React. When would you use each?"</p>
                  <div className="fp-iv-answer-hint">
                    <span style={{ color: 'var(--color-grn)', fontSize: '.7rem', fontWeight: 700 }}>Tip:</span>
                    <span style={{ color: 'var(--color-txt2)', fontSize: '.72rem' }}>Focus on timing of execution and use cases</span>
                  </div>
                </div>

                {/* Score Summary */}
                <div className="fp-iv-scores">
                  {[
                    { label: 'Overall', score: 8.7, pct: .87, color: 'var(--color-grn)' },
                    { label: 'Content', score: 9.1, pct: .91, color: 'var(--color-blu2)' },
                    { label: 'Structure', score: 8.2, pct: .82, color: 'var(--color-gold)' },
                  ].map(s => (
                    <div className="fp-iv-score-item" key={s.label}>
                      <div className="fp-ring">
                        <svg viewBox="0 0 64 64">
                          <circle className="fp-ring-bg" cx="32" cy="32" r="28" />
                          <circle className="fp-ring-fill" cx="32" cy="32" r="28" style={{ stroke: s.color, strokeDashoffset: 176 * (1 - s.pct) }} />
                        </svg>
                        <div className="fp-ring-val" style={{ color: s.color }}>{s.score}</div>
                      </div>
                      <span className="fp-iv-score-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Session Stats */}
                <div className="fp-iv-session">
                  {[
                    { label: 'Role', val: 'React Dev', c: 'var(--color-blu2)' },
                    { label: 'Questions', val: '5', c: 'var(--color-prp)' },
                    { label: 'Avg Score', val: '8.7/10', c: 'var(--color-grn)' },
                    { label: 'Duration', val: '18 min', c: 'var(--color-gold)' },
                  ].map(s => (
                    <div className="fp-iv-stat" key={s.label}>
                      <span className="fp-iv-stat-label">{s.label}</span>
                      <strong style={{ color: s.c }}>{s.val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
        </div>
      </section>

      <div className="fp-divider" />

      {/* ===== MORE FEATURES ===== */}
      <section className="fp-section">
        <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .6, ease: motionEase }} className="fp-section-head">
          <div className="fp-badge" style={{ background: 'var(--color-grn2)', border: '1px solid rgba(63,185,80,.2)', color: 'var(--color-grn)' }}>Full Toolkit</div>
          <h2>And <span className="fp-hero-grad">So Much More</span></h2>
          <p>Beyond the core, Glowminds packs a full toolkit designed to give you an unfair advantage.</p>
        </motion.div>

        <motion.div variants={staggerFast} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="fp-more-grid">
          {MORE_FEATURES.map(f => (
            <motion.div key={f.title} variants={fadeUp} transition={{ duration: .45, ease: motionEase }} className="fp-mini">
              <div className="fp-mini-ico" style={{ background: f.bg }}>{f.ico}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
        </div>
      </section>

      <div className="fp-divider" />

      {/* ===== HOW IT WORKS ===== */}
      <section className="fp-section">
        <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .6, ease: motionEase }} className="fp-section-head">
          <div className="fp-badge" style={{ background: 'var(--color-gold2)', border: '1px solid rgba(210,153,34,.2)', color: 'var(--color-gold)' }}>How It Works</div>
          <h2>From Zero to <span className="fp-hero-grad">Offer Letter</span></h2>
          <p>Four simple steps. No experience needed.</p>
        </motion.div>

        <motion.div variants={staggerFast} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="fp-workflow">
          {STEPS.map(s => (
            <motion.div key={s.n} variants={fadeUp} transition={{ duration: .5, ease: motionEase }} className="fp-step">
              <div className="fp-step-num" style={{ color: s.color }}>{s.n}</div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </motion.div>
          ))}
        </motion.div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="fp-section">
        <div className="page-container">
        <motion.div initial={{ opacity: 0, scale: .96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: .6, ease: motionEase }} className="fp-cta">
          <div className="fp-cta-mesh" />
          <h2>Ready to Experience the Difference?</h2>
          <p>Start free, go Pro for just ₹49/mo. No credit card required.</p>
          <div className="fp-cta-btns">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }} className="fp-btn fp-btn--primary" onClick={() => navigate('/signup')}>Get Started Free</motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }} className="fp-btn fp-btn--secondary" onClick={() => navigate('/pricing')}>View Pricing</motion.button>
          </div>
          <p className="fp-cta-sub">Cancel anytime · Free forever tier available</p>
        </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
