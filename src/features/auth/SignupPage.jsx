import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAppStore from '@/store/authStore'
import SEO from '@/components/SEO'
import '@/styles/landing.css'
import '@/styles/forms.css'
import '@/styles/auth.css'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const ease = [0.16, 1, 0.3, 1]

const BENEFITS = [
  { ico: '✅', title: 'Affordable Plans', desc: 'Powerful career tools at prices that work for students and freshers.' },
  { ico: '⚡', title: 'Ready in 2 Minutes', desc: 'Sign up, build your resume, and start applying — all in minutes.' },
  { ico: '🎯', title: '94% Match Accuracy', desc: 'Our AI finds the most relevant jobs for your skills and goals.' },
  { ico: '🔒', title: 'Secure & Private', desc: 'Your data is encrypted. We never sell your information.' },
]

export default function SignupPage() {
  const navigate = useNavigate()
  const { doSignup, doGoogleLogin, addToast } = useAppStore()
  const [fn, setFn] = useState('')
  const [ln, setLn] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSignup = async (e) => {
    e?.preventDefault?.()
    if (!fn) { addToast('error', '⚠️ Please fill in your name'); return }
    if (!email) { addToast('error', '⚠️ Email is required'); return }
    if (pw.length < 8) { addToast('error', '⚠️ Password must be 8+ characters'); return }
    setLoading(true)
    try {
      await doSignup(email, pw, fn, ln)
      addToast('success', `🎉 Welcome, ${fn}! Your account is ready.`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'This email is already registered. Try logging in.'
        : err.code === 'auth/weak-password' ? 'Password is too weak. Use at least 6 characters.'
        : err.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
        : err.message
      addToast('error', `⚠️ ${msg}`)
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await doGoogleLogin()
      addToast('success', '✅ Signed up with Google!')
      navigate('/dashboard')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        addToast('error', `⚠️ ${err.message}`)
      }
    } finally { setLoading(false) }
  }

  return (
    <>
      <SEO title="Sign Up" path="/signup" description="Create your Glowminds account. Build ATS resumes, get matched to jobs, and launch your career today." noIndex />
      <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden', paddingTop: 60 }}>
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-particles"><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <div className="auth-layout">

          {/* Left: Benefits panel (hidden on mobile) */}
          <motion.div className="n-links-desktop" variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <motion.div variants={fadeUp} transition={{ duration: .6, ease }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 100,
                background: 'var(--color-grn2)', border: '1px solid rgba(63,185,80,.22)', color: 'var(--color-grn)',
                fontSize: '.72rem', fontWeight: 700, letterSpacing: '.5px', marginBottom: 16 }}>✦ JOIN 52,000+ STUDENTS</div>
              <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-.5px', marginBottom: 12 }}>
                Launch Your Career<br /><span className="grad-txt">In Minutes</span>
              </h2>
              <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, maxWidth: 420 }}>
                Join thousands of students who found their dream jobs using our AI-powered platform. It's free, fast, and built for freshers.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: .5, ease }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {BENEFITS.map(b => (
                <div key={b.title} style={{ background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 12, padding: 16, transition: '.2s' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>{b.ico}</div>
                  <div style={{ fontSize: '.82rem', fontWeight: 800, marginBottom: 4 }}>{b.title}</div>
                  <p style={{ fontSize: '.74rem', color: 'var(--color-txt2)', lineHeight: 1.55 }}>{b.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Testimonial */}
            <motion.div variants={fadeUp} transition={{ duration: .5, ease }} style={{ background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '.75rem' }}>⭐</span>)}
              </div>
              <p style={{ fontSize: '.82rem', color: 'var(--color-txt2)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>
                "Signed up, built my resume in 2 minutes, and got 3 interview calls in my first week. This platform is insane for freshers!"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--color-blu),var(--color-grn))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', border: '2px solid var(--color-bdr2)' }}>👩‍💻</div>
                <div>
                  <div style={{ fontSize: '.78rem', fontWeight: 700 }}>Aditi Verma</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--color-blu2)' }}>SDE Intern @ Google</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Signup form */}
          <motion.div className="auth-card" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, ease, delay: .2 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Create Your Account</h1>
              <p style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginTop: 4 }}>Smart tools for your career journey</p>
            </div>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div className="fg2">
                <div className="fg"><label className="fl">First Name *</label><input className="fi" placeholder="John" value={fn} onChange={e => setFn(e.target.value)} /></div>
                <div className="fg"><label className="fl">Last Name</label><input className="fi" placeholder="Doe" value={ln} onChange={e => setLn(e.target.value)} /></div>
              </div>
              <div className="fg"><label className="fl">Email *</label><input className="fi" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="fg">
                <label className="fl">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input className="fi" type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={pw} onChange={e => setPw(e.target.value)} style={{ paddingRight: 40 }} />
                  <span onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '.8rem', color: 'var(--color-muted)', userSelect: 'none' }}>{showPw ? '🙈' : '👁'}</span>
                </div>
              </div>
              <button className="btn btn-p btn-w" style={{ padding: 12 }} type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account →'}
              </button>
              <p style={{ fontSize: '.72rem', color: 'var(--color-muted)', textAlign: 'center' }}>By signing up you agree to our Terms &amp; Privacy Policy</p>
            </form>

            <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
              <span style={{ fontSize: '.76rem', color: 'var(--color-muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
            </div>

            <button className="btn btn-o btn-w" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.08 24.08 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Sign up with Google
            </button>

            <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
              <span style={{ fontSize: '.76rem', color: 'var(--color-muted)' }}>Already have an account?</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
            </div>
            <button className="btn btn-o btn-w" onClick={() => navigate('/login')}>Log In →</button>

            <p style={{ fontSize: '.7rem', color: 'var(--color-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              🔒 Your data is encrypted and secure. We never share your information with third parties.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  )
}
