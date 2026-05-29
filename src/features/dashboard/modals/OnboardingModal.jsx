import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AppDialog,
  AppIcon,
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  FormField,
  FormRow,
  Input,
  Progress,
  Select,
  Textarea,
} from '@/components/ui'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import { CAREER_LEVELS, CAREER_LEVEL_LABEL, normalizeSkills } from '@/constants/schema'

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
  name: {
    badge: 'Step 1 · Identity',
    title: 'Let’s get your name right',
    accent: 'name right',
    desc: 'This is how you’ll appear on every resume and cover letter we generate for you.',
  },
  career: {
    badge: 'Step 2 · Career level',
    title: 'Where are you in your career?',
    accent: 'in your career',
    desc: 'We use this to tune jobs, AI questions and resume templates for you.',
  },
  contact: {
    badge: 'Step 3 · Contact',
    title: 'How can recruiters reach you?',
    accent: 'reach you',
    desc: 'Phone and city help recruiters shortlist faster. All optional — skip if you prefer.',
  },
  skills: {
    badge: 'Step 4 · Skills',
    title: 'What are you good at?',
    accent: 'good at',
    desc: 'Add at least 3 technical skills. Tap a suggestion or type your own.',
  },
  preferences: {
    badge: 'Step 5 · Job preferences',
    title: 'What kind of role are you hunting?',
    accent: 'are you hunting',
    desc: 'Helps us rank and filter the job board.',
  },
  links: {
    badge: 'Step 6 · Online presence',
    title: 'Where can we find you online?',
    accent: 'find you online',
    desc: 'Used in resumes, cover letters and the LinkedIn audit tool.',
  },
  summary: {
    badge: 'Step 7 · Pitch',
    title: 'A two-line pitch about you',
    accent: 'pitch about you',
    desc: 'Short and punchy — recruiters spend ~7 seconds on a profile.',
  },
  done: {
    badge: 'You’re set',
    title: 'Welcome aboard',
    accent: 'aboard',
    desc: 'Your profile is wired up. Pick what to do first — or polish more details in Profile.',
  },
}

