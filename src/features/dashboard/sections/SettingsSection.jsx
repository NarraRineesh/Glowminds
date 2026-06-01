import { useState, useEffect, useMemo } from 'react'
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
  StatusBadge,
  cn,
} from '@/components/ui'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useGamificationStore from '@/store/gamificationStore'
import useTheme from '@/hooks/useTheme'
import useIsPro from '@/hooks/useIsPro'
import useUpgradePro from '@/hooks/useUpgradePro'
import usePricingConfig, { useYearlyPriceLabel } from '@/hooks/usePricingConfig'
import { formatSubscriptionEndDate, isActiveProSubscription } from '@/constants/plans'
import { FREE_LIMITS as DEFAULT_FREE_LIMITS } from '@/constants/plans'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { Link, useNavigate } from 'react-router-dom'
import LevelProgress from '@/components/dashboard/LevelProgress'
import StreakCard from '@/components/dashboard/StreakCard'
import { computeXpProgress } from '@/utils/gamification'
import { badgeXp } from '@/constants/badgesCatalog'

const SECTIONS = [
  { id: 'account', icon: 'user', title: 'Account', desc: 'Level, badges & security' },
  { id: 'billing', icon: 'credit-card', title: 'Billing', desc: 'Plan, renewal, upgrade' },
  { id: 'appearance', icon: 'palette', title: 'Appearance', desc: 'Theme, density, motion' },
  { id: 'notifications', icon: 'bell', title: 'Notifications', desc: 'Email & in-app alerts' },
  { id: 'privacy', icon: 'lock', title: 'Privacy & Data', desc: 'Export, delete, visibility' },
]

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

const BADGE_TIER_STYLE = {
  bronze: { ring: '#cd7f32', glow: 'rgba(205,127,50,.15)' },
  silver: { ring: '#c0c0c0', glow: 'rgba(192,192,192,.15)' },
  gold: { ring: '#f59e0b', glow: 'rgba(245,158,11,.18)' },
}

