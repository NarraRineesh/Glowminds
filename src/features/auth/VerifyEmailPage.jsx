import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import SEO from '@/components/SEO'
import { PAGE_SEO } from '@/config/seo'
import BrandLogo from '@/components/BrandLogo'
import { requiresEmailVerification } from '@/utils/emailVerification'
import { Badge, Button, Card, CardContent } from '@/components/ui'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const loggedIn = useAppStore((s) => s.loggedIn)
  const authLoading = useAppStore((s) => s.authLoading)
  const addToast = useAppStore((s) => s.addToast)
  const doLogout = useAppStore((s) => s.doLogout)
  const resendVerificationEmail = useAppStore((s) => s.resendVerificationEmail)
  const refreshEmailVerification = useAppStore((s) => s.refreshEmailVerification)
  const [busy, setBusy] = useState(false)

  if (authLoading) return null
  if (!loggedIn) return <Navigate to="/login" replace />
  if (!requiresEmailVerification(user)) return <Navigate to="/dashboard" replace />

  const handleResend = async () => {
    setBusy(true)
    try {
      await resendVerificationEmail()
      addToast('success', 'Verification email sent. Check your inbox.')
    } catch (err) {
      const msg = err.code === 'auth/too-many-requests'
        ? 'Please wait a bit before requesting another email.'
        : err.message
      addToast('error', msg)
    } finally {
      setBusy(false)
    }
  }

  const handleChecked = async () => {
    setBusy(true)
    try {
      const verified = await refreshEmailVerification()
      if (verified) {
        addToast('success', 'Email verified. Welcome in.')
        navigate('/dashboard', { replace: true })
      } else {
        addToast('error', 'Not verified yet. Open the link in your email, then try again.')
      }
    } catch (err) {
      addToast('error', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = async () => {
    await doLogout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <SEO {...PAGE_SEO.verifyEmail} />
      <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-background" />
        <Card className="relative z-10 w-full max-w-md">
          <CardContent className="p-6 sm:p-7">
            <div className="mb-6 text-center">
              <Link to="/" className="mb-4 inline-flex justify-center rounded-lg transition-opacity hover:opacity-80" aria-label="Back to home">
                <BrandLogo variant="full" size={48} forceDark alt="Glowminds" />
              </Link>
              <Badge variant="outline" className="mb-3 border-primary/20 bg-primary/10 text-primary">
                Check your email
              </Badge>
              <h1 className="text-xl font-black">Verify your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a link to <strong className="text-foreground">{user?.email}</strong>. Verify it, then continue to set your target role and build your first resume. Google sign-in skips this step.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={handleChecked} disabled={busy}>
                {busy ? 'Checking…' : 'I verified — continue'}
              </Button>
              <Button variant="outline" size="lg" onClick={handleResend} disabled={busy}>
                Resend email
              </Button>
              <Button variant="ghost" size="lg" onClick={handleLogout} disabled={busy}>
                Use a different account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
