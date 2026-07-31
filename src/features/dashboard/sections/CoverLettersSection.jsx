import { useEffect, useState } from 'react'
import SectionHeader from '@/components/dashboard/SectionHeader'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import UpgradeGate from '@/components/UpgradeGate'
import { Button, DashboardCard, FormField, Input, Textarea, cn } from '@/components/ui'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useEntitlements from '@/hooks/useEntitlements'
import useIsLg from '@/hooks/useIsLg'
import { apiFetch } from '@/services/apiClient'
import { getPreferredRole, normalizeCoverLetterDrafts } from '@/constants/schema'

const TEMPLATES = [
  { id: 'concise', name: 'Concise & Direct', desc: '3 short paragraphs. Best for engineering & product roles.', ico: 'lightning', tone: 'primary' },
  { id: 'story', name: 'Story-Driven', desc: 'Open with a hook, follow with proof, close with a call-to-action.', ico: 'book', tone: 'emerald' },
  { id: 'referral', name: 'Warm Referral', desc: 'Mentions a mutual connection upfront — for employee referrals.', ico: 'handshake', tone: 'amber' },
  { id: 'fresher', name: 'Fresher / Internship', desc: 'Leads with academic projects and learnability.', ico: 'graduation', tone: 'purple' },
]

const TEMPLATE_TONE = {
  primary: 'border-primary/30 bg-primary/10 text-primary',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  purple: 'border-purple-500/30 bg-purple-500/10 text-purple-500',
}

const MODES = [
  { id: 'cover_letter', label: 'Cover letter', desc: 'Formal application letter' },
  { id: 'cold_email', label: 'Cold email', desc: 'Short recruiter outreach' },
]

function buildLetter(template, vars) {
  const { yourName = 'Your Name', role = 'the role', company = 'the company', skill = 'your top skill' } = vars
  switch (template) {
    case 'story':
      return `Dear Hiring Manager at ${company},

When I built my first project around ${skill}, I learned the most important lesson of my career: ship before it's perfect. That's the mindset I'd bring to ${role}.

In my last project I used ${skill} to deliver measurable impact — and I'd love to bring that same momentum to ${company}.

Could we set up a 15-minute chat next week?

Warmly,
${yourName}`
    case 'referral':
      return `Dear Hiring Manager at ${company},

A mutual connection suggested I reach out about ${role}. Their description of the team's bar for craft matched what I look for in my next role.

Most relevant to ${role}: I've been working with ${skill} and recently shipped tangible results I'd be happy to walk through.

Happy to send my resume and a short writeup. Thanks for your time!

— ${yourName}`
    case 'fresher':
      return `Dear Hiring Manager at ${company},

I'm a final-year student deeply interested in ${role}. I've spent the last 6 months building projects with ${skill}, including a headline project I'm proud to demo.

While I don't have full-time experience yet, I bring strong fundamentals, fast iteration, and an obsession with shipping. I'd love a chance to interview.

Best,
${yourName}`
    case 'concise':
    default:
      return `Dear Hiring Manager at ${company},

I'm applying for ${role}. My experience with ${skill} maps directly to what your team is building — most recently I delivered outcomes I'd be glad to detail in an interview.

I'd be excited to discuss how I can contribute. My resume is attached.

Best regards,
${yourName}`
  }
}

