import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import { pageUrl } from '@/config/site'
import { fadeUp, motionEase, staggerContact } from '@/features/public/motionVariants'
import '@/styles/landing.css'

const TEAM = [
  { name: 'Narayana KNR', role: 'Founder & CEO', emoji: '👨‍💻', desc: 'Full-stack developer. 8+ years experience. Previously at Flipkart.' },
  { name: 'Priya Sharma', role: 'Head of AI', emoji: '🤖', desc: 'ML engineer. 5+ years building recommendation systems at scale.' },
  { name: 'Arjun Patel', role: 'Product Lead', emoji: '🎯', desc: 'Ex-Swiggy PM. Obsessed with delightful user experiences.' },
  { name: 'Sneha Reddy', role: 'Design Lead', emoji: '🎨', desc: 'UI/UX designer crafting beautiful, accessible interfaces.' },
]

const MISSION_HIGHLIGHTS = [
  'Bridge the gap between tier-1 and tier-2/3 colleges',
  'Replace expensive career coaches with free AI tools',
  'Make job discovery effortless and personalised',
  'Help 1 million students land jobs by 2026',
]

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div>
      <SEO 
        title="About Us" 
        path="/about"
        description="Learn about Glowminds - the AI-powered career platform helping 52,000+ Indian students land their dream jobs. Our mission is to democratize career opportunities."
        keywords="about Glowminds, AI career platform team, student career help, career democratization, Indian student jobs, Glowminds mission"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Glowminds",
          "description": "Learn about Glowminds - the AI-powered career platform helping 52,000+ students",
          "url": pageUrl('/about')
        }}
      />

      {/* Hero */}
      <section className="pt-24 pb-14 relative overflow-hidden">
        <div className="page-container">
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div className="relative z-[1] max-w-[720px] mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: motionEase }} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold tracking-wider mb-4" style={{ background: 'var(--color-blu3)', border: '1px solid rgba(56,139,253,.22)', color: 'var(--color-blu2)' }}>✦ ABOUT US</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: motionEase, delay: .1 }} className="text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
            We're Building the Future of <span className="grad-txt">Student Careers</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: motionEase, delay: .2 }} className="text-base md:text-lg leading-relaxed max-w-[560px] mx-auto" style={{ color: 'var(--color-txt2)' }}>
            Glowminds was born from a simple idea: every student deserves smart tools to launch their career, not just those from top colleges.
          </motion.p>
          </div>
        </div>
      </section>

      {/* Mission + Story */}
      <section className="pb-16">
        <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .6, ease: motionEase }} className="rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] p-7 md:p-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-4" style={{ background: 'var(--color-grn2)', border: '1px solid rgba(63,185,80,.2)', color: 'var(--color-grn)' }}>🎯 OUR MISSION</div>
            <h2 className="text-xl font-black mb-3">Democratize Career Opportunities</h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-txt2)' }}>We believe a student's potential shouldn't be limited by their college tier or network. Glowminds levels the playing field with AI-powered tools that give every student access to professional-grade career resources.</p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-txt2)' }}>Our goal is ambitious but simple: <strong style={{ color: 'var(--color-txt)' }}>ensure no talented student gets left behind</strong> because they didn't know how to write a resume, couldn't find the right job listing, or lacked the confidence to ace an interview.</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {MISSION_HIGHLIGHTS.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5"><span className="text-base mt-0.5" style={{ color: 'var(--color-grn)' }}>✓</span><span className="text-sm leading-relaxed" style={{ color: 'var(--color-txt2)' }}>{h}</span></div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {[['Equal Access','var(--color-blu3)','var(--color-blu2)'],['AI-First','var(--color-grn2)','var(--color-grn)'],['Student-Priced','var(--color-gold2)','var(--color-gold)'],['Privacy First','var(--color-prp2)','var(--color-prp)']].map(([t,bg,c]) => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-md font-semibold" style={{ background: bg, color: c }}>{t}</span>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .6, ease: motionEase, delay: .1 }} className="rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] p-7 md:p-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-4" style={{ background: 'var(--color-blu3)', border: '1px solid rgba(56,139,253,.2)', color: 'var(--color-blu2)' }}>📖 OUR STORY</div>
            <h2 className="text-xl font-black mb-3">Born from Frustration</h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-txt2)' }}>In 2024, our founding team — all first-generation graduates from small-town colleges — noticed a painful pattern: talented students from tier-2 and tier-3 colleges were missing out on great opportunities simply because they lacked the right tools and guidance.</p>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-txt2)' }}>Job portals were overwhelming. Resume builders were generic. Career advice was locked behind expensive paywalls or campus placement cells that only served the top 10%.</p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-txt2)' }}>We asked ourselves: <strong style={{ color: 'var(--color-txt)' }}>What if AI could be the great equaliser?</strong> That question became Glowminds. Today, we serve <strong style={{ color: 'var(--color-txt)' }}>52,000+ students</strong> across India.</p>
            <div className="flex items-center gap-4 rounded-xl p-4" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-bdr)' }}>
              {[['52K+','Students'],['12K+','Daily Jobs'],['94%','Match Rate'],['500+','Companies']].map(([v,l],i,a) => (
                <div key={l} className="flex items-center gap-4">
                  <div className="text-center"><div className="text-lg font-black grad-txt" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{v}</div><div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{l}</div></div>
                  {i < a.length - 1 && <div className="w-px h-8" style={{ background: 'var(--color-bdr)' }} />}
                </div>
              ))}
            </div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="pb-16">
        <div className="page-container">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .5, ease: motionEase }} className="text-2xl md:text-3xl font-black mb-8 text-center">
          Meet the <span className="grad-txt">Team</span>
        </motion.h2>
        <motion.div variants={staggerContact} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map(t => (
            <motion.div key={t.name} variants={fadeUp} transition={{ duration: .5, ease: motionEase }} className="rounded-2xl p-6 text-center" style={{ background: 'var(--color-surf)', border: '1px solid var(--color-bdr)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-3" style={{ background: 'linear-gradient(135deg,var(--color-blu),var(--color-grn))', border: '2px solid var(--color-bdr2)' }}>{t.emoji}</div>
              <div className="text-base font-extrabold">{t.name}</div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-blu2)' }}>{t.role}</div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-txt2)' }}>{t.desc}</p>
              <div className="flex justify-center gap-2 mt-3">
                <span className="w-7 h-7 rounded-md flex items-center justify-center text-xs" style={{ background: 'var(--color-surf2)', border: '1px solid var(--color-bdr)' }}>𝕏</span>
                <span className="w-7 h-7 rounded-md flex items-center justify-center text-xs" style={{ background: 'var(--color-surf2)', border: '1px solid var(--color-bdr)' }}>in</span>
              </div>
            </motion.div>
          ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <motion.section initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: .6, ease: motionEase }} className="pb-14">
        <div className="page-container">
        <div className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg,var(--color-surf),var(--color-surf2))', border: '1px solid var(--color-bdr2)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center,rgba(56,139,253,.09),transparent)' }} />
          <h2 className="text-2xl md:text-3xl font-black mb-3 relative">Join 52,000+ Students</h2>
          <p className="mb-5 max-w-[420px] mx-auto text-base relative" style={{ color: 'var(--color-txt2)' }}>Start building your career today — completely free.</p>
          <div className="flex gap-3 justify-center flex-wrap relative mb-3">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-p btn-glow" style={{ fontSize: '1rem', padding: '14px 28px', borderRadius: 12 }} onClick={() => navigate('/signup')}>🚀 Get Started Now</motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-o" style={{ fontSize: '1rem', padding: '14px 28px', borderRadius: 12 }} onClick={() => navigate('/contact')}>📧 Contact Us</motion.button>
          </div>
            <p className="text-xs relative" style={{ color: 'var(--color-muted)' }}>No credit card required · Free forever tier available</p>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  )
}
