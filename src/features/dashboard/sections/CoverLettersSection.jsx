import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import useAppStore from '@/store/authStore'
import '@/styles/cards.css'
import '@/styles/dashboard.css'
import '@/styles/forms.css'

const TEMPLATES = [
  {
    id: 'concise',
    name: 'Concise & Direct',
    desc: '3 short paragraphs. Best for engineering & product roles.',
    ico: '⚡',
    accent: 'var(--color-blu)',
  },
  {
    id: 'story',
    name: 'Story-Driven',
    desc: 'Open with a hook, follow with proof, close with a call-to-action.',
    ico: '📖',
    accent: 'var(--color-grn)',
  },
  {
    id: 'referral',
    name: 'Warm Referral',
    desc: 'Mentions a mutual connection upfront — for employee referrals.',
    ico: '🤝',
    accent: 'var(--color-gold)',
  },
  {
    id: 'fresher',
    name: 'Fresher / Internship',
    desc: 'Leads with academic projects and learnability.',
    ico: '🎓',
    accent: 'var(--color-prp)',
  },
]

function buildLetter(template, vars) {
  const { yourName = 'Your Name', role = 'the role', company = 'the company', skill = 'your top skill' } = vars
  switch (template) {
    case 'story':
      return `Dear Hiring Manager at ${company},

When I built my first project around ${skill}, I learned the most important lesson of my career: ship before it's perfect. That's the mindset I'd bring to ${role}.

In my last project I used ${skill} to ${'<add a measurable outcome>'} — and I'd love to bring that same momentum to ${company}.

Could we set up a 15-minute chat next week?

Warmly,
${yourName}`
    case 'referral':
      return `Dear Hiring Manager at ${company},

${'<Mutual connection>'} suggested I reach out about ${role}. Their description of the team's bar for craft matched what I look for in my next role.

Most relevant to ${role}: I've been working with ${skill} and recently ${'<one tangible result>'}.

Happy to send my resume and a short writeup. Thanks for your time!

— ${yourName}`
    case 'fresher':
      return `Dear Hiring Manager at ${company},

I'm a final-year student deeply interested in ${role}. I've spent the last 6 months building projects with ${skill}, including ${'<headline project>'}.

While I don't have full-time experience yet, I bring strong fundamentals, fast iteration, and an obsession with shipping. I'd love a chance to interview.

Best,
${yourName}`
    case 'concise':
    default:
      return `Dear Hiring Manager at ${company},

I'm applying for ${role}. My experience with ${skill} maps directly to what your team is building — most recently I ${'<add a measurable outcome>'}.

I'd be excited to discuss how I can contribute. My resume is attached.

Best regards,
${yourName}`
  }
}

export default function CoverLettersSection() {
  const { user, addToast } = useAppStore()
  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Your Name'

  const [template, setTemplate] = useState('concise')
  const [role, setRole] = useState('Frontend Engineer')
  const [company, setCompany] = useState('Acme Inc')
  const [skill, setSkill] = useState('React + TypeScript')

  const letter = buildLetter(template, { yourName: firstName, role, company, skill })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter)
      addToast('success', '📋 Cover letter copied to clipboard')
    } catch {
      addToast('error', '⚠️ Could not copy — please select & copy manually')
    }
  }

  return (
    <>
      <SectionHeader
        badge="Generate · 1-click"
        badgeBg="var(--color-prp2)"
        badgeColor="var(--color-prp)"
        title="Cover letters that get replies"
        accent="get replies"
        subtitle="Pick a template, drop in the role and company, and we'll draft a ready-to-edit cover letter in seconds."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="card"
          >
            <div className="ch"><h3>🎨 Pick a template</h3></div>
            <div className="cb flex flex-col gap-2">
              {TEMPLATES.map((t) => {
                const active = template === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                      active
                        ? 'border-[var(--color-bdr2)] bg-[var(--color-blu3)]'
                        : 'border-[var(--color-bdr)] bg-[var(--color-bg3)] hover:border-[var(--color-bdr2)]'
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                      style={{ background: `${t.accent}22`, color: t.accent }}
                      aria-hidden
                    >
                      {t.ico}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.82rem] font-bold text-[var(--color-txt)]">{t.name}</span>
                      <span className="mt-0.5 block text-[0.7rem] leading-snug text-[var(--color-txt2)]">
                        {t.desc}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="card"
          >
            <div className="ch"><h3>✏️ Variables</h3></div>
            <div className="cb flex flex-col gap-3">
              <label className="block">
                <span className="mb-1 block text-[0.66rem] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Role
                </span>
                <input className="fi" value={role} onChange={(e) => setRole(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[0.66rem] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Company
                </span>
                <input className="fi" value={company} onChange={(e) => setCompany(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[0.66rem] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Top relevant skill
                </span>
                <input className="fi" value={skill} onChange={(e) => setSkill(e.target.value)} />
              </label>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="card"
        >
          <div className="ch">
            <h3>📨 Preview</h3>
            <div className="flex gap-2">
              <button type="button" className="btn btn-gh btn-sm" onClick={copy}>
                Copy
              </button>
              <button
                type="button"
                className="btn btn-p btn-sm"
                onClick={() => addToast('info', '💾 Saving cover letters lands soon')}
              >
                Save
              </button>
            </div>
          </div>
          <div className="cb">
            <pre className="whitespace-pre-wrap rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg2)] p-4 font-[Outfit,system-ui,sans-serif] text-[0.86rem] leading-relaxed text-[var(--color-txt)]">
              {letter}
            </pre>
          </div>
        </motion.div>
      </div>
    </>
  )
}
