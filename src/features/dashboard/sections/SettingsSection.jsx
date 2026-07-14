import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import {
  AppIcon,
  Button,
  DashboardCard,
  FormField,
  Input,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from '@/components/ui'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useTheme from '@/hooks/useTheme'
import useIsPro from '@/hooks/useIsPro'
import useUpgradePro from '@/hooks/useUpgradePro'
import usePricingConfig, { useYearlyPriceLabel } from '@/hooks/usePricingConfig'
import useEntitlements from '@/hooks/useEntitlements'
import { formatSubscriptionEndDate, isActiveProSubscription } from '@/constants/plans'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { loadUserUsage } from '@/utils/firestoreCollections'
import { apiFetch } from '@/services/apiClient'
import { Link, useNavigate } from 'react-router-dom'

const SECTIONS = [
  { id: 'account', icon: 'user', title: 'Account', desc: 'Profile and security' },
  { id: 'billing', icon: 'credit-card', title: 'Billing', desc: 'Plan, renewal, upgrade' },
  { id: 'usage', icon: 'chart', title: 'Usage', desc: 'Tool activity counters' },
  { id: 'appearance', icon: 'palette', title: 'Appearance', desc: 'Theme, density, motion' },
  { id: 'notifications', icon: 'bell', title: 'Notifications', desc: 'Email & in-app alerts' },
  { id: 'privacy', icon: 'lock', title: 'Privacy & Data', desc: 'Export, delete, visibility' },
]

const USAGE_LABELS = {
  'ai.cover-letter': 'Cover letters',
  'ai.career-chat': 'Career coach chats',
  'ai.interview': 'Interview sessions',
  'ai.profile-review': 'Profile reviews',
  'ai.resume-review': 'Resume reviews',
  'ai.grammar': 'Grammar checks',
  'ai.paraphrase': 'Paraphrasing',
  'resume.export': 'Resume exports',
  'linkedinAudit.complete': 'LinkedIn audits',
  'savedJobs.toggle': 'Saved jobs',
}

const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]))

const contentMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
}

function parseSubDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function formatSubDate(value) {
  const d = parseSubDate(value)
  if (!d) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function planLabel(sub, plans) {
  if (!sub) return null
  const key = sub.plan === 'yearly' || sub.plan === 'monthly' ? sub.plan : null
  if (key && plans?.[key]) return plans[key].label
  if (sub.tier === 'pro') return 'Glowminds Pro'
  return null
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-muted px-3.5 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[0.86rem] font-bold text-foreground">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.72rem] text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}

function FeatureChecklist({ items, variant = 'included' }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const on = variant === 'pro' ? item.included !== false : !!item.included
        return (
          <li key={item.text} className="flex items-start gap-2.5 text-sm">
            <AppIcon
              name={on ? 'check' : 'x'}
              className={cn('mt-0.5 size-4 shrink-0', on ? 'text-emerald-500' : 'text-muted-foreground/50')}
            />
            <span className={cn(on ? 'text-foreground' : 'text-muted-foreground', item.highlight && on && 'font-semibold text-primary')}>
              {item.text}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function BillingDetail({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground sm:text-right">{value}</span>
    </div>
  )
}

function SettingsUpgradeBanner({ upgradeLoading, startUpgrade, yearlyPriceLabel, onGoToBilling }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <AppIcon name="sparkle" className="size-4 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Unlock Glowminds Pro</p>
          <p className="text-xs text-muted-foreground">
            {upgradeLoading ? 'Opening checkout…' : `${yearlyPriceLabel} · Unlimited resumes, AI tools & more`}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={upgradeLoading}
          onClick={() => void startUpgrade({ plan: 'yearly' })}
        >
          {upgradeLoading ? 'Processing…' : 'Upgrade'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onGoToBilling}>
          View billing
        </Button>
      </div>
    </div>
  )
}

function SettingsInfoBox({ children, icon = 'info' }) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      <div className="flex gap-3">
        <AppIcon name={icon} className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 space-y-1.5">{children}</div>
      </div>
    </div>
  )
}

function SettingsPanelHeader({ section }) {
  return (
    <header className="mb-5 border-b border-border/80 pb-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <AppIcon name={section.icon} className="size-4 text-primary" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-foreground">{section.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{section.desc}</p>
        </div>
      </div>
    </header>
  )
}

function SettingsTabPanel({ activeSection, children }) {
  return (
    <section className="min-w-0 pt-1" aria-labelledby={`settings-panel-${activeSection.id}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection.id}
          id={`settings-panel-${activeSection.id}`}
          {...contentMotion}
          className="flex flex-col gap-4"
        >
          <SettingsPanelHeader section={activeSection} />
          {children}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

function comparisonCellText(row, tier) {
  if ('freeIncluded' in row || 'proIncluded' in row) {
    const included = tier === 'free' ? row.freeIncluded : row.proIncluded
    const detail = tier === 'free' ? row.freeDetail : row.proDetail
    if (detail) return detail
    return included ? 'Included' : '—'
  }
  return tier === 'free' ? row.free : row.pro
}

function UsagePanel({ uid }) {
  const [usageData, setUsageData] = useState({ usage: {}, updatedAt: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return undefined
    let cancelled = false
    setLoading(true)
    loadUserUsage(uid)
      .then((data) => {
        if (!cancelled) setUsageData(data)
      })
      .catch((err) => {
        console.error('UsagePanel load:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [uid])

  const entries = Object.entries(usageData.usage || {})
    .filter(([, count]) => Number(count) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))

  const updatedLabel = usageData.updatedAt
    ? (typeof usageData.updatedAt?.toDate === 'function'
      ? usageData.updatedAt.toDate()
      : new Date(usageData.updatedAt)
    ).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard titleIcon="chart" title="Tool usage" contentClassName="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Counts how many times you have used each Glowminds tool. These counters are informational and do not limit access.
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading usage…</p>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No usage recorded yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start using AI tools, export a resume, or save jobs to see activity here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {entries.map(([key, count]) => (
              <li key={key} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-foreground">
                  {USAGE_LABELS[key] || key}
                </span>
                <span className="text-sm font-bold tabular-nums text-primary">{count}</span>
              </li>
            ))}
          </ul>
        )}
        {updatedLabel && (
          <p className="text-xs text-muted-foreground">Last updated {updatedLabel}</p>
        )}
      </DashboardCard>
    </div>
  )
}

function BillingPanel({
  subscription,
  proActive,
  isPro,
  renewalLabel,
  upgradeLoading,
  startUpgrade,
  navigate,
  plans,
  freeFeatures,
  proFeatures,
  pricingComparison,
  yearlyPriceLabel,
  billingBlurb,
  termsBillingText,
  onCancelSubscription,
  cancelling,
}) {
  const planTitle = isPro ? 'Glowminds Pro' : 'Free'

  const billingPlan = planLabel(subscription, plans)
  const startLabel = formatSubDate(subscription?.startDate)
  const paymentRef = subscription?.razorpayPaymentId
    ? `···${String(subscription.razorpayPaymentId).slice(-8)}`
    : null

  const includedSummary = isPro
    ? 'Pro includes 100 AI credits every month, unlimited resumes, unlimited application tracking, and premium career tools.'
    : 'Free includes job search, 1 ATS resume, up to 10 application tracks, and 10 AI credits every month.'

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard titleIcon="credit-card" title="Billing & plan" contentClassName="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current plan</p>
              <p className="mt-1 text-lg font-black text-foreground">{planTitle}</p>
              {proActive && renewalLabel && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {subscription?.status === 'active' ? 'Renews' : 'Expires'} on {renewalLabel}
                  {subscription?.plan === 'yearly' ? ' · Yearly billing' : subscription?.plan === 'monthly' ? ' · Monthly billing' : ''}
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">{includedSummary}</p>
              {isPro && !proActive && (
                <p className="mt-1 text-sm text-muted-foreground">Your subscription is not active. Upgrade to restore Pro features.</p>
              )}
            </div>
            {isPro && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
                Pro active
              </span>
            )}
          </div>
        </div>

        {!isPro && (
          <div className="flex flex-wrap gap-2">
            <Button disabled={upgradeLoading} onClick={() => void startUpgrade({ plan: 'yearly' })}>
              {upgradeLoading ? 'Opening checkout…' : `Upgrade — ${yearlyPriceLabel}`}
            </Button>
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              View full pricing
            </Button>
          </div>
        )}
      </DashboardCard>

      <DashboardCard titleIcon="sparkle" title={isPro ? 'Included in your plan' : 'Included on Free'} contentClassName="flex flex-col gap-3">
        <FeatureChecklist items={isPro ? proFeatures : freeFeatures} variant={isPro ? 'pro' : 'included'} />
      </DashboardCard>

      {!isPro && (
        <DashboardCard titleIcon="lightning" title="Upgrade to Pro" contentClassName="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {billingBlurb || 'Secure checkout via Razorpay (UPI, cards, net banking).'}
          </p>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Feature</th>
                  <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Free</th>
                  <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary">Pro</th>
                </tr>
              </thead>
              <tbody>
                {pricingComparison.map((row) => (
                  <tr key={row.feature} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 font-medium text-foreground">{row.feature}</td>
                    <td className="px-3 py-2 text-muted-foreground">{comparisonCellText(row, 'free')}</td>
                    <td className="px-3 py-2 font-medium text-primary">{comparisonCellText(row, 'pro')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <FeatureChecklist items={proFeatures.filter((f) => f.highlight)} variant="pro" />
        </DashboardCard>
      )}

      {(termsBillingText || !isPro) && (
        <SettingsInfoBox icon="info">
          <p className="font-medium text-foreground">Billing & cancellation</p>
          <p>
            {termsBillingText ||
              'Pro is billed through Razorpay. Cancel before your renewal date to avoid the next charge; you keep access until the period ends.'}
          </p>
          <p>
            Refunds follow our{' '}
            <Link to="/refund" className="font-semibold text-primary hover:underline">refund policy</Link>
            . Questions? Contact support from the email on your account.
          </p>
        </SettingsInfoBox>
      )}

      {proActive && (
        <DashboardCard titleIcon="credit-card" title="Subscription details" contentClassName="flex flex-col gap-3">
          <BillingDetail label="Billing plan" value={billingPlan} />
          <BillingDetail label="Status" value={subscription?.status ? String(subscription.status) : null} />
          <BillingDetail label="Started" value={startLabel} />
          <BillingDetail label={subscription?.status === 'active' ? 'Next renewal' : 'Access until'} value={renewalLabel} />
          <BillingDetail label="Payment reference" value={paymentRef} />
          {subscription?.status === 'cancelled' || subscription?.cancelAtPeriodEnd ? (
            <p className="border-t border-border pt-3 text-sm text-muted-foreground">
              Cancellation scheduled. You keep Pro access until {renewalLabel || 'the end of your billing period'}.
            </p>
          ) : (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">
                Cancel anytime. You keep Pro access until the end of your billing period.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                disabled={cancelling}
                onClick={onCancelSubscription}
              >
                {cancelling ? 'Cancelling…' : 'Cancel subscription'}
              </Button>
            </div>
          )}
        </DashboardCard>
      )}

    </div>
  )
}

export default function SettingsSection() {
  const { user, addToast, doLogout } = useAppStore()
  const { theme, setTheme } = useTheme()
  const isPro = useIsPro()
  const { startUpgrade, loading: upgradeLoading } = useUpgradePro()
  const navigate = useNavigate()
  const yearlyPriceLabel = useYearlyPriceLabel()
  const {
    plans,
    freeFeatures,
    proFeatures,
    pricingComparison,
    marketing,
  } = usePricingConfig()
  const { entitlements, refresh: refreshEntitlements } = useEntitlements()
  const userDoc = useProfileStore((s) => s.user)
  const profile = useProfileStore((s) => s.profile)
  const profileLoaded = useProfileStore((s) => s.loaded)
  const patchUserDoc = useProfileStore((s) => s.patchUserDoc)
  const updateProfile = useProfileStore((s) => s.updateProfile)

  const [active, setActive] = useState('account')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [compact, setCompact] = useState(false)
  const [jobAlertsEnabled, setJobAlertsEnabled] = useState(false)
  const [jobAlertQuery, setJobAlertQuery] = useState('')

  useEffect(() => {
    if (!profileLoaded) return
    const s = userDoc?.settings || {}
    setEmailNotifs(s.emailNotifications !== false)
    setPushNotifs(!!s.pushNotifications)
    setReducedMotion(!!s.reducedMotion)
    setCompact(!!s.compactDensity)
    const alerts = profile?.preferences?.jobAlerts || {}
    setJobAlertsEnabled(!!alerts.enabled)
    setJobAlertQuery(alerts.query || profile?.preferences?.jobType || profile?.headline || '')
  }, [profileLoaded, userDoc, profile])

  useEffect(() => {
    document.documentElement.style.setProperty('--prefers-reduced-motion', reducedMotion ? 'reduce' : 'no-preference')
  }, [reducedMotion])

  const persistSettings = (partial) => {
    const current = useProfileStore.getState().user?.settings || {}
    patchUserDoc({ settings: { ...current, ...partial } }).catch((err) => {
      console.error('persist settings:', err)
    })
  }

  const onToggleEmail = (v) => { setEmailNotifs(v); persistSettings({ emailNotifications: v }) }
  const onTogglePush = (v) => { setPushNotifs(v); persistSettings({ pushNotifications: v }) }
  const onToggleMotion = (v) => { setReducedMotion(v); persistSettings({ reducedMotion: v }) }
  const onToggleCompact = (v) => { setCompact(v); persistSettings({ compactDensity: v }) }
  const onToggleTheme = (checked) => {
    const next = checked ? 'dark' : 'light'
    setTheme(next)
    persistSettings({ theme: next })
  }

  const subscription = entitlements?.subscription
  const proActive = isActiveProSubscription(subscription)
  const renewalLabel = formatSubscriptionEndDate(subscription)

  const sendPasswordReset = async () => {
    const email = user?.email
    if (!email) {
      addToast('error', 'No email on this account')
      return
    }
    setResettingPassword(true)
    try {
      await sendPasswordResetEmail(auth, email)
      addToast('success', 'Password reset email sent — check your inbox')
    } catch (err) {
      console.error('sendPasswordReset:', err)
      addToast('error', err?.message || 'Could not send reset email')
    } finally {
      setResettingPassword(false)
    }
  }

  const cancelSubscription = async () => {
    if (!window.confirm('Cancel Pro at the end of your billing period? You’ll keep access until then.')) return
    setCancelling(true)
    try {
      const res = await apiFetch('/billing/cancel', { method: 'POST', body: {} })
      addToast('success', res.message || 'Subscription cancelled')
      await refreshEntitlements({ force: true })
    } catch (err) {
      addToast('error', err?.message || 'Could not cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const exportData = async () => {
    setExporting(true)
    try {
      const data = await apiFetch('/account/export', { method: 'POST', body: {} })
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `glowminds-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      addToast('success', 'Data export downloaded')
    } catch (err) {
      addToast('error', err?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const deleteAccount = async () => {
    const ok = window.confirm(
      'Permanently delete your account and data? This cannot be undone. Type DELETE in the next prompt.',
    )
    if (!ok) return
    const confirm = window.prompt('Type DELETE to confirm account deletion')
    if (confirm !== 'DELETE') {
      addToast('info', 'Deletion cancelled')
      return
    }
    setDeleting(true)
    try {
      await apiFetch('/account/delete', { method: 'POST', body: { confirm: 'DELETE' } })
      addToast('success', 'Account deleted')
      await doLogout()
      navigate('/')
    } catch (err) {
      addToast('error', err?.message || 'Could not delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <SectionHeader
        badge="Preferences"
        badgeClassName="border-purple-500/20 bg-purple-500/10 text-purple-500"
        title="Make Glowminds yours"
        accent="yours"
        subtitle="Account, appearance, and notification controls — everything you can fine-tune."
      />

      <Tabs value={active} onValueChange={setActive} className="min-h-0 flex-1 gap-4">
        {!isPro && (
          <SettingsUpgradeBanner
            upgradeLoading={upgradeLoading}
            startUpgrade={startUpgrade}
            yearlyPriceLabel={yearlyPriceLabel}
            onGoToBilling={() => setActive('billing')}
          />
        )}

        <div className="sticky top-0 z-20 -mx-1 border-b border-border/60 bg-background/90 pb-0 pt-1 backdrop-blur-md -mt-1">
          <TabsList
            variant="line"
            aria-label="Settings sections"
            className="h-auto w-full max-w-full justify-start gap-0 overflow-x-auto rounded-none bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SECTIONS.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="shrink-0 gap-1.5 rounded-t-lg px-3 py-2.5 text-sm data-active:bg-primary/10 data-active:text-primary data-active:after:bg-primary data-active:[&_svg]:text-primary after:bottom-0 sm:px-4"
              >
                <AppIcon name={section.icon} className="size-4" />
                <span>{section.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="account" className="mt-1 outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.account}>
            <DashboardCard titleIcon="shield" title="Security" contentClassName="flex flex-col gap-3">
              {user?.email && (
                <FormField label="Email" hint="Sign-in address — contact support to change.">
                  <Input disabled readOnly value={user.email} />
                </FormField>
              )}
              <p className="text-sm text-muted-foreground">
                Password reset sends a link to <span className="font-medium text-foreground">{user?.email || 'your email'}</span>.
                Google sign-in accounts use Google to manage passwords.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                disabled={resettingPassword || !user?.email}
                onClick={() => void sendPasswordReset()}
              >
                {resettingPassword ? 'Sending…' : 'Send password reset email'}
              </Button>
              <Button variant="outline" size="sm" className="self-start" onClick={async () => { await doLogout(); addToast('info', 'Signed out') }}>
                Sign out
              </Button>
            </DashboardCard>
          </SettingsTabPanel>
        </TabsContent>

        <TabsContent value="billing" className="mt-1 outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.billing}>
            <BillingPanel
              subscription={subscription}
              proActive={proActive}
              isPro={isPro}
              renewalLabel={renewalLabel}
              upgradeLoading={upgradeLoading}
              startUpgrade={startUpgrade}
              navigate={navigate}
              plans={plans}
              freeFeatures={freeFeatures}
              proFeatures={proFeatures}
              pricingComparison={pricingComparison}
              yearlyPriceLabel={yearlyPriceLabel}
              billingBlurb={marketing?.billingBlurb}
              termsBillingText={marketing?.termsBillingText}
              onCancelSubscription={cancelSubscription}
              cancelling={cancelling}
            />
          </SettingsTabPanel>
        </TabsContent>

        <TabsContent value="usage" className="mt-1 outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.usage}>
            <UsagePanel uid={user?.uid} />
          </SettingsTabPanel>
        </TabsContent>

        <TabsContent value="appearance" className="mt-1 outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.appearance}>
            <SettingsInfoBox icon="palette">
              <p className="font-medium text-foreground">Personalise the workspace</p>
              <p>
                These preferences are saved to your account and apply on any device where you sign in.
                Changes take effect immediately in the dashboard.
              </p>
            </SettingsInfoBox>
            <DashboardCard titleIcon="palette" title="Theme & layout" contentClassName="flex flex-col gap-3">
              <Toggle
                checked={theme === 'dark'}
                onChange={onToggleTheme}
                label="Dark mode"
                hint="Switches background, cards, and text contrast across the app. Light mode is easier in bright rooms; dark is easier at night."
              />
              <Toggle
                checked={compact}
                onChange={onToggleCompact}
                hint="Reduces padding and vertical spacing in lists and cards so more content fits on screen."
                label="Compact density"
              />
              <Toggle
                checked={reducedMotion}
                onChange={onToggleMotion}
                label="Reduced motion"
                hint="Shortens or disables Framer Motion transitions and celebratory animations — recommended if motion makes you uncomfortable."
              />
            </DashboardCard>
          </SettingsTabPanel>
        </TabsContent>

        <TabsContent value="notifications" className="mt-1 outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.notifications}>
            <SettingsInfoBox icon="bell">
              <p className="font-medium text-foreground">What you’ll hear from us</p>
              <p>
                Email is used for important account and career updates. In-app alerts appear while you’re signed in
                on the dashboard.
              </p>
            </SettingsInfoBox>
            <DashboardCard titleIcon="bell" title="Notification preferences" contentClassName="flex flex-col gap-3">
              <Toggle
                checked={emailNotifs}
                onChange={onToggleEmail}
                label="Email notifications"
                hint="Application status changes, weekly career digest, and product tips. Turn off to stop non-essential marketing email; security emails may still be sent."
              />
              <Toggle
                checked={pushNotifs}
                onChange={onTogglePush}
                label="In-app notifications"
                hint="Toasts inside Glowminds for product updates, job matches, and reminders while you’re active."
              />
            </DashboardCard>
            <DashboardCard titleIcon="jobs" title="Job alert digest" contentClassName="flex flex-col gap-3">
              <Toggle
                checked={jobAlertsEnabled}
                onChange={(v) => {
                  setJobAlertsEnabled(v)
                  const prefs = useProfileStore.getState().profile?.preferences || {}
                  updateProfile({
                    preferences: {
                      ...prefs,
                      jobAlerts: {
                        ...(prefs.jobAlerts || {}),
                        enabled: v,
                        frequency: 'daily',
                        query: jobAlertQuery,
                      },
                    },
                  }).catch((err) => console.error(err))
                }}
                label="Daily in-app job digest"
                hint="When enabled, we post a short list of fresh matches to your notification bell each morning (Asia/Kolkata)."
              />
              <FormField label="Alert query">
                <Input
                  value={jobAlertQuery}
                  onChange={(e) => setJobAlertQuery(e.target.value)}
                  onBlur={() => {
                    const prefs = useProfileStore.getState().profile?.preferences || {}
                    updateProfile({
                      preferences: {
                        ...prefs,
                        jobAlerts: {
                          ...(prefs.jobAlerts || {}),
                          enabled: jobAlertsEnabled,
                          frequency: 'daily',
                          query: jobAlertQuery.trim(),
                        },
                      },
                    }).catch((err) => console.error(err))
                  }}
                  placeholder="e.g. Frontend Engineer React"
                />
              </FormField>
            </DashboardCard>
          </SettingsTabPanel>
        </TabsContent>

        <TabsContent value="privacy" className="mt-1 outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.privacy}>
            <SettingsInfoBox icon="lock">
              <p className="font-medium text-foreground">Your data, your control</p>
              <p>
                Glowminds stores your profile, applications, resumes, and settings in Firebase (encrypted in transit).
                Export gives you a copy; deletion is permanent after confirmation.
              </p>
            </SettingsInfoBox>
            <DashboardCard titleIcon="download" title="Export my data" contentClassName="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Download a JSON copy of your profile, saved jobs, applications, resume metadata, and settings.
              </p>
              <Button variant="outline" size="sm" className="self-start" disabled={exporting} onClick={exportData}>
                {exporting ? 'Preparing…' : 'Download data export'}
              </Button>
            </DashboardCard>
            <DashboardCard titleIcon="trash" title="Delete account" contentClassName="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Permanently removes your account, profile, and application history.
                Billing records may be retained as required by law.
              </p>
              <Button variant="destructive" size="sm" className="self-start" disabled={deleting} onClick={deleteAccount}>
                {deleting ? 'Deleting…' : 'Delete account'}
              </Button>
            </DashboardCard>
          </SettingsTabPanel>
        </TabsContent>
      </Tabs>
    </div>
  )
}
