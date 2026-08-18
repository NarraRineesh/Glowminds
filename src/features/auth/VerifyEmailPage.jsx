import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import SEO from '@/components/SEO'
import BrandLogo, { GlowmindsWordmark } from '@/components/BrandLogo'
import { Button, Card, CardContent, AppIcon } from '@/components/ui'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const { user, loggedIn, authLoading, addToast } = useAppStore()
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!loggedIn) {
      navigate('/login', { replace: true })
      return
    }
    if (user?.emailVerified) {
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, loggedIn, user?.emailVerified, navigate])

  const resend = async () => {
    const current = auth.currentUser
    if (!current) return
    setSending(true)
    try {
      await sendEmailVerification(current)
      addToast('success', 'Verification email sent — check your inbox')
    } catch (err) {
      addToast('error', err?.message || 'Could not send verification email')
    } finally {
      setSending(false)
    }
  }

  const continueAfterVerify = async () => {
    const current = auth.currentUser
    if (!current) return
    setChecking(true)
    try {
      await current.reload()
      if (current.emailVerified) {
        useAppStore.setState((s) => ({
          user: s.user ? { ...s.user, emailVerified: true } : s.user,
        }))
        navigate('/dashboard', { replace: true })
      } else {
        addToast('error', 'Email not verified yet. Open the link in your inbox, then try again.')
      }
    } catch (err) {
      addToast('error', err?.message || 'Could not check verification status')
    } finally {
      setChecking(false)
    }
  }

  return (
    <>
      <SEO title="Verify your email" path="/verify-email" noIndex />
      <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-background" />
        <Link
          to="/"
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-muted/60 md:left-8 md:top-6"
        >
          <BrandLogo variant="full" size={28} forceDark alt="" aria-hidden />
          <GlowmindsWordmark className="hidden text-sm text-foreground sm:inline" />
        </Link>
        <Card className="relative z-10 w-full max-w-md">
          <CardContent className="space-y-4 p-6 sm:p-7">
            <div className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <AppIcon name="envelope" className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black">Check your inbox</h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                We sent a verification link to <span className="font-semibold text-foreground">{user?.email || 'your email'}</span>.
                Verify it, then continue to set your target role and build your first resume.
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={continueAfterVerify} disabled={checking}>
              {checking ? 'Checking…' : "I've verified — continue"}
            </Button>
            <Button variant="outline" className="w-full" onClick={resend} disabled={sending}>
              {sending ? 'Sending…' : 'Resend verification email'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Wrong account?{' '}
              <button
                type="button"
                className="font-semibold text-primary underline-offset-2 hover:underline"
                onClick={async () => {
                  await useAppStore.getState().doLogout()
                  navigate('/login')
                }}
              >
                Log out
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