function draftId() {
  return `cl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export default function CoverLettersSection() {
  const isLg = useIsLg()
  const { user, addToast } = useAppStore()
  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Your Name'
  const { credits, creditCosts, refresh, error: entError } = useEntitlements()

  const profile = useProfileStore((s) => s.profile)
  const loadProfile = useProfileStore((s) => s.load)
  const updateProfile = useProfileStore((s) => s.updateProfile)

  const [template, setTemplate] = useState('concise')
  const [mode, setMode] = useState('cover_letter')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [skill, setSkill] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [aiLetter, setAiLetter] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  const drafts = normalizeCoverLetterDrafts(profile?.coverLetterDrafts)

  useEffect(() => {
    loadProfile()
      .then(() => {
        const p = useProfileStore.getState().profile
        if (!role) setRole(getPreferredRole(p))
        if (!skill) {
          const tech = p?.skills?.technical || []
          setSkill(tech.slice(0, 2).join(', ') || 'problem solving')
        }
      })
      .catch(() => {})
  }, [loadProfile])

  useEffect(() => {
    if (entError) addToast('error', 'Could not load credits — retry from Settings if AI tools fail')
  }, [entError, addToast])

  const localLetter = buildLetter(template, { yourName: firstName, role, company, skill })
  const letter = aiLetter || localLetter

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter)
      addToast('success', 'Cover letter copied to clipboard')
    } catch {
      addToast('error', 'Could not copy — please select & copy manually')
    }
  }

  const downloadTxt = () => {
    try {
      const safeRole = (role || 'role').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      const safeCompany = (company || 'company').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      const blob = new Blob([letter], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cover-letter-${safeRole}-${safeCompany}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('downloadTxt:', err)
      addToast('error', 'Could not download — try copying instead')
    }
  }

  const saveDraft = async () => {
    if (!letter.trim()) {
      addToast('error', 'Nothing to save')
      return
    }
    if (!company.trim() || !role.trim()) {
      addToast('error', 'Add role and company before saving a draft')
      return
    }
    setSavingDraft(true)
    try {
      const next = normalizeCoverLetterDrafts([
        {
          id: draftId(),
          role: role.trim(),
          company: company.trim(),
          template,
          body: letter,
          savedAt: new Date().toISOString(),
          source: aiLetter ? 'ai' : 'template',
        },
        ...drafts,
      ])
      await updateProfile({ coverLetterDrafts: next })
      addToast('success', 'Draft saved to your profile')
    } catch (err) {
      addToast('error', err.message || 'Could not save draft')
    }
    setSavingDraft(false)
  }

  const loadDraft = (d) => {
    setRole(d.role || '')
    setCompany(d.company || '')
    setTemplate(d.template || 'concise')
    setAiLetter(d.body || '')
    addToast('success', `Loaded draft for ${d.company || 'company'}`)
  }

  const deleteDraft = async (id) => {
    try {
      const next = drafts.filter((d) => d.id !== id)
      await updateProfile({ coverLetterDrafts: next })
      addToast('success', 'Draft removed')
    } catch (err) {
      addToast('error', err.message || 'Could not delete draft')
    }
  }

  const generateAi = async () => {
    if (!role.trim() || !company.trim()) {
      addToast('error', 'Enter role and company first')
      return
    }
    setAiLoading(true)
    try {
      const data = await apiFetch('/ai/cover-letter', {
        body: {
          role: role.trim(),
          company: company.trim(),
          jobDescription: jobDescription.trim() || undefined,
          template,
          focusSkill: skill.trim() || undefined,
          mode: mode === 'cold_email' ? 'cold_email' : undefined,
        },
      })
      const text = data?.coverLetter || data?.letter || ''
      if (!text) throw new Error('Empty response from AI')
      setAiLetter(text)
      await refresh({ force: true })
      addToast('success', mode === 'cold_email' ? 'Cold email drafted' : 'AI cover letter generated')
    } catch (err) {
      console.error('generateAi cover letter error:', err)
      addToast('error', err.message || 'AI generation failed')
    }
    setAiLoading(false)
  }

  const creditCost = creditCosts?.coverLetter ?? 5
  const canRunAi = typeof credits?.balance !== 'number' || credits.balance >= creditCost

  const modeCard = (
    <DashboardCard titleIcon="send" title="Output type" contentClassName="space-y-2 !py-3 sm:!py-4">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-1 sm:gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMode(m.id); setAiLetter('') }}
            className={cn(
              'rounded-xl border px-2.5 py-2 text-left transition-colors sm:px-3 sm:py-2.5',
              mode === m.id ? 'border-primary/30 bg-primary/10' : 'border-border bg-muted/50 hover:border-primary/20',
            )}
          >
            <span className="block text-sm font-semibold">{m.label}</span>
            <span className="mt-0.5 block text-[0.65rem] leading-snug text-muted-foreground sm:text-xs">{m.desc}</span>
          </button>
        ))}
      </div>
    </DashboardCard>
  )

  const templateCard = (
    <DashboardCard titleIcon="palette" title="Pick a template" contentClassName="space-y-1.5 !py-3 sm:space-y-2 sm:!py-4">
      <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
        {TEMPLATES.map((t) => {
          const active = template === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTemplate(t.id); setAiLetter('') }}
              className={cn(
                'flex w-full items-start gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors sm:gap-3 sm:px-3 sm:py-2.5',
                active ? 'border-primary/30 bg-primary/10' : 'border-border bg-muted/50 hover:border-primary/20',
              )}
            >
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg border sm:size-9', TEMPLATE_TONE[t.tone])}>
                <AppIcon name={t.ico} className="size-3.5 sm:size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-snug">{t.name}</span>
                <span className="mt-0.5 block text-[0.65rem] leading-snug text-muted-foreground sm:text-xs">{t.desc}</span>
              </span>
            </button>
          )
        })}
      </div>
    </DashboardCard>
  )

  const variablesCard = (
    <DashboardCard titleIcon="pencil" title="Variables" contentClassName="space-y-2.5 !py-3 sm:space-y-3 sm:!py-4">
      <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
        <FormField label="Role">
          <Input value={role} onChange={(e) => { setRole(e.target.value); setAiLetter('') }} />
        </FormField>
        <FormField label="Company">
          <Input value={company} onChange={(e) => { setCompany(e.target.value); setAiLetter('') }} />
        </FormField>
        <FormField label="Top relevant skill">
          <Input value={skill} onChange={(e) => { setSkill(e.target.value); setAiLetter('') }} />
        </FormField>
        <FormField label="Job description (optional)">
          <Textarea
            rows={isLg ? 5 : 3}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the JD so AI can mirror keywords and requirements…"
          />
        </FormField>
      </div>
    </DashboardCard>
  )

  const draftsCard = drafts.length > 0 ? (
    <DashboardCard titleIcon="book" title="Saved drafts" contentClassName="space-y-2 !py-3 sm:!py-4">
      {drafts.map((d) => (
        <div
          key={d.id}
          className="flex items-start justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2"
        >
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => loadDraft(d)}>
            <span className="block truncate text-sm font-semibold">{d.company || 'Draft'}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {d.role} · {d.source === 'ai' ? 'AI' : 'Template'}
            </span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => void deleteDraft(d.id)}>Delete</Button>
        </div>
      ))}
    </DashboardCard>
  ) : null

  const previewCard = (
    <DashboardCard
      titleIcon="send"
      title="Preview"
      contentClassName="space-y-2.5 !py-3 sm:!py-4"
      action={isLg ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={copy}>Copy</Button>
          <Button variant="ghost" size="sm" onClick={downloadTxt}>Download</Button>
          <Button variant="outline" size="sm" onClick={() => void saveDraft()} disabled={savingDraft}>
            {savingDraft ? 'Saving…' : 'Save draft'}
          </Button>
          {aiLetter ? (
            <Button variant="ghost" size="sm" onClick={() => setAiLetter('')}>Use template</Button>
          ) : null}
          <Button size="sm" onClick={() => void generateAi()} disabled={aiLoading || !canRunAi}>
            {aiLoading ? 'Drafting…' : mode === 'cold_email' ? 'AI cold email' : 'AI draft'}
          </Button>
        </div>
      ) : null}
    >
      {!isLg && (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" className="flex-1" onClick={() => void generateAi()} disabled={aiLoading || !canRunAi}>
            {aiLoading ? 'Drafting…' : mode === 'cold_email' ? 'AI cold email' : 'AI draft'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void saveDraft()} disabled={savingDraft}>
            {savingDraft ? '…' : 'Save'}
          </Button>
          <Button variant="ghost" size="sm" onClick={copy}>Copy</Button>
          <Button variant="ghost" size="sm" onClick={downloadTxt}>Txt</Button>
          {aiLetter ? (
            <Button variant="ghost" size="sm" onClick={() => setAiLetter('')}>Template</Button>
          ) : null}
        </div>
      )}
      <pre className="max-h-[42vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-3 font-sans text-sm leading-relaxed sm:max-h-none sm:p-4">
        {letter}
      </pre>
      <p className="text-xs text-muted-foreground sm:text-right">
        {aiLetter ? 'AI draft — edit before sending.' : 'Template draft — use AI for a JD-aware rewrite.'}
        {' '}Save keeps up to 8 drafts.
      </p>
    </DashboardCard>
  )

  const sidebar = (
    <>
      {modeCard}
      {templateCard}
      {variablesCard}
      {draftsCard}
    </>
  )

  return (
    <UpgradeGate feature="AI Cover Letters">
      <ToolPage>
        <SectionHeader
          className="gap-2 sm:gap-4"
          badge="Generate · 1-click"
          badgeClassName="border-purple-500/20 bg-purple-500/10 text-purple-500 mb-1.5 sm:mb-2"
          title="Cover letters that get replies"
          accent="get replies"
          subtitle={isLg
            ? 'Pick a template, paste the JD, and draft with AI — then save copies keyed to each company.'
            : 'Fill role & company, pick a template, then AI draft.'}
        />

        {isLg ? (
          <ToolSidebarLayout sidebar={sidebar}>
            {previewCard}
          </ToolSidebarLayout>
        ) : (
          <div className="flex min-w-0 flex-col gap-2.5">
            {/* Inputs first on mobile so AI draft isn’t blocked by scrolling past preview */}
            {variablesCard}
            {modeCard}
            {templateCard}
            {previewCard}
            {draftsCard}
          </div>
        )}
      </ToolPage>
    </UpgradeGate>
  )
}
