import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '@/store/authStore'

const STEPS = [
  {
    id: 'welcome',
    badge: 'Step 1 · Welcome',
    title: 'Welcome to Glowminds',
    accent: 'Glowminds',
    desc: 'Your AI career copilot — built specifically for students and fresh graduates in India.',
    points: [
      { ico: '💼', t: '12,400+ remote roles refreshed daily' },
      { ico: '🤖', t: 'AI tools across resume, interview, salary, LinkedIn' },
      { ico: '📈', t: 'Track every application end-to-end' },
    ],
    cta: 'Let’s get started',
  },
  {
    id: 'tools',
    badge: 'Step 2 · Toolkit',
    title: 'Everything you need in one place',
    accent: 'one place',
    desc: 'Most users land their first interview within 14 days. Here’s what’s waiting for you on the sidebar.',
    grid: [
      { ico: '📄', t: 'Resume Studio', d: 'ATS-ready templates' },
      { ico: '💼', t: 'Job Board', d: '50+ portals · 1 click' },
      { ico: '🎯', t: 'JD Matcher', d: 'See your % fit' },
      { ico: '✉️', t: 'Cover Letters', d: '4 proven formats' },
      { ico: '🔗', t: 'LinkedIn Audit', d: '9-point optimizer' },
      { ico: '🧠', t: 'Daily Quiz', d: '+10 XP daily' },
    ],
    cta: 'Show me more',
  },
  {
    id: 'first',
    badge: 'Step 3 · First win',
    title: 'Pick your first quick win',
    accent: 'first quick win',
    desc: 'We recommend completing your profile first — every other tool gets sharper once we know you.',
    actions: [
      { id: '/dashboard/profile', icon: '👤', label: 'Complete my profile', primary: true, hint: '4 minutes · unlocks AI matching' },
      { id: '/dashboard/resume', icon: '📄', label: 'Build my resume', hint: 'Pick a template' },
      { id: '/dashboard/jobs', icon: '💼', label: 'Browse jobs', hint: 'See live matches now' },
    ],
    cta: 'Skip for now',
  },
]

export default function OnboardingModal({ open, onClose, onPickAction }) {
  const { user } = useAppStore()
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  const next = () => {
    if (step >= STEPS.length - 1) {
      onClose?.()
    } else {
      setStep((s) => s + 1)
    }
  }

  const back = () => setStep((s) => Math.max(0, s - 1))

  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[700] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-[var(--color-bdr2)] bg-[var(--color-surf)] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
            style={{ fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 50% at 0% 0%, var(--color-glow), transparent 60%), radial-gradient(ellipse 50% 50% at 100% 100%, var(--color-glow2), transparent 60%)',
              }}
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-bdr)] bg-[var(--color-surf2)] text-[var(--color-txt2)] transition-colors hover:bg-[var(--color-red2)] hover:text-[var(--color-red)]"
            >
              ✕
            </button>

            <div className="relative px-6 pt-6 sm:px-8 sm:pt-8">
              <div className="flex items-center gap-1.5">
                {STEPS.map((s, i) => (
                  <div
                    key={s.id}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= step ? 'bg-gradient-to-r from-[var(--color-blu)] to-[var(--color-grn)]' : 'bg-[var(--color-bg3)]'
                    }`}
                  />
                ))}
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-bdr)] bg-[var(--color-blu3)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--color-blu2)]">
                {current.badge}
              </span>

              <h2 className="mt-3 text-[clamp(1.5rem,3.2vw,2rem)] font-black leading-tight tracking-[-0.02em] text-[var(--color-txt)]">
                {step === 0 ? `Hey ${firstName}, ` : ''}
                {current.accent && current.title.includes(current.accent) ? (
                  <>
                    {current.title.split(current.accent)[0]}
                    <span className="bg-gradient-to-r from-[var(--color-blu2)] via-[var(--color-grn)] to-[var(--color-blu)] bg-clip-text text-transparent">
                      {current.accent}
                    </span>
                    {current.title.split(current.accent)[1]}
                  </>
                ) : (
                  current.title
                )}
              </h2>
              <p className="mt-2 max-w-xl text-[0.92rem] leading-relaxed text-[var(--color-txt2)]">
                {current.desc}
              </p>
            </div>

            <div className="relative px-6 pb-2 pt-5 sm:px-8">
              {current.points && (
                <ul className="flex flex-col gap-2.5">
                  {current.points.map((p) => (
                    <li
                      key={p.t}
                      className="flex items-center gap-3 rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-3.5 py-2.5"
                    >
                      <span className="text-xl leading-none" aria-hidden>{p.ico}</span>
                      <span className="text-[0.88rem] font-medium text-[var(--color-txt)]">{p.t}</span>
                    </li>
                  ))}
                </ul>
              )}

              {current.grid && (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {current.grid.map((g) => (
                    <div
                      key={g.t}
                      className="rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg3)] p-3 transition-colors hover:border-[var(--color-bdr2)]"
                    >
                      <div className="mb-1 text-xl" aria-hidden>{g.ico}</div>
                      <div className="text-[0.82rem] font-bold text-[var(--color-txt)]">{g.t}</div>
                      <div className="text-[0.68rem] text-[var(--color-txt2)]">{g.d}</div>
                    </div>
                  ))}
                </div>
              )}

              {current.actions && (
                <div className="flex flex-col gap-2.5">
                  {current.actions.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        onPickAction?.(a.id)
                        onClose?.()
                      }}
                      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                        a.primary
                          ? 'border-[var(--color-bdr2)] bg-gradient-to-br from-[var(--color-blu3)] to-[var(--color-grn2)]'
                          : 'border-[var(--color-bdr)] bg-[var(--color-bg3)] hover:border-[var(--color-bdr2)]'
                      }`}
                    >
                      <span className="text-2xl leading-none" aria-hidden>{a.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.92rem] font-bold text-[var(--color-txt)]">{a.label}</span>
                        <span className="block text-[0.74rem] text-[var(--color-txt2)]">{a.hint}</span>
                      </span>
                      <span className="text-[var(--color-blu2)] transition-transform group-hover:translate-x-1">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex items-center justify-between gap-2 border-t border-[var(--color-bdr)] px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={step === 0 ? onClose : back}
                className="btn btn-gh btn-sm"
              >
                {step === 0 ? 'Skip' : '← Back'}
              </button>
              <button type="button" onClick={next} className="btn btn-p btn-sm">
                {step >= STEPS.length - 1 ? 'Get started 🚀' : 'Next →'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
