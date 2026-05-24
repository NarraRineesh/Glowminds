import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import { CAREER_LEVELS, CAREER_LEVEL_LABEL, normalizeSkills } from '@/constants/schema'

/**
 * Multi-step onboarding wizard. Captures the same fields as the Profile page
 * but spread across digestible screens. Persists incrementally on every Next
 * click so users can resume after a refresh / accidental close.
 *
 * Steps are addressed by string id (not index) so we can reorder / insert
 * without breaking persisted `flags.onboardingStep` (we resolve missing ids
 * to step 0 silently).
 */

const STEP_IDS = [
  'name',
  'career',
  'contact',
  'skills',
  'preferences',
  'links',
  'summary',
  'done',
]

const STEP_META = {
  name: { badge: 'Step 1 · Identity', title: 'Let’s get your name right', accent: 'name right', desc: 'This is how you’ll appear on every resume and cover letter we generate for you.' },
  career: { badge: 'Step 2 · Career level', title: 'Where are you in your career?', accent: 'in your career', desc: 'We use this to tune jobs, AI questions and resume templates for you.' },
  contact: { badge: 'Step 3 · Contact', title: 'How can recruiters reach you?', accent: 'reach you', desc: 'Phone and city help recruiters shortlist faster. All optional — skip if you prefer.' },
  skills: { badge: 'Step 4 · Skills', title: 'What are you good at?', accent: 'good at', desc: 'Add at least 3 technical skills. Tap a suggestion or type your own.' },
  preferences: { badge: 'Step 5 · Job preferences', title: 'What kind of role are you hunting?', accent: 'are you hunting', desc: 'Helps us rank and filter the job board.' },
  links: { badge: 'Step 6 · Online presence', title: 'Where can we find you online?', accent: 'find you online', desc: 'Used in resumes, cover letters and the LinkedIn audit tool.' },
  summary: { badge: 'Step 7 · Pitch', title: 'A two-line pitch about you', accent: 'pitch about you', desc: 'Short and punchy — recruiters spend ~7 seconds on a profile.' },
  done: { badge: 'You’re set', title: 'Welcome aboard 🎉', accent: 'aboard 🎉', desc: 'Your profile is wired up. Pick what to do first — or polish more details in Profile.' },
}

const CAREER_OPTIONS = [
  { id: CAREER_LEVELS.FRESHER, icon: '🌱', title: CAREER_LEVEL_LABEL[CAREER_LEVELS.FRESHER], hint: 'Student, recent grad, internship-only' },
  { id: CAREER_LEVELS.ENTRY, icon: '🚀', title: CAREER_LEVEL_LABEL[CAREER_LEVELS.ENTRY], hint: 'Early career, first job' },
  { id: CAREER_LEVELS.MID, icon: '⚡', title: CAREER_LEVEL_LABEL[CAREER_LEVELS.MID], hint: 'Mid-level individual contributor' },
  { id: CAREER_LEVELS.SENIOR, icon: '🏆', title: CAREER_LEVEL_LABEL[CAREER_LEVELS.SENIOR], hint: 'Senior, lead or staff' },
]

const SKILL_SUGGESTIONS = {
  [CAREER_LEVELS.FRESHER]: ['Python', 'JavaScript', 'React', 'SQL', 'Git', 'Java', 'C++', 'HTML/CSS', 'Communication', 'Problem solving'],
  [CAREER_LEVELS.ENTRY]: ['React', 'Node.js', 'Python', 'SQL', 'AWS', 'TypeScript', 'Docker', 'REST APIs', 'Git', 'Agile'],
  [CAREER_LEVELS.MID]: ['System Design', 'AWS', 'Kubernetes', 'TypeScript', 'React', 'Microservices', 'PostgreSQL', 'CI/CD', 'GraphQL', 'Mentoring'],
  [CAREER_LEVELS.SENIOR]: ['System Design', 'Architecture', 'Leadership', 'AWS', 'Kubernetes', 'Distributed Systems', 'Mentoring', 'Microservices', 'Strategy', 'Hiring'],
}

const JOB_TYPES = ['Full-time', 'Internship', 'Full-time / Internship', 'Contract', 'Part-time', 'Freelance']
const NOTICE_PERIODS = ['Immediate', '15 days', '30 days', '60 days', '90 days']

