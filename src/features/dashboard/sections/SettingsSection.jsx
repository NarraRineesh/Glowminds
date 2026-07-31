import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import usePricingConfig from '@/hooks/usePricingConfig'
import useEntitlements from '@/hooks/useEntitlements'
import {
  cardFeaturesAsChecklist,
  highlightedPlan,
  planBillingCadence,
  planPriceLabel,
  resolveUserPlan,
  visiblePlans,
} from '@/constants/pricingDefaults'
import { formatSubscriptionEndDate, isActiveProSubscription } from '@/constants/plans'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { loadUserUsage } from '@/utils/firestoreCollections'
import { apiFetch } from '@/services/apiClient'
import { Link, useNavigate } from 'react-router-dom'
import { normalizeGamification } from '@/constants/schema'
import { updateGamificationPrefs, xpToNextLevel } from '@/services/gamification'
import { StreakCard } from '@/features/dashboard/components/v2'

const SECTIONS = [
  { id: 'account', icon: 'user', title: 'Account', desc: 'Profile and security' },
  { id: 'gamification', icon: 'star', title: 'Gamification', desc: 'Streak, XP, badges' },
  { id: 'billing', icon: 'credit-card', title: 'Billing', desc: 'Plan, renewal, upgrade' },
  { id: 'usage', icon: 'chart', title: 'Usage', desc: 'Tool activity counters' },
  { id: 'appearance', icon: 'palette', title: 'Appearance', desc: 'Theme, density, motion' },
  { id: 'notifications', icon: 'bell', title: 'Notifications', desc: 'Email & in-app alerts' },
  { id: 'privacy', icon: 'lock', title: 'Privacy & Data', desc: 'Export, delete, visibility' },
  { id: 'integrations', icon: 'puzzle', title: 'Integrations', desc: 'Connect external tools' },
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

function planLabel(sub, currentPlan) {
  if (currentPlan?.label) return currentPlan.label
  if (!sub) return null
  if (sub.tier === 'pro') return 'Glowminds Pro'
  return null
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-muted px-3 py-3 sm:items-center sm:gap-4 sm:px-3.5">
      <span className="min-w-0 flex-1">
        <span className="block text-[0.86rem] font-bold text-foreground">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.72rem] leading-snug text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} className="mt-0.5 shrink-0 sm:mt-0" />
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

function SettingsUpgradeBanner({ upgradeLoading, startUpgrade, upgradePlan, onGoToBilling }) {
  const price = planPriceLabel(upgradePlan) || 'Pro'
  const highlight = (upgradePlan?.cardFeatures || []).find((f) => f.badge)?.text
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <AppIcon name="sparkle" className="size-4 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Unlock {upgradePlan?.label || 'Glowminds Pro'}
          </p>
          <p className="text-xs text-muted-foreground">
            {upgradeLoading
              ? 'Opening checkout…'
              : `${price}${highlight ? ` · ${highlight}` : upgradePlan?.desc ? ` · ${upgradePlan.desc}` : ''}`}
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          size="sm"
          className="min-h-10 w-full sm:min-h-8 sm:w-auto"
          disabled={upgradeLoading || !upgradePlan}
          onClick={() => void startUpgrade({ plan: upgradePlan?.id || upgradePlan?.key || 'yearly' })}
        >
          {upgradeLoading ? 'Processing…' : 'Upgrade'}
        </Button>
        <Button type="button" variant="outline" size="sm" className="min-h-10 w-full sm:min-h-8 sm:w-auto" onClick={onGoToBilling}>
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
    <header className="mb-3 border-b border-border/80 pb-3 sm:mb-5 sm:pb-4">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 sm:size-9">
          <AppIcon name={section.icon} className="size-4 text-primary" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">{section.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{section.desc}</p>
        </div>
      </div>
    </header>
  )
}