const CAREER_OPTIONS = [
  { id: CAREER_LEVELS.FRESHER, icon: 'plant', title: CAREER_LEVEL_LABEL[CAREER_LEVELS.FRESHER], hint: 'Student, recent grad, internship-only' },
  { id: CAREER_LEVELS.ENTRY, icon: 'rocket', title: CAREER_LEVEL_LABEL[CAREER_LEVELS.ENTRY], hint: 'Early career, first job' },
  { id: CAREER_LEVELS.MID, icon: 'lightning', title: CAREER_LEVEL_LABEL[CAREER_LEVELS.MID], hint: 'Mid-level individual contributor' },
  { id: CAREER_LEVELS.SENIOR, icon: 'trophy', title: CAREER_LEVEL_LABEL[CAREER_LEVELS.SENIOR], hint: 'Senior, lead or staff' },
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

function StepTitle({ title, accent, firstName, stepId }) {
  if (stepId === 'done') {
    return <>Welcome aboard{firstName ? `, ${firstName}` : ''}</>
  }
  if (accent && title.includes(accent)) {
    const [pre, post] = title.split(accent)
    return (
      <>
        {pre}
        <span className="text-primary">{accent}</span>
        {post}
      </>
    )
  }
  return title
}

export default function OnboardingModal({ open, onClose, onPickAction, initialStepId = 'name' }) {
  const { user, updateDisplayName, addToast } = useAppStore()
  const profile = useProfileStore((s) => s.profile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const patchUserDoc = useProfileStore((s) => s.patchUserDoc)

  const initialDraft = useMemo(() => emptyDraft({ user, profile }), [user, profile])
  const [draft, setDraft] = useState(initialDraft)
  const lastOpenRef = useRef(false)
  useEffect(() => {
    if (open && !lastOpenRef.current) setDraft(emptyDraft({ user, profile }))
    lastOpenRef.current = open
  }, [open, user, profile])

  const [stepId, setStepId] = useState(initialStepId)
  useEffect(() => {
    if (!open) return
    setStepId(STEP_IDS.includes(initialStepId) ? initialStepId : STEP_IDS[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const stepIdx = Math.max(0, STEP_IDS.indexOf(stepId))
  const meta = STEP_META[stepId] || STEP_META.name
  const isFirst = stepIdx === 0
  const isLast = stepIdx === STEP_IDS.length - 1
  const progressValue = Math.round(((stepIdx + 1) / STEP_IDS.length) * 100)

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
      addToast?.('error', err)
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
      addToast?.('error', 'Couldn’t save — please try again')
    }
    setSaving(false)
  }

  const handleSkip = async () => {
    if (validateStep(stepId)) {
      addToast?.('error', 'This step is required')
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
    <AppDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose?.() }}
      size="lg"
      title={<StepTitle title={meta.title} accent={meta.accent} firstName={firstName} stepId={stepId} />}
      description={meta.desc}
      contentClassName="max-h-[min(58vh,460px)] overflow-auto gap-4"
      footer={(
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={isFirst ? onClose : handleBack}
            disabled={saving}
          >
            {isFirst ? 'Close' : 'Back'}
          </Button>
          <div className="flex items-center gap-2">
            {!isLast && !skipDisabled && (
              <Button type="button" variant="outline" onClick={handleSkip} disabled={saving}>
                Skip for now
              </Button>
            )}
            {!isLast && (
              <Button type="button" onClick={handleNext} disabled={saving}>
                {saving ? 'Saving…' : 'Continue'}
              </Button>
            )}
            {isLast && (
              <Button type="button" onClick={handleNext} disabled={saving}>
                {saving ? 'Saving…' : 'Finish'}
              </Button>
            )}
          </div>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/10 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-primary"
            >
              {meta.badge}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Step {stepIdx + 1} of {STEP_IDS.length}
            </span>
          </div>
          <Progress value={progressValue} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
        </div>

        {stepId === 'name' && (
          <div className="flex flex-col gap-3">
            <Alert>
              <AppIcon name="lock" className="size-4" />
              <AlertDescription>
                This name appears on every resume and cover letter we generate, and it{' '}
                <strong className="text-foreground">can’t be changed later</strong> — type it the way recruiters should see it.
              </AlertDescription>
            </Alert>
            <FormRow>
              <FormField label="First name *">
                <Input placeholder="Rineesh" value={draft.firstName} onChange={(e) => update('firstName', e.target.value)} />
              </FormField>
              <FormField label="Last name">
                <Input placeholder="Narra" value={draft.lastName} onChange={(e) => update('lastName', e.target.value)} />
              </FormField>
            </FormRow>
          </div>
        )}

        {stepId === 'career' && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CAREER_OPTIONS.map((opt) => {
              const active = draft.careerLevel === opt.id
              return (
                <Button
                  key={opt.id}
                  type="button"
                  variant="outline"
                  onClick={() => update('careerLevel', opt.id)}
                  className={cn(
                    'h-auto items-start justify-start gap-3 p-3 text-left',
                    active && 'border-primary bg-primary/5 ring-1 ring-primary/20',
                  )}
                >
                  <AppIcon name={opt.icon} className="size-5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{opt.title}</span>
                    <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                  </span>
                  {active && <AppIcon name="check" className="size-4 shrink-0 text-primary" weight="bold" />}
                </Button>
              )
            })}
          </div>
        )}

        {stepId === 'contact' && (
          <div className="flex flex-col gap-3">
            <FormRow>
              <FormField label="Phone">
                <Input placeholder="+91 98765 43210" value={draft.personal.phone} onChange={(e) => update('personal.phone', e.target.value)} />
              </FormField>
              <FormField label="Location">
                <Input placeholder="Bangalore, India" value={draft.personal.location} onChange={(e) => update('personal.location', e.target.value)} />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Date of birth">
                <Input type="date" value={draft.personal.dob} onChange={(e) => update('personal.dob', e.target.value)} />
              </FormField>
              <FormField label="Gender">
                <Select value={draft.personal.gender} onChange={(e) => update('personal.gender', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </Select>
              </FormField>
            </FormRow>
            <FormField label="Languages (comma-separated)">
              <Input placeholder="English, Hindi, Telugu" value={draft.personal.languages} onChange={(e) => update('personal.languages', e.target.value)} />
            </FormField>
          </div>
        )}

        {stepId === 'skills' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {draft.skills.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="cursor-pointer border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
                  onClick={() => removeSkill(s)}
                >
                  {s} ×
                </Badge>
              ))}
              {draft.skills.length === 0 && (
                <span className="text-sm text-muted-foreground">No skills yet — pick suggestions below or type your own.</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="Type and press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
              />
              <Button type="button" variant="outline" onClick={() => addSkill(skillInput)}>Add</Button>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {(SKILL_SUGGESTIONS[draft.careerLevel] || SKILL_SUGGESTIONS[CAREER_LEVELS.ENTRY])
                  .filter((s) => !draft.skills.includes(s))
                  .map((s) => (
                    <Button key={s} type="button" variant="outline" size="sm" onClick={() => addSkill(s)}>
                      + {s}
                    </Button>
                  ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 3 to continue · {draft.skills.length}/3
            </p>
          </div>
        )}

        {stepId === 'preferences' && (
          <div className="flex flex-col gap-3">
            <FormRow>
              <FormField label="Job type">
                <Select value={draft.preferences.jobType} onChange={(e) => update('preferences.jobType', e.target.value)}>
                  <option value="">Select…</option>
                  {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
                </Select>
              </FormField>
              <FormField label="Notice period">
                <Select value={draft.preferences.noticePeriod} onChange={(e) => update('preferences.noticePeriod', e.target.value)}>
                  <option value="">Select…</option>
                  {NOTICE_PERIODS.map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </FormField>
            </FormRow>
            <FormField label="Preferred locations (comma-separated)">
              <Input placeholder="Bangalore, Remote, Hyderabad" value={draft.preferences.preferredLocations} onChange={(e) => update('preferences.preferredLocations', e.target.value)} />
            </FormField>
            <FormField label="Expected CTC / salary">
              <Input placeholder="6–12 LPA or $80K–$120K" value={draft.preferences.expectedCTC} onChange={(e) => update('preferences.expectedCTC', e.target.value)} />
            </FormField>
          </div>
        )}

        {stepId === 'links' && (
          <div className="flex flex-col gap-3">
            <FormField label="LinkedIn URL">
              <Input placeholder="https://linkedin.com/in/yourname" value={draft.links.linkedin} onChange={(e) => update('links.linkedin', e.target.value)} />
            </FormField>
            <FormField label="GitHub URL">
              <Input placeholder="https://github.com/yourname" value={draft.links.github} onChange={(e) => update('links.github', e.target.value)} />
            </FormField>
            <FormField label="Portfolio URL">
              <Input placeholder="https://yourname.dev" value={draft.links.portfolio} onChange={(e) => update('links.portfolio', e.target.value)} />
            </FormField>
          </div>
        )}

        {stepId === 'summary' && (
          <div className="flex flex-col gap-3">
            <FormField label="Headline (1 line)">
              <Input placeholder="B.Tech CS, aspiring SDE" value={draft.headline} onChange={(e) => update('headline', e.target.value)} />
            </FormField>
            <FormField label="Summary (2–3 lines)">
              <Textarea
                className="min-h-[110px]"
                placeholder="Motivated B.Tech graduate with strong skills in Python, React and cloud. Built 3 full-stack projects deployed to production. Seeking software engineering roles."
                value={draft.summary}
                onChange={(e) => update('summary', e.target.value)}
              />
            </FormField>
          </div>
        )}

        {stepId === 'done' && (
          <div className="flex flex-col gap-3">
            <Card>
              <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Quick recap</p>
                <div className="flex items-center gap-2">
                  <AppIcon name="user" className="size-4 shrink-0" />
                  <span>
                    <strong className="text-foreground">{draft.firstName} {draft.lastName}</strong>
                    {draft.careerLevel ? ` · ${CAREER_LEVEL_LABEL[draft.careerLevel]}` : ''}
                  </span>
                </div>
                {draft.personal.location && (
                  <div className="flex items-center gap-2">
                    <AppIcon name="map-pin" className="size-4 shrink-0" />
                    {draft.personal.location}
                  </div>
                )}
                {draft.skills.length > 0 && (
                  <div className="flex items-center gap-2">
                    <AppIcon name="wrench" className="size-4 shrink-0" />
                    {draft.skills.slice(0, 6).join(', ')}{draft.skills.length > 6 ? ` +${draft.skills.length - 6}` : ''}
                  </div>
                )}
                {draft.preferences.expectedCTC && (
                  <div className="flex items-center gap-2">
                    <AppIcon name="salary" className="size-4 shrink-0" />
                    {draft.preferences.expectedCTC}
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex flex-col gap-2">
              {[
                { id: '/dashboard/jobs', icon: 'jobs', label: 'Browse matched jobs', hint: 'See live roles ranked to your skills', primary: true },
                { id: '/dashboard/resume', icon: 'resume', label: 'Build your resume', hint: 'ATS-ready templates pre-filled with your data' },
                { id: '/dashboard/profile', icon: 'user', label: 'Polish my profile', hint: 'Add projects, internships, certifications' },
              ].map((a) => (
                <Button
                  key={a.id}
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await persistProgress('done', { completed: true })
                    onPickAction?.(a.id)
                    onClose?.()
                  }}
                  className={cn(
                    'h-auto items-start justify-start gap-3 p-3 text-left',
                    a.primary && 'border-primary bg-primary/5',
                  )}
                >
                  <AppIcon name={a.icon} className="size-5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{a.label}</span>
                    <span className="block text-xs text-muted-foreground">{a.hint}</span>
                  </span>
                  <span className="shrink-0 text-muted-foreground" aria-hidden>→</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppDialog>
  )
}