function emptyDraft({ user, profile }) {
  const skills = normalizeSkills(profile?.skills)
  return {
    firstName: user?.firstName || (user?.displayName || '').split(' ')[0] || '',
    lastName: user?.lastName || (user?.displayName || '').split(' ').slice(1).join(' ') || '',
    careerLevel: profile?.careerLevel || (profile?.isFresher ? CAREER_LEVELS.FRESHER : ''),
    personal: {
      phone: profile?.personal?.phone || '',
      location: profile?.personal?.location || '',
      dob: profile?.personal?.dob || '',
      gender: profile?.personal?.gender || '',
      languages: Array.isArray(profile?.personal?.languages) ? profile.personal.languages.join(', ') : (profile?.personal?.languages || ''),
    },
    skills: [...skills.technical],
    headline: profile?.headline || '',
    summary: profile?.summary || '',
    preferences: {
      jobType: profile?.preferences?.jobType || '',
      preferredLocations: Array.isArray(profile?.preferences?.preferredLocations)
        ? profile.preferences.preferredLocations.join(', ')
        : (profile?.preferences?.preferredLocations || ''),
      expectedCTC: profile?.preferences?.expectedCTC || '',
      noticePeriod: profile?.preferences?.noticePeriod || '',
    },
    links: {
      linkedin: profile?.links?.linkedin || '',
      github: profile?.links?.github || '',
      portfolio: profile?.links?.portfolio || '',
    },
  }
}

