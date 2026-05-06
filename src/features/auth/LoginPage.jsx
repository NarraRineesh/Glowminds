import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import SEO from '@/components/SEO'
import '@/styles/landing.css'
import '@/styles/forms.css'
import '@/styles/auth.css'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }
const ease = [0.16, 1, 0.3, 1]

const PERKS = [
  { ico: '📄', text: 'AI Resume Builder with ATS scoring' },
  { ico: '🎯', text: 'Smart job matching across 50+ portals' },
  { ico: '🤖', text: '24/7 AI career coach' },
  { ico: '📊', text: 'Application tracker with Kanban board' },
  { ico: '🔔', text: 'Real-time job alerts' },
  { ico: '⚡', text: 'One-click apply to jobs' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { doLogin, doGoogleLogin, addToast } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e) => {
    e?.preventDefault?.()
    if (!email || !password) { addToast('error', '⚠️ Please fill in all fields'); return }
    setLoading(true)
    try {
      await doLogin(email, password)
      addToast('success', '✅ Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : err.code === 'auth/user-not-found' ? 'No account found with this email'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later.'
        : err.message
      addToast('error', `⚠️ ${msg}`)
    } finally { setLoading(false) }
  }

  const handleForgotPassword = async () => {
    if (!email) { addToast('error', '⚠️ Enter your email above first'); return }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
      addToast('success', '✉️ Password reset email sent! Check your inbox.')
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email'
        : err.code === 'auth/invalid-email' ? 'Please enter a valid email'
        : err.message
      addToast('error', `⚠️ ${msg}`)
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await doGoogleLogin()
      addToast('success', '✅ Signed in with Google!')
      navigate('/dashboard')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        addToast('error', `⚠️ ${err.message}`)
      }
    } finally { setLoading(false) }
  }

  return (
    <>
      <SEO title="Log In" path="/login" description="Log in to Glowminds to access your dashboard, resume builder, job matches, and AI career coach." noIndex />
      <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden', paddingTop: 60 }}>
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-particles"><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <div className="auth-layout">

          {/* Left: Features panel (hidden on mobile) */}
          <motion.div className="n-links-desktop" variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <motion.div variants={fadeUp} transition={{ duration: .6, ease }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 100,
                background: 'var(--color-blu3)', border: '1px solid rgba(56,139,253,.22)', color: 'var(--color-blu2)',
                fontSize: '.72rem', fontWeight: 700, letterSpacing: '.5px', marginBottom: 16 }}>✦ WELCOME BACK</div>
              <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-.5px', marginBottom: 12 }}>
                Your Career Dashboard<br /><span className="grad-txt">Awaits You</span>
              </h2>
              <p style={{ fontSize: '.9rem', color: 'var(--color-txt2)', lineHeight: 1.75, maxWidth: 420 }}>
                Pick up right where you left off. Your matched jobs, resume drafts, and AI coach are ready.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: .5, ease }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PERKS.map(p => (
                <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 10, transition: '.2s' }}>
                  <span style={{ fontSize: '1.1rem' }}>{p.ico}</span>
                  <span style={{ fontSize: '.82rem', color: 'var(--color-txt2)', fontWeight: 500 }}>{p.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: .5, ease }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderTop: '1px solid var(--color-bdr)' }}>
              <div style={{ display: 'flex' }}>
                {['👩‍💻','👨‍💻','👩‍🔬','🧑‍💻'].map((a, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--color-blu),var(--color-grn))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', border: '2px solid var(--color-bg)', marginLeft: i > 0 ? -8 : 0 }}>{a}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '.8rem', fontWeight: 700 }}>52,000+ students</div>
                <div style={{ fontSize: '.7rem', color: 'var(--color-muted)' }}>already building their careers</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Login form */}
          <motion.div className="auth-card" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, ease, delay: .2 }} style={{ maxWidth: 420 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
            
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Welcome Back!</h1>
              <p style={{ fontSize: '.8rem', color: 'var(--color-muted)', marginTop: 4 }}>Log in to your Glowminds account</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div className="fg">
                <label className="fl">Email</label>
                <input className="fi" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="fg">
                <label className="fl">Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="fi" type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 40 }} />
                  <span onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '.8rem', color: 'var(--color-muted)', userSelect: 'none' }}>{showPw ? '🙈' : '👁'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span onClick={handleForgotPassword} style={{ fontSize: '.76rem', color: 'var(--color-blu2)', cursor: 'pointer' }}>
                  {resetSent ? '✉️ Check your inbox' : 'Forgot password?'}
                </span>
              </div>
              <button className="btn btn-p btn-w" style={{ padding: 12 }} type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Log In →'}
              </button>
            </form>

            <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
              <span style={{ fontSize: '.76rem', color: 'var(--color-muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
            </div>

            <button className="btn btn-o btn-w" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.08 24.08 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>

            <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
              <span style={{ fontSize: '.76rem', color: 'var(--color-muted)' }}>New to Glowminds?</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
            </div>
            <button className="btn btn-o btn-w" onClick={() => navigate('/signup')}>Create Account →</button>

            <p style={{ fontSize: '.7rem', color: 'var(--color-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              🔒 Your data is encrypted and secure. We never share your information with third parties.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  )
}