function GamificationSettingsPanel() {
  const gamification = useGamificationStore((s) => s.gamification)
  const catalog = useGamificationStore((s) => s.catalog)
  const catalogLoaded = useGamificationStore((s) => s.catalogLoaded)
  const loadCatalog = useGamificationStore((s) => s.loadCatalog)

  useEffect(() => {
    if (!catalogLoaded) loadCatalog()
  }, [catalogLoaded, loadCatalog])

  const earnedSet = useMemo(
    () => new Set(gamification?.earnedBadgeIds || []),
    [gamification?.earnedBadgeIds],
  )

  const badges = useMemo(
    () => (catalog || [])
      .map((b) => ({ ...b, unlocked: earnedSet.has(b.id), xp: badgeXp(b) }))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [catalog, earnedSet],
  )

  const unlocked = badges.filter((b) => b.unlocked)
  const badgeXpTotal = unlocked.reduce((sum, b) => sum + b.xp, 0)
  const pct = badges.length ? Math.round((unlocked.length / badges.length) * 100) : 0
  const nextBadge = badges.find((b) => !b.unlocked)
  const totalXp = gamification?.xp || 0
  const xpProgress = computeXpProgress(totalXp, gamification?.level)
  const streak = gamification?.streak || {}

  return (
    <div className="flex flex-col gap-4">
      <SettingsInfoBox icon="trophy">
        <p className="font-medium text-foreground">Levels & badges</p>
        <p>
          Earn XP from badges, daily quizzes, and activity. Your level reflects total XP;
          badges unlock as you complete profile, applications, interviews, and streak milestones.
        </p>
      </SettingsInfoBox>

      <div className="grid gap-4 @lg/dashboard:grid-cols-2">
        <LevelProgress
          level={xpProgress.level}
          xp={xpProgress.xp}
          xpToNext={xpProgress.xpToNext}
        />
        <StreakCard
          currentStreak={streak.current || 0}
          longestStreak={streak.longest || 0}
        />
      </div>

      <DashboardCard
        titleIcon="trophy"
        title="Badges"
        action={
          <Link
            to="/dashboard/badges"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View all badges →
          </Link>
        }
        contentClassName="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="default">{unlocked.length}/{badges.length || '—'} unlocked</StatusBadge>
          <StatusBadge tone="success">{pct}% complete</StatusBadge>
          <span className="text-sm text-muted-foreground">
            {totalXp.toLocaleString()} total XP · {badgeXpTotal.toLocaleString()} from badges
          </span>
        </div>

        {nextBadge && (
          <p className="text-sm text-muted-foreground">
            Next up: <span className="font-medium text-foreground">{nextBadge.name}</span>
            {' — '}
            {nextBadge.description}
            <span className="text-primary"> (+{nextBadge.xp} XP)</span>
          </p>
        )}

        {badges.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {catalogLoaded ? 'No badges in catalog yet.' : 'Loading badges…'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 @xl/dashboard:grid-cols-4">
            {badges.map((b) => {
              const tier = BADGE_TIER_STYLE[b.tier] || BADGE_TIER_STYLE.bronze
              return (
                <div
                  key={b.id}
                  className={cn(
                    'relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center',
                    b.unlocked
                      ? 'border-border bg-card'
                      : 'border-border bg-muted/60 opacity-75',
                  )}
                  title={b.unlocked ? `${b.name} — +${b.xp} XP` : b.description}
                >
                  {b.unlocked && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-xl"
                      style={{ background: `radial-gradient(circle at 50% 0%, ${tier.glow}, transparent 65%)` }}
                    />
                  )}
                  <div
                    className={cn(
                      'relative flex size-11 items-center justify-center rounded-full',
                      b.unlocked ? 'bg-background' : 'bg-muted',
                    )}
                    style={{
                      boxShadow: b.unlocked ? `0 0 0 2px ${tier.ring}44` : undefined,
                    }}
                  >
                    {b.unlocked ? (
                      <AppIcon name={b.icon} className="size-5" />
                    ) : (
                      <AppIcon name="lock" className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="relative text-xs font-bold leading-tight text-foreground">
                    {b.unlocked ? b.name : 'Locked'}
                  </div>
                  <div className="relative line-clamp-2 text-[0.65rem] leading-snug text-muted-foreground">
                    {b.unlocked ? b.description : 'Keep using Glowminds to unlock'}
                  </div>
                  <span
                    className="relative mt-auto text-[0.58rem] font-bold uppercase tracking-wider"
                    style={{ color: b.unlocked ? tier.ring : undefined }}
                  >
                    {b.tier || 'bronze'} · +{b.xp} XP
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </DashboardCard>
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

function BillingPanel({
  subscription,
  proActive,
  isPro,
  isAdmin,
  renewalLabel,
  upgradeLoading,
  startUpgrade,
  navigate,
  plans,
  freeLimits,
  freeFeatures,
  proFeatures,
  pricingComparison,
  yearlyPriceLabel,
  billingBlurb,
  termsBillingText,
}) {
  const planTitle = isAdmin && !proActive
    ? 'Glowminds Pro (Admin)'
    : proActive || (isPro && !proActive)
      ? 'Glowminds Pro'
      : 'Free'

  const billingPlan = planLabel(subscription, plans)
  const startLabel = formatSubDate(subscription?.startDate)
  const paymentRef = subscription?.razorpayPaymentId
    ? `···${String(subscription.razorpayPaymentId).slice(-8)}`
    : null

  const freeSummary = `Job search, profile, up to ${freeLimits.resumes} resumes (${freeLimits.template} template), and ${freeLimits.applications} application slots.`

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard titleIcon="credit-card" title="Billing & plan" contentClassName="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current plan</p>
              <p className="mt-1 text-lg font-black text-foreground">{planTitle}</p>
              {isAdmin && !proActive && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Full Pro access via admin — no separate subscription required.
                </p>
              )}
              {proActive && renewalLabel && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {subscription?.status === 'active' ? 'Renews' : 'Expires'} on {renewalLabel}
                  {subscription?.plan === 'yearly' ? ' · Yearly billing' : subscription?.plan === 'monthly' ? ' · Monthly billing' : ''}
                </p>
              )}
              {!isPro && (
                <p className="mt-1 text-sm text-muted-foreground">{freeSummary}</p>
              )}
              {isPro && !proActive && !isAdmin && (
                <p className="mt-1 text-sm text-muted-foreground">Your subscription is not active. Upgrade to restore Pro features.</p>
              )}
            </div>
            {isPro && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
                {isAdmin && !proActive ? 'Admin access' : 'Pro active'}
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
                    <td className="px-3 py-2 text-muted-foreground">{row.free}</td>
                    <td className="px-3 py-2 font-medium text-primary">{row.pro}</td>
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
          <p className="border-t border-border pt-3 text-sm text-muted-foreground">
            To cancel, email support before your renewal date. You keep Pro access until the end of your billing period.
          </p>
        </DashboardCard>
      )}

      {isPro && !proActive && isAdmin && (
        <DashboardCard titleIcon="admin" title="Admin billing" contentClassName="text-sm text-muted-foreground">
          Admin accounts are not billed through Razorpay. Contact the platform owner if you need to change access.
        </DashboardCard>
      )}
    </div>
  )
}

export default function SettingsSection() {
  const { user, addToast, doLogout } = useAppStore()
  const isAdmin = !!user?.isAdmin
  const { theme, setTheme } = useTheme()
  const isPro = useIsPro()
  const { startUpgrade, loading: upgradeLoading } = useUpgradePro()
  const navigate = useNavigate()
  const yearlyPriceLabel = useYearlyPriceLabel()
  const {
    plans,
    freeLimits: pricingFreeLimits,
    freeFeatures,
    proFeatures,
    pricingComparison,
    marketing,
  } = usePricingConfig()
  const freeLimits = pricingFreeLimits || DEFAULT_FREE_LIMITS
  const userDoc = useProfileStore((s) => s.user)
  const profileLoaded = useProfileStore((s) => s.loaded)
  const patchUserDoc = useProfileStore((s) => s.patchUserDoc)

  const [active, setActive] = useState('account')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    if (!profileLoaded) return
    const s = userDoc?.settings || {}
    setEmailNotifs(s.emailNotifications !== false)
    setPushNotifs(!!s.pushNotifications)
    setReducedMotion(!!s.reducedMotion)
    setCompact(!!s.compactDensity)
  }, [profileLoaded, userDoc])

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

  const subscription = userDoc?.subscription
  const proActive = isActiveProSubscription(subscription)
  const renewalLabel = formatSubscriptionEndDate(subscription)

  const replayOnboarding = async () => {
    try {
      const flags = useProfileStore.getState().user?.flags || {}
      await useProfileStore.getState().patchUserDoc({
        flags: { ...flags, onboardingCompleted: false, onboardingStep: 0 },
      })
      addToast('info', 'Onboarding will replay on next dashboard visit')
    } catch (err) {
      console.error('replayOnboarding:', err)
      addToast('error', 'Could not reset onboarding')
    }
  }

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

  const replayQuiz = async () => {
    try {
      const flags = useProfileStore.getState().user?.flags || {}
      const gam = useGamificationStore.getState().gamification || {}
      await useProfileStore.getState().patchUserDoc({
        flags: { ...flags, quizPromptSeenAt: null },
        gamification: { ...gam, dailyQuizLastAnsweredDate: '' },
      })
      useGamificationStore.setState((s) => ({
        gamification: { ...s.gamification, dailyQuizLastAnsweredDate: '' },
      }))
      const uid = auth.currentUser?.uid
      try {
        if (uid) localStorage.removeItem(`nx_quiz_prompt_seen_${uid}`)
      } catch { /* ignore */ }
      addToast('info', 'Today’s quiz reset')
    } catch (err) {
      console.error('replayQuiz:', err)
      addToast('error', 'Could not reset today’s quiz')
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
                className="shrink-0 gap-1.5 px-3 py-2.5 text-sm after:bottom-0 sm:px-4"
              >
                <AppIcon name={section.icon} className="size-4" />
                <span>{section.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="account" className="mt-1 outline-none">
          <SettingsTabPanel activeSection={SECTION_BY_ID.account}>
            <GamificationSettingsPanel />

            <DashboardCard titleIcon="admin" title="Security" contentClassName="flex flex-col gap-3">
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
              isAdmin={isAdmin}
              renewalLabel={renewalLabel}
              upgradeLoading={upgradeLoading}
              startUpgrade={startUpgrade}
              navigate={navigate}
              plans={plans}
              freeLimits={freeLimits}
              freeFeatures={freeFeatures}
              proFeatures={proFeatures}
              pricingComparison={pricingComparison}
              yearlyPriceLabel={yearlyPriceLabel}
              billingBlurb={marketing?.billingBlurb}
              termsBillingText={marketing?.termsBillingText}
            />
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
                on the dashboard — they don’t require browser push permission.
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
                hint="Badges and toasts inside Glowminds: new job matches, streak reminders, and gamification nudges while you’re active."
              />
              <div className="mt-2 border-t border-border pt-3">
                <p className="mb-2 text-sm text-muted-foreground">
                  Re-run guided flows without losing your profile data.
                </p>
                <div className="mb-2 text-[0.66rem] font-bold uppercase tracking-wider text-muted-foreground">Replays</div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={replayOnboarding}>Replay onboarding</Button>
                  <Button variant="outline" size="sm" onClick={replayQuiz}>Reset today’s quiz</Button>
                </div>
              </div>
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
                Includes your profile, saved jobs, applications, resume metadata, and account settings.
                We’ll prepare a download link by email — typically within a few business days.
              </p>
              <Button variant="outline" size="sm" className="self-start" onClick={() => addToast('info', 'Export request queued — we’ll email you when ready')}>
                Request data export
              </Button>
            </DashboardCard>
            <DashboardCard titleIcon="eye" title="Profile visibility" contentClassName="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Control whether optional profile fields appear on shared resume links. Full visibility controls are rolling out soon.
              </p>
              <Button variant="outline" size="sm" className="self-start" onClick={() => addToast('info', 'Profile visibility settings coming soon')}>
                Manage visibility
              </Button>
            </DashboardCard>
            <DashboardCard titleIcon="trash" title="Delete account" contentClassName="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Permanently removes your account, profile, and application history after email confirmation.
                Active Pro subscriptions should be cancelled first; billing records may be retained as required by law.
              </p>
              <Button variant="destructive" size="sm" className="self-start" onClick={() => addToast('error', 'Account deletion requires email confirmation — contact support')}>
                Delete account
              </Button>
            </DashboardCard>
          </SettingsTabPanel>
        </TabsContent>
      </Tabs>
    </div>
  )
}