export default function OnboardingModal({ open, onClose, onPickAction, initialStepId = 'name' }) {
  const { user, updateDisplayName, addToast } = useAppStore()
  const profile = useProfileStore((s) => s.profile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const patchUserDoc = useProfileStore((s) => s.patchUserDoc)

  const initialDraft = useMemo(() => emptyDraft({ user, profile }), [user, profile])
  const [draft, setDraft] = useState(initialDraft)
  // Reset the draft when the modal is (re)opened so we pick up latest store
  // values, but don't keep clobbering while it's open and the user is typing.
  const lastOpenRef = useRef(false)
  useEffect(() => {
    if (open && !lastOpenRef.current) setDraft(emptyDraft({ user, profile }))
    lastOpenRef.current = open
  }, [open, user, profile])

  const [stepId, setStepId] = useState(initialStepId)
  useEffect(() => {
    if (!open) return
    // Resume at saved step if it's still a known step, else from the start.
    setStepId(STEP_IDS.includes(initialStepId) ? initialStepId : STEP_IDS[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const stepIdx = Math.max(0, STEP_IDS.indexOf(stepId))
  const meta = STEP_META[stepId] || STEP_META.name
  const isFirst = stepIdx === 0
  const isLast = stepIdx === STEP_IDS.length - 1

  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const firstName = draft.firstName?.trim() || user?.firstName || 'there'

  function update(path, value) {
    setDraft((d) => {
      const next = { ...d }
      const segs = path.split('.')
      let cursor = next
      for (let i = 0; i < segs.length - 1; i += 1) {
        cursor[segs[i]] = { ...(cursor[segs[i]] || {}) }
        cursor = cursor[segs[i]]
      }
      cursor[segs[segs.length - 1]] = value
      return next
    })
  }

  function addSkill(raw) {
    const v = String(raw || '').trim()
    if (!v) return
    setDraft((d) => (d.skills.includes(v) ? d : { ...d, skills: [...d.skills, v] }))
    setSkillInput('')
  }

  function removeSkill(skill) {
    setDraft((d) => ({ ...d, skills: d.skills.filter((s) => s !== skill) }))
  }

  function validateStep(id) {
    if (id === 'name') {
      if (!draft.firstName?.trim()) return 'Please enter your first name'
      return null
    }
    if (id === 'career') {
      if (!draft.careerLevel) return 'Pick the option that fits you best'
      return null
    }
    if (id === 'skills') {
      if (draft.skills.length < 3) return 'Add at least 3 skills to continue'
      return null
    }
    return null
  }

  async function persistStep(id) {
    if (id === 'name') {
      if (draft.firstName !== user?.firstName || draft.lastName !== (user?.lastName || '')) {
        await updateDisplayName(draft.firstName.trim(), draft.lastName.trim())
      }
      return
    }
    if (id === 'career') {
      await updateProfile({
        careerLevel: draft.careerLevel,
        isFresher: draft.careerLevel === CAREER_LEVELS.FRESHER,
      })
      return
    }
    if (id === 'contact') {
      await updateProfile({
        personal: {
          phone: draft.personal.phone.trim(),
          location: draft.personal.location.trim(),
          dob: draft.personal.dob,
          gender: draft.personal.gender,
          languages: draft.personal.languages
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
      })
      return
    }
    if (id === 'skills') {
      const existing = normalizeSkills(profile?.skills)
      await updateProfile({ skills: { technical: draft.skills, soft: existing.soft } })
      return
    }
    if (id === 'preferences') {
      await updateProfile({
        preferences: {
          jobType: draft.preferences.jobType,
          preferredLocations: draft.preferences.preferredLocations
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          expectedCTC: draft.preferences.expectedCTC.trim(),
          noticePeriod: draft.preferences.noticePeriod,
        },
      })
      return
    }
    if (id === 'links') {
      await updateProfile({
        links: {
          linkedin: draft.links.linkedin.trim(),
          github: draft.links.github.trim(),
          portfolio: draft.links.portfolio.trim(),
        },
      })
      return
    }
    if (id === 'summary') {
      await updateProfile({ headline: draft.headline.trim(), summary: draft.summary.trim() })
    }
  }

  async function persistProgress(nextStepId, { completed = false } = {}) {
    const existingFlags = useProfileStore.getState().user?.flags || {}
    const idx = STEP_IDS.indexOf(nextStepId)
    const flagsPatch = {
      ...existingFlags,
      onboardingStep: idx >= 0 ? idx : STEP_IDS.length,
    }
    if (completed) {
      flagsPatch.onboardingCompleted = true
      flagsPatch.onboardingCompletedAt = new Date().toISOString()
    }
    await patchUserDoc({ flags: flagsPatch })
  }

  const handleNext = async () => {
    const err = validateStep(stepId)
    if (err) {
      addToast?.('error', `⚠️ ${err}`)
      return
    }
    setSaving(true)
    try {
      await persistStep(stepId)
      if (isLast) {
        await persistProgress('done', { completed: true })
        onClose?.()
      } else {
        const nextId = STEP_IDS[stepIdx + 1]
        await persistProgress(nextId)
        setStepId(nextId)
      }
    } catch (e) {
      console.error('onboarding persist:', e)
      addToast?.('error', '⚠️ Couldn’t save — please try again')
    }
    setSaving(false)
  }

  const handleSkip = async () => {
    if (validateStep(stepId)) {
      addToast?.('error', '⚠️ This step is required')
      return
    }
    if (isLast) {
      await persistProgress('done', { completed: true })
      onClose?.()
      return
    }
    const nextId = STEP_IDS[stepIdx + 1]
    await persistProgress(nextId)
    setStepId(nextId)
  }

  const handleBack = () => {
    if (isFirst) return
    setStepId(STEP_IDS[stepIdx - 1])
  }

  const skipDisabled = stepId === 'name' || stepId === 'career' || stepId === 'skills'

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
            className="relative w-full max-w-[680px] overflow-hidden rounded-2xl border border-[var(--color-bdr2)] bg-[var(--color-surf)] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
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
              <div className="flex items-center gap-1">
                {STEP_IDS.map((id, i) => (
                  <div
                    key={id}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= stepIdx ? 'bg-gradient-to-r from-[var(--color-blu)] to-[var(--color-grn)]' : 'bg-[var(--color-bg3)]'
                    }`}
                  />
                ))}
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-bdr)] bg-[var(--color-blu3)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--color-blu2)]">
                {meta.badge}
              </span>

              <h2 className="mt-3 text-[clamp(1.4rem,3vw,1.8rem)] font-black leading-tight tracking-[-0.02em] text-[var(--color-txt)]">
                {stepId === 'done' ? `${meta.title.replace('aboard', `aboard ${firstName}`)}` : meta.title}
              </h2>
              <p className="mt-2 max-w-xl text-[0.92rem] leading-relaxed text-[var(--color-txt2)]">
                {meta.desc}
              </p>
            </div>

            <div
              className="relative px-6 pb-3 pt-5 sm:px-8"
              style={{ maxHeight: 'min(58vh, 460px)', overflow: 'auto' }}
            >
              {stepId === 'name' && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-[0.78rem] text-[var(--color-txt2)]">
                    <span aria-hidden className="mr-1">🔒</span>
                    <strong className="text-[var(--color-txt)]">Heads up:</strong> this name will appear on every resume and cover letter we generate, and it <strong>can’t be changed later</strong> — type it the way you want recruiters to see it.
                  </div>
                  <div className="fg2">
                    <div className="fg">
                      <label className="fl">First name *</label>
                      <input className="fi" placeholder="Rineesh" value={draft.firstName} onChange={(e) => update('firstName', e.target.value)} />
                    </div>
                    <div className="fg">
                      <label className="fl">Last name</label>
                      <input className="fi" placeholder="Narra" value={draft.lastName} onChange={(e) => update('lastName', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {stepId === 'career' && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {CAREER_OPTIONS.map((opt) => {
                    const active = draft.careerLevel === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => update('careerLevel', opt.id)}
                        className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                          active
                            ? 'border-[var(--color-blu2)] bg-[var(--color-blu3)]'
                            : 'border-[var(--color-bdr)] bg-[var(--color-bg3)] hover:border-[var(--color-bdr2)]'
                        }`}
                      >
                        <span className="text-xl leading-none" aria-hidden>{opt.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.88rem] font-bold text-[var(--color-txt)]">{opt.title}</span>
                          <span className="block text-[0.72rem] text-[var(--color-txt2)]">{opt.hint}</span>
                        </span>
                        {active && <span className="text-[var(--color-blu2)]">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}

              {stepId === 'contact' && (
                <div className="flex flex-col gap-3">
                  <div className="fg2">
                    <div className="fg"><label className="fl">Phone</label><input className="fi" placeholder="+91 98765 43210" value={draft.personal.phone} onChange={(e) => update('personal.phone', e.target.value)} /></div>
                    <div className="fg"><label className="fl">Location</label><input className="fi" placeholder="Bangalore, India" value={draft.personal.location} onChange={(e) => update('personal.location', e.target.value)} /></div>
                  </div>
                  <div className="fg2">
                    <div className="fg"><label className="fl">Date of birth</label><input className="fi" type="date" value={draft.personal.dob} onChange={(e) => update('personal.dob', e.target.value)} /></div>
                    <div className="fg"><label className="fl">Gender</label>
                      <select className="fsl" value={draft.personal.gender} onChange={(e) => update('personal.gender', e.target.value)}>
                        <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div className="fg"><label className="fl">Languages (comma-separated)</label><input className="fi" placeholder="English, Hindi, Telugu" value={draft.personal.languages} onChange={(e) => update('personal.languages', e.target.value)} /></div>
                </div>
              )}

              {stepId === 'skills' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {draft.skills.map((s) => (
                      <span key={s} className="tag tb cursor-pointer" onClick={() => removeSkill(s)}>{s} ✕</span>
                    ))}
                    {draft.skills.length === 0 && (
                      <span className="text-[0.78rem] text-[var(--color-muted)]">No skills yet — pick a few suggestions below or type your own.</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="fi" placeholder="Type and press Enter" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }} />
                    <button type="button" className="btn btn-p btn-sm" onClick={() => addSkill(skillInput)}>Add</button>
                  </div>
                  <div>
                    <div className="text-[0.7rem] font-bold uppercase tracking-[0.5px] text-[var(--color-muted)] mb-1.5">Suggestions</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(SKILL_SUGGESTIONS[draft.careerLevel] || SKILL_SUGGESTIONS[CAREER_LEVELS.ENTRY])
                        .filter((s) => !draft.skills.includes(s))
                        .map((s) => (
                          <button key={s} type="button" onClick={() => addSkill(s)} className="rounded-md border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-2 py-1 text-[0.74rem] text-[var(--color-txt2)] hover:border-[var(--color-blu2)] hover:text-[var(--color-blu2)]">
                            + {s}
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="text-[0.74rem] text-[var(--color-muted)]">
                    Minimum 3 to continue · {draft.skills.length}/3
                  </div>
                </div>
              )}

              {stepId === 'preferences' && (
                <div className="flex flex-col gap-3">
                  <div className="fg2">
                    <div className="fg"><label className="fl">Job type</label>
                      <select className="fsl" value={draft.preferences.jobType} onChange={(e) => update('preferences.jobType', e.target.value)}>
                        <option value="">Select…</option>
                        {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
                      </select>
                    </div>
                    <div className="fg"><label className="fl">Notice period</label>
                      <select className="fsl" value={draft.preferences.noticePeriod} onChange={(e) => update('preferences.noticePeriod', e.target.value)}>
                        <option value="">Select…</option>
                        {NOTICE_PERIODS.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="fg"><label className="fl">Preferred locations (comma-separated)</label><input className="fi" placeholder="Bangalore, Remote, Hyderabad" value={draft.preferences.preferredLocations} onChange={(e) => update('preferences.preferredLocations', e.target.value)} /></div>
                  <div className="fg"><label className="fl">Expected CTC / salary</label><input className="fi" placeholder="6–12 LPA or $80K–$120K" value={draft.preferences.expectedCTC} onChange={(e) => update('preferences.expectedCTC', e.target.value)} /></div>
                </div>
              )}

              {stepId === 'links' && (
                <div className="flex flex-col gap-3">
                  <div className="fg"><label className="fl">LinkedIn URL</label><input className="fi" placeholder="https://linkedin.com/in/yourname" value={draft.links.linkedin} onChange={(e) => update('links.linkedin', e.target.value)} /></div>
                  <div className="fg"><label className="fl">GitHub URL</label><input className="fi" placeholder="https://github.com/yourname" value={draft.links.github} onChange={(e) => update('links.github', e.target.value)} /></div>
                  <div className="fg"><label className="fl">Portfolio URL</label><input className="fi" placeholder="https://yourname.dev" value={draft.links.portfolio} onChange={(e) => update('links.portfolio', e.target.value)} /></div>
                </div>
              )}

              {stepId === 'summary' && (
                <div className="flex flex-col gap-3">
                  <div className="fg"><label className="fl">Headline (1 line)</label><input className="fi" placeholder="B.Tech CS, aspiring SDE" value={draft.headline} onChange={(e) => update('headline', e.target.value)} /></div>
                  <div className="fg"><label className="fl">Summary (2–3 lines)</label><textarea className="fta min-h-[110px]" placeholder="Motivated B.Tech graduate with strong skills in Python, React and cloud. Built 3 full-stack projects deployed to production. Seeking software engineering roles." value={draft.summary} onChange={(e) => update('summary', e.target.value)} /></div>
                </div>
              )}

              {stepId === 'done' && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-3.5 py-3 text-[0.82rem] text-[var(--color-txt2)]">
                    <div className="font-bold text-[var(--color-txt)] mb-1">Quick recap</div>
                    <div>👤 <strong>{draft.firstName} {draft.lastName}</strong>{draft.careerLevel ? ` · ${CAREER_LEVEL_LABEL[draft.careerLevel]}` : ''}</div>
                    {draft.personal.location && <div>📍 {draft.personal.location}</div>}
                    {draft.skills.length > 0 && <div>🛠️ {draft.skills.slice(0, 6).join(', ')}{draft.skills.length > 6 ? ` +${draft.skills.length - 6}` : ''}</div>}
                    {draft.preferences.expectedCTC && <div>💳 {draft.preferences.expectedCTC}</div>}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { id: '/dashboard/jobs', icon: '💼', label: 'Browse matched jobs', hint: 'See live roles ranked to your skills', primary: true },
                      { id: '/dashboard/resume', icon: '📄', label: 'Build your resume', hint: 'ATS-ready templates pre-filled with your data' },
                      { id: '/dashboard/profile', icon: '👤', label: 'Polish my profile', hint: 'Add projects, internships, certifications' },
                    ].map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={async () => {
                          await persistProgress('done', { completed: true })
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
                </div>
              )}
            </div>

            <div className="relative flex items-center justify-between gap-2 border-t border-[var(--color-bdr)] px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={isFirst ? onClose : handleBack}
                className="btn btn-gh btn-sm"
                disabled={saving}
              >
                {isFirst ? 'Close' : '← Back'}
              </button>
              <div className="flex items-center gap-2">
                {!isLast && !skipDisabled && (
                  <button type="button" onClick={handleSkip} className="btn btn-gh btn-sm" disabled={saving}>
                    Skip for now
                  </button>
                )}
                {!isLast && (
                  <button type="button" onClick={handleNext} className="btn btn-p btn-sm" disabled={saving}>
                    {saving ? 'Saving…' : 'Next →'}
                  </button>
                )}
                {isLast && (
                  <button type="button" onClick={handleNext} className="btn btn-p btn-sm" disabled={saving}>
                    {saving ? 'Saving…' : 'Finish 🚀'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
