import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import useAppStore from '@/store/authStore'
import useTheme from '@/hooks/useTheme'
import '@/styles/cards.css'
import '@/styles/dashboard.css'
import '@/styles/forms.css'

const ONBOARDING_KEY = 'nx_onboarding_done'
const DAILY_QUIZ_KEY = 'nx_daily_quiz_state'

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

  const [active, setActive] = useState('account')
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    document.documentElement.style.setProperty('--prefers-reduced-motion', reducedMotion ? 'reduce' : 'no-preference')
  }, [reducedMotion])

  const replayOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY)
    addToast('info', '👋 Onboarding will replay on next dashboard visit')
  }

  const replayQuiz = () => {
    localStorage.removeItem(DAILY_QUIZ_KEY)
    addToast('info', '🧠 Today’s quiz reset')
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
                  onChange={toggleTheme}
                  label="Dark mode"
                  hint="Follow OS by default — toggle to override."
                />
                <Toggle
                  checked={compact}
                  onChange={setCompact}
                  label="Compact density"
                  hint="Tighter spacing across all sections (preview)."
                />
                <Toggle
                  checked={reducedMotion}
                  onChange={setReducedMotion}
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
                <Toggle checked={emailNotifs} onChange={setEmailNotifs} label="Email notifications" hint="Job alerts, weekly digest, application updates." />
                <Toggle checked={pushNotifs} onChange={setPushNotifs} label="In-app notifications" hint="Live job feed pings, streak reminders." />

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
