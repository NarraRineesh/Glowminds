import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAppStore from '@/store/authStore'
import SEO from '@/components/SEO'
import { PAGE_SEO } from '@/config/seo'
import BrandLogo, { GlowmindsWordmark } from '@/components/BrandLogo'
import useLandingConfig from '@/hooks/useLandingConfig'
import { Badge, Button, Card, CardContent, FormField, FormRow, Input, Separator, AppIcon } from '@/components/ui'
import { MIN_PASSWORD_LENGTH, PASSWORD_RULE_HINT, PASSWORD_TOO_SHORT } from '@/constants/auth'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const ease = [0.16, 1, 0.3, 1]

const BENEFITS = [
  { ico: 'check-circle', title: 'Affordable Plans', desc: 'Powerful career tools at prices that work for students and freshers.' },
  { ico: 'lightning', title: 'Career OS in minutes', desc: 'Sign up, pick a resume template, sync details, then Glow (Bot) analysis.' },
  { ico: 'target', title: 'Skill-ranked jobs', desc: 'Our AI ranks jobs against your skills and target role.' },
  { ico: 'lock', title: 'Secure & Private', desc: 'Your data is encrypted. We never sell your information.' },
]

function AuthDivider({ label }) {
  return (
    <div className="my-4 flex items-center gap-2.5">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <Separator className="flex-1" />
    </div>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { doSignup, doGoogleLogin, addToast } = useAppStore()
  const { config: landingConfig } = useLandingConfig()
  const socialProof = landingConfig.socialProof || {}
  const benefits = BENEFITS
  const [fn, setFn] = useState('')
  const [ln, setLn] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const prefill = searchParams.get('email')?.trim()
    if (prefill) setEmail(prefill)
  }, [searchParams])

  const handleSignup = async (e) => {
    e?.preventDefault?.()
    const next = {}
    if (!fn.trim()) next.fn = 'First name is required'
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email'
    if (pw.length < MIN_PASSWORD_LENGTH) next.pw = PASSWORD_TOO_SHORT
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await doSignup(email, pw, fn, ln)
      addToast('success', `Welcome, ${fn}! Check your inbox to verify your email.`)
      navigate('/verify-email')
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'This email is already registered. Try logging in.'
        : err.code === 'auth/weak-password' ? PASSWORD_TOO_SHORT
        : err.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
        : err.message
      if (err.code === 'auth/invalid-email') setErrors({ email: msg })
      else if (err.code === 'auth/weak-password') setErrors({ pw: msg })
      else if (err.code === 'auth/email-already-in-use') setErrors({ email: msg })
      addToast('error', msg)
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await doGoogleLogin()
      addToast('success', 'Signed up with Google!')
      navigate('/dashboard')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        addToast('error', err.message)
      }
    } finally { setLoading(false) }
  }

  return (
    <>
      <SEO {...PAGE_SEO.signup} />
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

        <Link
          to="/"
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-muted/60 md:left-8 md:top-6"
        >
          <BrandLogo variant="full" size={28} forceDark alt="" aria-hidden />
          <GlowmindsWordmark className="hidden text-sm text-foreground sm:inline" />
        </Link>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 py-10 pb-12 md:grid-cols-2 md:gap-12 md:px-8 md:py-8 lg:gap-16">

          {/* Left: Benefits panel (hidden on mobile) */}
          <motion.div className="hidden flex-col gap-7 md:flex" variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} transition={{ duration: .6, ease }}>
              <Badge variant="outline" className="mb-4 border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                ✦ FREE TO START
              </Badge>
              <h2 className="mb-3 text-[clamp(1.6rem,3vw,2.4rem)] font-black leading-tight tracking-tight">
                Launch Your Career<br />
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">In Minutes</span>
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Join thousands of students who found their dream jobs using our AI-powered platform. It's free, fast, and built for freshers.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: .5, ease }} className="grid grid-cols-2 gap-3">
              {benefits.map(b => (
                <div key={b.title} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
                  <AppIcon name={b.ico} className="mb-2 size-5 text-primary" />
                  <div className="mb-1 text-[0.82rem] font-extrabold">{b.title}</div>
                  <p className="text-[0.74rem] leading-relaxed text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: .5, ease }} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-2 flex gap-0.5">
                {[1,2,3,4,5].map(s => <AppIcon key={s} name="star" className="size-3.5 text-amber-500" weight="fill" />)}
              </div>
              <p className="mb-3 text-[0.82rem] italic leading-relaxed text-muted-foreground">
                "Signed up, built my resume in 2 minutes, and got 3 interview calls in my first week. This platform is insane for freshers!"
              </p>
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-border bg-gradient-to-br from-primary to-emerald-500 text-xs font-bold text-white">
                  AV
                </div>
                <div>
                  <div className="text-[0.78rem] font-bold">Aditi Verma</div>
                  <div className="text-[0.68rem] text-primary">Example · SDE intern track</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Signup form */}
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
                    <Link to="/" className="rounded-lg transition-opacity hover:opacity-80" aria-label="Back to home">
                      <BrandLogo variant="full" size={48} forceDark alt="Glowminds" />
                    </Link>
                  </div>
                  <h1 className="text-xl font-black">Create Your Account</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Smart tools for your career journey</p>
                </div>

                <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
                  <FormRow>
                    <FormField label="First Name *" htmlFor="signup-fn" error={errors.fn}>
                      <Input id="signup-fn" placeholder="John" value={fn} onChange={e => { setFn(e.target.value); if (errors.fn) setErrors({ ...errors, fn: '' }) }} aria-invalid={errors.fn ? true : undefined} className={errors.fn ? 'border-destructive' : undefined} />
                    </FormField>
                    <FormField label="Last Name" htmlFor="signup-ln">
                      <Input id="signup-ln" placeholder="Doe" value={ln} onChange={e => setLn(e.target.value)} />
                    </FormField>
                  </FormRow>
                  <FormField label="Email *" htmlFor="signup-email" error={errors.email}>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }) }} aria-invalid={errors.email ? true : undefined} className={errors.email ? 'border-destructive' : undefined} />
                  </FormField>
                  <FormField label="Password *" htmlFor="signup-pw" hint={PASSWORD_RULE_HINT} error={errors.pw}>
                    <div className="relative">
                      <Input id="signup-pw" type={showPw ? 'text' : 'password'} placeholder={PASSWORD_RULE_HINT} value={pw} onChange={e => { setPw(e.target.value); if (errors.pw) setErrors({ ...errors, pw: '' }) }} className={errors.pw ? 'pr-10 border-destructive' : 'pr-10'} aria-invalid={errors.pw ? true : undefined} />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground select-none" aria-label={showPw ? 'Hide password' : 'Show password'}>
                        <AppIcon name={showPw ? 'eye-slash' : 'eye'} className="size-4" />
                      </button>
                    </div>
                  </FormField>
                  <Button className="w-full" size="lg" type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account →'}
                  </Button>
                  <p className="text-center text-[0.72rem] text-muted-foreground">By signing up you agree to our <Link className="font-semibold text-primary underline-offset-2 hover:underline" to="/terms">Terms</Link> and <Link className="font-semibold text-primary underline-offset-2 hover:underline" to="/privacy">Privacy Policy</Link></p>
                </form>

                <AuthDivider label="or" />

                <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.08 24.08 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Sign up with Google
                </Button>

                <AuthDivider label="Already have an account?" />

                <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/login')}>Log In →</Button>

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
