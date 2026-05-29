import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import { AppIcon, Button, DashboardCard, FormField, Input, Switch, CardGrid, cn } from '@/components/ui'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useGamificationStore from '@/store/gamificationStore'
import useTheme from '@/hooks/useTheme'
import { auth } from '@/services/firebase'

const SECTIONS = [
  { id: 'account', icon: 'user', title: 'Account', desc: 'Display name, email, password' },
  { id: 'appearance', icon: 'palette', title: 'Appearance', desc: 'Theme, density, motion' },
  { id: 'notifications', icon: 'bell', title: 'Notifications', desc: 'Email & in-app alerts' },
  { id: 'privacy', icon: 'lock', title: 'Privacy & Data', desc: 'Export, delete, visibility' },
]

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

export default function SettingsSection() {
  const { user, addToast, doLogout } = useAppStore()
  const { theme, setTheme } = useTheme()
  const userDoc = useProfileStore((s) => s.user)
  const profileLoaded = useProfileStore((s) => s.loaded)
  const patchUserDoc = useProfileStore((s) => s.patchUserDoc)

  const [active, setActive] = useState('account')
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
    <>
      <SectionHeader
        badge="Preferences"
        badgeClassName="border-purple-500/20 bg-purple-500/10 text-purple-500"
        title="Make Glowminds yours"
        accent="yours"
        subtitle="Account, appearance, and notification controls — everything you can fine-tune."
      />

      <CardGrid variant="sidebar">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="self-start"
        >
          <DashboardCard contentClassName="flex flex-col gap-1 p-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                  active === s.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                <AppIcon name={s.icon} className="size-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[0.84rem] font-semibold">{s.title}</span>
                  <span className="block text-[0.7rem] text-muted-foreground">{s.desc}</span>
                </span>
              </button>
            ))}
          </DashboardCard>
        </motion.div>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="grid min-w-0 grid-cols-1 gap-4 @sm/dashboard:grid-cols-2"
        >
          {active === 'account' && (
            <>
              <DashboardCard titleIcon="user" title="Profile basics" contentClassName="flex flex-col gap-3 @sm/dashboard:col-span-2">
                <FormField label="Display name">
                  <Input defaultValue={user?.displayName || ''} placeholder="Your name" />
                </FormField>
                <FormField label="Email">
                  <Input disabled value={user?.email || ''} />
                </FormField>
                <Button size="sm" className="self-start" onClick={() => addToast('success', 'Saved')}>
                  Save changes
                </Button>
              </DashboardCard>

              <DashboardCard titleIcon="admin" title="Security" contentClassName="flex flex-col gap-3 @sm/dashboard:col-span-2">
                <Button variant="outline" size="sm" className="self-start" onClick={() => addToast('info', 'Password reset email sent')}>
                  Send password reset email
                </Button>
                <Button variant="outline" size="sm" className="self-start" onClick={async () => { await doLogout(); addToast('info', 'Signed out') }}>
                  Sign out
                </Button>
              </DashboardCard>
            </>
          )}

          {active === 'appearance' && (
            <DashboardCard titleIcon="palette" title="Appearance" contentClassName="flex flex-col gap-3">
              <Toggle checked={theme === 'dark'} onChange={onToggleTheme} label="Dark mode" hint="Toggle between light and dark appearance." />
              <Toggle checked={compact} onChange={onToggleCompact} label="Compact density" hint="Tighter spacing across all sections (preview)." />
              <Toggle checked={reducedMotion} onChange={onToggleMotion} label="Reduced motion" hint="Minimise transitions and animations." />
            </DashboardCard>
          )}

          {active === 'notifications' && (
            <DashboardCard titleIcon="bell" title="Notifications" contentClassName="flex flex-col gap-3">
              <Toggle checked={emailNotifs} onChange={onToggleEmail} label="Email notifications" hint="Job alerts, weekly digest, application updates." />
              <Toggle checked={pushNotifs} onChange={onTogglePush} label="In-app notifications" hint="Live job feed pings, streak reminders." />
              <div className="mt-2 border-t border-border pt-3">
                <div className="mb-2 text-[0.66rem] font-bold uppercase tracking-wider text-muted-foreground">Replays</div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={replayOnboarding}>Replay onboarding</Button>
                  <Button variant="outline" size="sm" onClick={replayQuiz}>Reset today’s quiz</Button>
                </div>
              </div>
            </DashboardCard>
          )}

          {active === 'privacy' && (
            <DashboardCard titleIcon="lock" title="Privacy & Data" contentClassName="flex flex-col gap-3">
              <Button variant="outline" size="sm" className="self-start" onClick={() => addToast('info', 'Export request queued')}>
                Export my data
              </Button>
              <Button variant="outline" size="sm" className="self-start" onClick={() => addToast('info', 'Profile visibility settings coming soon')}>
                Profile visibility
              </Button>
              <Button variant="destructive" size="sm" className="self-start" onClick={() => addToast('error', 'Account deletion requires email confirmation')}>
                Delete account
              </Button>
            </DashboardCard>
          )}
        </motion.div>
      </CardGrid>
    </>
  )
}