function SettingsTabPanel({ activeSection, children }) {
  return (
    <section className="w-full min-w-0 max-w-full" aria-labelledby={`settings-panel-${activeSection.id}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection.id}
          id={`settings-panel-${activeSection.id}`}
          {...contentMotion}
          className="flex w-full min-w-0 max-w-full flex-col gap-4"
        >
          <SettingsPanelHeader section={activeSection} />
          {children}
        </motion.div>
      </AnimatePresence>
    </section>
  )
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
  currentPlan,
  upgradePlans,
  billingBlurb,
  termsBillingText,
  onCancelSubscription,
  cancelling,
}) {
  const planTitle = currentPlan?.label || (isPro ? 'Glowminds Pro' : 'Free')
  const priceLabel = planPriceLabel(currentPlan)
  const cadence = planBillingCadence(currentPlan)
  const includedFeatures = cardFeaturesAsChecklist(currentPlan)
  const includedSummary =
    currentPlan?.desc
    || (typeof currentPlan?.aiCreditsPerPeriod === 'number'
      ? `${planTitle} includes ${currentPlan.aiCreditsPerPeriod} AI credits per billing period.`
      : null)

  const billingPlan = planLabel(subscription, currentPlan)
  const startLabel = formatSubDate(subscription?.startDate)
  const paymentRef = subscription?.razorpayPaymentId
    ? `···${String(subscription.razorpayPaymentId).slice(-8)}`
    : null

  const primaryUpgrade = upgradePlans.find((p) => p.highlighted) || upgradePlans[0] || null
  const isLifetime = String(currentPlan?.key || '').toLowerCase() === 'lifetime'
    || String(currentPlan?.period || '').toLowerCase().includes('life')

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard titleIcon="credit-card" title="Billing & plan" contentClassName="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current plan</p>
              <p className="mt-1 text-lg font-black text-foreground">{planTitle}</p>
              {(priceLabel || cadence) && (
                <p className="mt-1 text-sm font-medium text-foreground">
                  {[priceLabel || null, cadence].filter(Boolean).join(' · ')}
                </p>
              )}
              {proActive && renewalLabel && !isLifetime && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {subscription?.status === 'active' ? 'Renews' : 'Expires'} on {renewalLabel}
                </p>
              )}
              {includedSummary && (
                <p className="mt-1 text-sm text-muted-foreground">{includedSummary}</p>
              )}
              {isPro && !proActive && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Your subscription is not active. Upgrade to restore plan features.
                </p>
              )}
            </div>
            {isPro && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
                {proActive ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>

        {!isPro && upgradePlans.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {upgradePlans.map((plan) => {
              const planRef = plan.id || plan.key
              const label = planPriceLabel(plan) || plan.label
              const isPrimary = primaryUpgrade && (primaryUpgrade.id === plan.id || primaryUpgrade.key === plan.key)
              return (
                <Button
                  key={planRef}
                  variant={isPrimary ? 'default' : 'outline'}
                  disabled={upgradeLoading}
                  onClick={() => void startUpgrade({ plan: planRef })}
                >
                  {upgradeLoading ? 'Opening checkout…' : `${plan.label || 'Upgrade'} — ${label}`}
                </Button>
              )
            })}
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              View full pricing
            </Button>
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        titleIcon="sparkle"
        title="Included in your plan"
        contentClassName="flex flex-col gap-3"
      >
        {includedFeatures.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Plan features will appear here once pricing config loads.{' '}
            <Link to="/pricing" className="font-semibold text-primary hover:underline">See pricing</Link>.
          </p>
        ) : (
          <FeatureChecklist items={includedFeatures} variant={isPro ? 'pro' : 'included'} />
        )}
      </DashboardCard>

      {!isPro && upgradePlans.length > 0 && (
        <DashboardCard titleIcon="lightning" title="Upgrade options" contentClassName="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {billingBlurb || 'Secure checkout via Razorpay (UPI, cards, net banking).'}
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {upgradePlans.map((plan) => {
              const planRef = plan.id || plan.key
              const highlights = cardFeaturesAsChecklist(plan).filter((f) => f.highlight || f.included)
              return (
                <li key={planRef} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{plan.label}</p>
                      {plan.badge && (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-primary">{planPriceLabel(plan)}</p>
                    {plan.desc && <p className="mt-1 text-xs text-muted-foreground">{plan.desc}</p>}
                    {highlights.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {highlights.slice(0, 4).map((f) => (
                          <li key={f.text} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <AppIcon name="check" className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                            <span>{f.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 self-start"
                    disabled={upgradeLoading}
                    onClick={() => void startUpgrade({ plan: planRef })}
                  >
                    {upgradeLoading ? 'Opening…' : 'Choose plan'}
                  </Button>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Full feature comparison is on the{' '}
            <Link to="/pricing" className="font-semibold text-primary hover:underline">pricing page</Link>.
          </p>
        </DashboardCard>
      )}

      {(termsBillingText || !isPro) && (
        <SettingsInfoBox icon="info">
          <p className="font-medium text-foreground">Billing & cancellation</p>
          <p>
            {termsBillingText ||
              'Paid plans are billed through Razorpay. Cancel before your renewal date to avoid the next charge; you keep access until the period ends.'}
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
          <BillingDetail label="Price" value={priceLabel || null} />
          <BillingDetail label="Cadence" value={cadence} />
          <BillingDetail label="Status" value={subscription?.status ? String(subscription.status) : null} />
          <BillingDetail label="Started" value={startLabel} />
          {!isLifetime && (
            <BillingDetail label={subscription?.status === 'active' ? 'Next renewal' : 'Access until'} value={renewalLabel} />
          )}
          <BillingDetail label="Payment reference" value={paymentRef} />
          {subscription?.status === 'cancelled' || subscription?.cancelAtPeriodEnd ? (
            <p className="border-t border-border pt-3 text-sm text-muted-foreground">
              Cancellation scheduled. You keep access until {renewalLabel || 'the end of your billing period'}.
            </p>
          ) : !isLifetime ? (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">
                Cancel anytime. You keep access until the end of your billing period.
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
          ) : null}
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
  const {
    config,
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
  // Prefer server entitlements.plans (same source as access) when present.
  const billingConfig = Array.isArray(entitlements?.plans) && entitlements.plans.length
    ? { ...config, plans: entitlements.plans }
    : config
  const currentPlan = resolveUserPlan(billingConfig, subscription, {
    isPro,
    planId: entitlements?.planId || null,
  })
  const upgradePlan = highlightedPlan(billingConfig)
  const upgradePlans = visiblePlans(billingConfig).filter(
    (p) => p && p.amountPaise > 0 && (p.tier === 'pro' || !p.tier),
  )

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
    <div className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-3 sm:gap-4">
      <Tabs value={active} onValueChange={setActive} className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-3">
        {!isPro && (
          <SettingsUpgradeBanner
            upgradeLoading={upgradeLoading}
            startUpgrade={startUpgrade}
            upgradePlan={upgradePlan}
            onGoToBilling={() => setActive('billing')}
          />
        )}

        <div className="flex w-full min-w-0 max-w-full flex-col gap-2 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start lg:gap-4">
          {/* Mobile: in-flow horizontal nav (not sticky — sticky was overlapping content). Desktop: side rail. */}
          <aside className="w-full min-w-0 max-w-full lg:sticky lg:top-4 lg:self-start">
            <nav
              aria-label="Settings sections"
              className="flex w-full min-w-0 max-w-full snap-x snap-mandatory gap-0.5 overflow-x-auto overscroll-x-contain rounded-lg border border-border bg-card p-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-xl lg:p-1.5 lg:snap-none [&::-webkit-scrollbar]:hidden"
            >
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActive(section.id)}
                  className={cn(
                    'flex min-h-8 shrink-0 snap-start items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs transition-colors lg:min-h-0 lg:w-full lg:gap-2 lg:rounded-lg lg:px-3 lg:py-2 lg:text-sm',
                    active === section.id
                      ? 'bg-primary/10 font-semibold text-primary ring-1 ring-primary/20 lg:bg-elevated lg:text-foreground lg:ring-0'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <AppIcon name={section.icon} className="size-3.5 shrink-0 lg:size-4" />
                  <span className="whitespace-nowrap">{section.title}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex w-full min-w-0 max-w-full flex-col gap-0">
        {/* Keep TabsTriggers for a11y sync — visually hidden; nav buttons drive value */}
        <TabsList className="sr-only">
          {SECTIONS.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>{section.title}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="account" className="mt-0 w-full min-w-0 max-w-full outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.account}>
            <DashboardCard titleIcon="shield" title="Security" className="w-full min-w-0" contentClassName="flex min-w-0 flex-col gap-3">
              {user?.email && (
                <FormField label="Email" hint="Sign-in address — contact support to change." className="min-w-0">
                  <Input disabled readOnly value={user.email} className="max-w-full" />
                </FormField>
              )}
              <p className="text-sm leading-relaxed text-muted-foreground">
                Password reset sends a link to{' '}
                <span className="inline break-all font-medium text-foreground">{user?.email || 'your email'}</span>
                . Google sign-in accounts use Google to manage passwords.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 w-full sm:min-h-8 sm:w-auto sm:self-start"
                disabled={resettingPassword || !user?.email}
                onClick={() => void sendPasswordReset()}
              >
                {resettingPassword ? 'Sending…' : 'Send password reset email'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 w-full sm:min-h-8 sm:w-auto sm:self-start"
                onClick={async () => { await doLogout(); addToast('info', 'Signed out') }}
              >
                Sign out
              </Button>
            </DashboardCard>
          </SettingsTabPanel>
        </TabsContent>

        <TabsContent value="gamification" className="mt-1 w-full min-w-0 max-w-full outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.gamification}>
            {(() => {
              const g = normalizeGamification(profile?.gamification)
              const xpMeta = xpToNextLevel(g)
              const badges = [
                ...(g.badges || []).map((b) => ({ id: b.id, title: b.title || b.id, subtitle: 'Unlocked' })),
                { id: 'offers', title: '5 offers', locked: true },
                { id: 'streak30', title: '30-day streak', locked: true },
              ].slice(0, 6)
              return (
                <>
                  <DashboardCard titleIcon="star" title="Level & streak" contentClassName="space-y-3">
                    <StreakCard
                      streak={g.streak}
                      bestStreak={g.bestStreak}
                      level={g.level}
                      xp={g.xpWeek || xpMeta.xpInLevel}
                      xpToNext={xpMeta.xpToNext}
                      weekActive={g.weekActive}
                      badges={badges}
                    />
                  </DashboardCard>
                  <DashboardCard titleIcon="sliders" title="Preferences" contentClassName="flex flex-col gap-2">
                    <Toggle
                      label="Show streak on dashboard"
                      hint="Hide the streak card from the Command Center"
                      checked={g.prefs?.showStreakOnDashboard !== false}
                      onChange={(v) => {
                        const uid = user?.uid
                        if (!uid) return
                        updateGamificationPrefs(uid, { showStreakOnDashboard: v })
                          .then(() => updateProfile({ gamification: { ...g, prefs: { ...g.prefs, showStreakOnDashboard: v } } }))
                          .catch(() => addToast('error', 'Could not save preference'))
                      }}
                    />
                    <Toggle
                      label="Celebrate level-ups"
                      checked={g.prefs?.celebrateLevelUps !== false}
                      onChange={(v) => {
                        const uid = user?.uid
                        if (!uid) return
                        updateGamificationPrefs(uid, { celebrateLevelUps: v })
                          .then(() => updateProfile({ gamification: { ...g, prefs: { ...g.prefs, celebrateLevelUps: v } } }))
                          .catch(() => {})
                      }}
                    />
                    <Toggle
                      label="XP reminders when streak at risk"
                      checked={g.prefs?.streakReminders !== false}
                      onChange={(v) => {
                        const uid = user?.uid
                        if (!uid) return
                        updateGamificationPrefs(uid, { streakReminders: v })
                          .then(() => updateProfile({ gamification: { ...g, prefs: { ...g.prefs, streakReminders: v } } }))
                          .catch(() => {})
                      }}
                    />
                  </DashboardCard>
                  <DashboardCard titleIcon="info" title="How XP works" contentClassName="space-y-2 text-sm text-muted-foreground">
                    <p className="m-0 flex justify-between"><span>Daily check-in</span><span className="font-mono">+10</span></p>
                    <p className="m-0 flex justify-between"><span>ATS improvement</span><span className="font-mono">+15</span></p>
                    <p className="m-0 flex justify-between"><span>Apply to a role</span><span className="font-mono">+20</span></p>
                    <p className="m-0 flex justify-between"><span>Mock interview</span><span className="font-mono">+30</span></p>
                  </DashboardCard>
                </>
              )
            })()}
          </SettingsTabPanel>
        </TabsContent>

        <TabsContent value="billing" className="mt-1 w-full min-w-0 max-w-full outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.billing}>
            <BillingPanel
              subscription={subscription}
              proActive={proActive}
              isPro={isPro}
              renewalLabel={renewalLabel}
              upgradeLoading={upgradeLoading}
              startUpgrade={startUpgrade}
              navigate={navigate}
              currentPlan={currentPlan}
              upgradePlans={upgradePlans}
              billingBlurb={marketing?.billingBlurb}
              termsBillingText={marketing?.termsBillingText}
              onCancelSubscription={cancelSubscription}
              cancelling={cancelling}
            />
          </SettingsTabPanel>
        </TabsContent>

        <TabsContent value="usage" className="mt-1 w-full min-w-0 max-w-full outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.usage}>
            <UsagePanel uid={user?.uid} />
          </SettingsTabPanel>
        </TabsContent>

        <TabsContent value="appearance" className="mt-1 w-full min-w-0 max-w-full outline-none">
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

        <TabsContent value="notifications" className="mt-1 w-full min-w-0 max-w-full outline-none">
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

        <TabsContent value="privacy" className="mt-1 w-full min-w-0 max-w-full outline-none">
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

        <TabsContent value="integrations" className="mt-0 w-full min-w-0 max-w-full outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.integrations}>
            <DashboardCard titleIcon="puzzle" title="Connected tools" contentClassName="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Link Chrome Assist, calendar, and job boards here. More connectors ship as they leave beta.
              </p>
              <ul className="space-y-2">
                {[
                  ['Chrome Assist', 'Import LinkedIn + capture JDs', true],
                  ['Google Calendar', 'Interview reminders', false],
                  ['Job boards', 'Auto-sync applications', false],
                ].map(([name, hint, soon]) => (
                  <li
                    key={name}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <div>
                      <p className="m-0 text-sm font-medium">{name}</p>
                      <p className="m-0 text-xs text-muted-foreground">{hint}</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" disabled>
                      {soon ? 'Coming soon' : 'Connect'}
                    </Button>
                  </li>
                ))}
              </ul>
            </DashboardCard>
          </SettingsTabPanel>
        </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
