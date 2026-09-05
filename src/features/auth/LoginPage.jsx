import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChromeHomeLink } from '@/components/HostLinks'
import { motion } from 'framer-motion'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import SEO from '@/components/SEO'
import { PAGE_SEO } from '@/config/seo'
import BrandLogo, { GlowmindsWordmark } from '@/components/BrandLogo'
import useLandingConfig from '@/hooks/useLandingConfig'
import { Badge, Button, Card, CardContent, FormField, Input, Separator, AppIcon } from '@/components/ui'
import { requiresEmailVerification } from '@/utils/emailVerification'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }
const ease = [0.16, 1, 0.3, 1]

const PERKS = [
  { ico: 'resume', text: 'AI Resume Builder with ATS scoring' },
  { ico: 'target', text: 'Smart job matching across 50+ portals' },
  { ico: 'robot', text: 'Glow (Bot) — 24/7 career advisor' },
  { ico: 'dashboard', text: 'Application tracker with Kanban board' },
  { ico: 'bell', text: 'Real-time job alerts' },
  { ico: 'lightning', text: 'One-click apply to jobs' },
]

const AVATAR_INITIALS = ['S', 'A', 'R', 'J']

function AuthDivider({ label }) {
  return (
    <div className="my-4 flex items-center gap-2.5">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <Separator className="flex-1" />
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { doLogin, doGoogleLogin, addToast } = useAppStore()
  const { config: landingConfig } = useLandingConfig()
  const socialProof = landingConfig.socialProof || {}
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [errors, setErrors] = useState({})

  const handleLogin = async (e) => {
    e?.preventDefault?.()
    const next = {}
    if (!email.trim()) next.email = 'Email is required'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      const fbUser = await doLogin(email, password)
      if (requiresEmailVerification(fbUser)) {
        addToast('error', 'Verify your email before opening the dashboard.')
        navigate('/verify-email')
        return
      }
      addToast('success', 'Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : err.code === 'auth/user-not-found' ? 'No account found with this email'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later.'
        : err.message
      addToast('error', msg)
    } finally { setLoading(false) }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors((e) => ({ ...e, email: 'Enter your email above first' }))
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
      setErrors((e) => ({ ...e, email: '' }))
      addToast('success', 'Password reset email sent! Check your inbox.')
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email'
        : err.code === 'auth/invalid-email' ? 'Please enter a valid email'
        : err.message
      setErrors((e) => ({ ...e, email: msg }))
      addToast('error', msg)
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await doGoogleLogin()
      addToast('success', 'Signed in with Google!')
      navigate('/dashboard')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        addToast('error', err.message)
      }
    } finally { setLoading(false) }
  }

  return (
    <>
      <SEO {...PAGE_SEO.login} />
      <div className="relative flex min-h-svh overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-background" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_65%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--border)_40%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--border)_40%,transparent)_1px,transparent_1px)] bg-size-[48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
        />

        <ChromeHomeLink
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-muted/60 md:left-8 md:top-6"
        >
          <BrandLogo variant="full" size={28} forceDark alt="" aria-hidden />
          <GlowmindsWordmark className="hidden text-sm text-foreground sm:inline" />
        </ChromeHomeLink>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 py-10 pb-12 md:grid-cols-2 md:gap-12 md:px-8 md:py-8 lg:gap-16">

          {/* Left: Features panel (hidden on mobile) */}
          <motion.div className="hidden flex-col gap-7 md:flex" variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} transition={{ duration: .6, ease }}>
              <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/10 text-primary">
                ✦ WELCOME BACK
              </Badge>
              <h2 className="mb-3 text-[clamp(1.6rem,3vw,2.4rem)] font-black leading-tight tracking-tight">
                Your Career Dashboard<br />
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Awaits You</span>
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Pick up right where you left off. Your matched jobs, resume drafts, and AI coach are ready.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: .5, ease }} className="flex flex-col gap-3">
              {PERKS.map(p => (
                <div key={p.text} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 transition-colors hover:border-primary/30">
                  <AppIcon name={p.ico} className="size-5 shrink-0 text-primary" />
                  <span className="text-[0.82rem] font-medium text-muted-foreground">{p.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: .5, ease }} className="flex items-center gap-4 border-t border-border py-4">
              <div className="flex">
                {AVATAR_INITIALS.map((initial, i) => (
                  <div
                    key={i}
                    className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary to-emerald-500 text-xs font-bold text-white"
                    style={{ marginLeft: i > 0 ? -8 : 0 }}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-bold">Students & freshers</div>
                <div className="text-xs text-muted-foreground">building careers on Glowminds</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Login form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: .7, ease, delay: .2 }}
            className="mx-auto w-full max-w-md"
          >
            <Card>
              <CardContent className="p-6 sm:p-7">
                <div className="mb-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <ChromeHomeLink className="rounded-lg transition-opacity hover:opacity-80" aria-label="Glowminds home">
                      <BrandLogo variant="full" size={48} forceDark alt="Glowminds" />
                    </ChromeHomeLink>
                  </div>
                  <h1 className="text-xl font-black">Welcome Back!</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Log in to your Glowminds account</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                  <FormField label="Email" htmlFor="login-email" error={errors.email}>
                    <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }) }} aria-invalid={errors.email ? true : undefined} className={errors.email ? 'border-destructive' : undefined} />
                  </FormField>
                  <FormField label="Password" htmlFor="login-password" error={errors.password}>
                    <div className="relative">
                      <Input id="login-password" type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }) }} className={errors.password ? 'pr-10 border-destructive' : 'pr-10'} aria-invalid={errors.password ? true : undefined} />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground select-none" aria-label={showPw ? 'Hide password' : 'Show password'}>
                        <AppIcon name={showPw ? 'eye-slash' : 'eye'} className="size-4" />
                      </button>
                    </div>
                  </FormField>
                  <div className="flex items-center justify-end gap-2">
                    {resetSent && (
                      <span className="text-xs text-muted-foreground">Check your inbox.</span>
                    )}
                    <Button type="button" variant="link" size="sm" onClick={handleForgotPassword} className="h-auto px-0 text-xs">
                      {resetSent ? 'Send again' : 'Forgot password?'}
                    </Button>
                  </div>
                  <Button className="w-full" size="lg" type="submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Log In →'}
                  </Button>
                </form>

                <AuthDivider label="or" />

                <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.08 24.08 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Continue with Google
                </Button>

                <AuthDivider label="New to Glowminds?" />

                <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/signup')}>Create Account →</Button>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs leading-relaxed text-muted-foreground">
                  <AppIcon name="lock" className="size-3.5 shrink-0" />
                  Your data is encrypted and secure. We never share your information with third parties.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  )
}
