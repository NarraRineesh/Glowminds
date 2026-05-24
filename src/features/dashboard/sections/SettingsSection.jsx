import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useGamificationStore from '@/store/gamificationStore'
import useTheme from '@/hooks/useTheme'
import { auth } from '@/services/firebase'
import '@/styles/cards.css'
import '@/styles/dashboard.css'
import '@/styles/forms.css'

const SECTIONS = [
  {
    id: 'account',
    icon: '👤',
    title: 'Account',
    desc: 'Display name, email, password',
  },
  {
    id: 'appearance',
    icon: '🎨',
    title: 'Appearance',
    desc: 'Theme, density, motion',
  },
  {
    id: 'notifications',
    icon: '🔔',
    title: 'Notifications',
    desc: 'Email & in-app alerts',
  },
  {
    id: 'privacy',
    icon: '🔒',
    title: 'Privacy & Data',
    desc: 'Export, delete, visibility',
  },
]

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-3.5 py-3 text-left transition-colors hover:border-[var(--color-bdr2)]`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[0.86rem] font-bold text-[var(--color-txt)]">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.72rem] text-[var(--color-txt2)]">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[var(--color-blu)]' : 'bg-[var(--color-bg2)] ring-1 ring-[var(--color-bdr)]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export default function SettingsSection() {
  const { user, addToast, doLogout } = useAppStore()
  const { theme, toggleTheme } = useTheme()
  const userDoc = useProfileStore((s) => s.user)
  const profileLoaded = useProfileStore((s) => s.loaded)
  const patchUserDoc = useProfileStore((s) => s.patchUserDoc)

  const [active, setActive] = useState('account')
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [compact, setCompact] = useState(false)

  // Hydrate from the stored settings the first time we have them.
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

  // Persist toggle changes (debounced via microtask) to users/{uid}.settings.
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
  const onToggleTheme = () => {
    toggleTheme()
    const next = theme === 'dark' ? 'light' : 'dark'
    persistSettings({ theme: next })
  }

  const replayOnboarding = async () => {
    try {
      const flags = useProfileStore.getState().user?.flags || {}
      await useProfileStore.getState().patchUserDoc({
        flags: { ...flags, onboardingCompleted: false, onboardingStep: 0 },
      })
      addToast('info', '👋 Onboarding will replay on next dashboard visit')
    } catch (err) {
      console.error('replayOnboarding:', err)
      addToast('error', '⚠️ Could not reset onboarding')
    }
  }

  const replayQuiz = async () => {
    try {
      const flags = useProfileStore.getState().user?.flags || {}
      const gam = useGamificationStore.getState().gamification || {}
      // Clear the prompt flag and today's quiz date so the card/modal can
      // fire again. Login streak is unchanged.
      await useProfileStore.getState().patchUserDoc({
        flags: { ...flags, quizPromptSeenAt: null },
        gamification: {
          ...gam,
          dailyQuizLastAnsweredDate: '',
        },
      })
      useGamificationStore.setState((s) => ({
        gamification: {
          ...s.gamification,
          dailyQuizLastAnsweredDate: '',
        },
      }))

      const uid = auth.currentUser?.uid
      try {
        if (uid) localStorage.removeItem(`nx_quiz_prompt_seen_${uid}`)
      } catch { /* ignore */ }
      addToast('info', '🧠 Today’s quiz reset')
    } catch (err) {
      console.error('replayQuiz:', err)
      addToast('error', '⚠️ Could not reset today’s quiz')
    }
  }

  return (
    <>
      <SectionHeader
        badge="Preferences"
        badgeBg="var(--color-prp2)"
        badgeColor="var(--color-prp)"
        title="Make Glowminds yours"
        accent="yours"
        subtitle="Account, appearance, and notification controls — everything you can fine-tune."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="card self-start"
        >
          <div className="cb flex flex-col gap-1 p-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  active === s.id
                    ? 'bg-[var(--color-blu3)] text-[var(--color-blu2)]'
                    : 'text-[var(--color-txt)] hover:bg-[var(--color-bg3)]'
                }`}
              >
                <span className="text-lg" aria-hidden>{s.icon}</span>
                <span className="min-w-0">
                  <span className="block text-[0.84rem] font-semibold">{s.title}</span>
                  <span className="block text-[0.7rem] text-[var(--color-txt2)]">{s.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4"
        >
          {active === 'account' && (
            <>
              <div className="card">
                <div className="ch"><h3>👤 Profile basics</h3></div>
                <div className="cb flex flex-col gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[0.66rem] font-bold uppercase tracking-wider text-[var(--color-muted)]">Display name</span>
                    <input className="fi" defaultValue={user?.displayName || ''} placeholder="Your name" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[0.66rem] font-bold uppercase tracking-wider text-[var(--color-muted)]">Email</span>
                    <input className="fi" disabled value={user?.email || ''} />
                  </label>
                  <button type="button" className="btn btn-p btn-sm self-start" onClick={() => addToast('success', '✅ Saved')}>
                    Save changes
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="ch"><h3>🛡️ Security</h3></div>
                <div className="cb flex flex-col gap-3">
                  <button type="button" className="btn btn-o btn-sm self-start" onClick={() => addToast('info', '📧 Password reset email sent')}>
                    Send password reset email
                  </button>
                  <button type="button" className="btn btn-o btn-sm self-start" onClick={async () => { await doLogout(); addToast('info', '👋 Signed out') }}>
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}

          {active === 'appearance' && (
            <div className="card">
              <div className="ch"><h3>🎨 Appearance</h3></div>
              <div className="cb flex flex-col gap-3">
                <Toggle
                  checked={theme === 'dark'}
                  onChange={onToggleTheme}
                  label="Dark mode"
                  hint="Follow OS by default — toggle to override."
                />
                <Toggle
                  checked={compact}
                  onChange={onToggleCompact}
                  label="Compact density"
                  hint="Tighter spacing across all sections (preview)."
                />
                <Toggle
                  checked={reducedMotion}
                  onChange={onToggleMotion}
                  label="Reduced motion"
                  hint="Minimise transitions and animations."
                />
              </div>
            </div>
          )}

          {active === 'notifications' && (
            <div className="card">
              <div className="ch"><h3>🔔 Notifications</h3></div>
              <div className="cb flex flex-col gap-3">
                <Toggle checked={emailNotifs} onChange={onToggleEmail} label="Email notifications" hint="Job alerts, weekly digest, application updates." />
                <Toggle checked={pushNotifs} onChange={onTogglePush} label="In-app notifications" hint="Live job feed pings, streak reminders." />

                <div className="mt-2 border-t border-[var(--color-bdr)] pt-3">
                  <div className="mb-2 text-[0.66rem] font-bold uppercase tracking-wider text-[var(--color-muted)]">Replays</div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-o btn-sm" onClick={replayOnboarding}>
                      Replay onboarding
                    </button>
                    <button type="button" className="btn btn-o btn-sm" onClick={replayQuiz}>
                      Reset today’s quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'privacy' && (
            <div className="card">
              <div className="ch"><h3>🔒 Privacy & Data</h3></div>
              <div className="cb flex flex-col gap-3">
                <button type="button" className="btn btn-o btn-sm self-start" onClick={() => addToast('info', '📦 Export request queued')}>
                  Export my data
                </button>
                <button type="button" className="btn btn-o btn-sm self-start" onClick={() => addToast('info', '👀 Profile visibility settings coming soon')}>
                  Profile visibility
                </button>
                <button
                  type="button"
                  className="btn btn-sm self-start"
                  style={{ background: 'var(--color-red2)', color: 'var(--color-red)', border: '1px solid var(--color-red)' }}
                  onClick={() => addToast('error', '⚠️ Account deletion requires email confirmation')}
                >
                  Delete account
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}
