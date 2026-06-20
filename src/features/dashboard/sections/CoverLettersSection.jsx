import { useEffect, useState } from 'react'
import SectionHeader from '@/components/dashboard/SectionHeader'
import UpgradeGate from '@/components/UpgradeGate'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import { Button, DashboardCard, FormField, Input, cn } from '@/components/ui'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import { apiFetch } from '@/services/apiClient'

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

  const profile = useProfileStore((s) => s.profile)
  const loadProfile = useProfileStore((s) => s.load)

  const [template, setTemplate] = useState('concise')
  const [role, setRole] = useState('Frontend Engineer')
  const [company, setCompany] = useState('Acme Inc')
  const [skill, setSkill] = useState('React + TypeScript')
  const [aiLetter, setAiLetter] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    loadProfile().catch(() => {})
  }, [loadProfile])

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

  const generateAi = async () => {
    setAiLoading(true)
    try {
      const userExperience = (profile?.experience || [])
        .map((e) => `${e.role || ''} @ ${e.company || ''}`)
        .filter(Boolean)
        .join('; ')
      const data = await apiFetch('/ai/cover-letter', {
        body: {
          profile: {
            name: user?.displayName || firstName,
            title: profile?.headline || role,
            skills: profile?.skills?.technical || (skill ? [skill] : []),
            education: '',
            experience: userExperience,
          },
          jobTitle: role,
          company,
          jobDescription: template ? `Tone: ${template}` : '',
        },
      })
      const text = data?.coverLetter || data?.letter || ''
      if (!text) throw new Error('Empty response from AI')
      setAiLetter(text)
      addToast('success', 'AI cover letter generated')
    } catch (err) {
      console.error('generateAi cover letter error:', err)
      addToast('error', err.message || 'AI generation failed')
    }
    setAiLoading(false)
  }

  const sidebar = (
    <>
      <DashboardCard titleIcon="palette" title="Pick a template" contentClassName="space-y-2">
        {TEMPLATES.map((t) => {
          const active = template === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                active ? 'border-primary/30 bg-primary/10' : 'border-border bg-muted/50 hover:border-primary/20',
              )}
            >
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg border', TEMPLATE_TONE[t.tone])}>
                <AppIcon name={t.ico} className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{t.name}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{t.desc}</span>
              </span>
            </button>
          )
        })}
      </DashboardCard>

      <DashboardCard titleIcon="pencil" title="Variables" contentClassName="space-y-3">
        <FormField label="Role">
          <Input value={role} onChange={(e) => setRole(e.target.value)} />
        </FormField>
        <FormField label="Company">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </FormField>
        <FormField label="Top relevant skill">
          <Input value={skill} onChange={(e) => setSkill(e.target.value)} />
        </FormField>
      </DashboardCard>
    </>
  )

  return (
    <UpgradeGate>
    <ToolPage>
      <SectionHeader
        badge="Generate · 1-click"
        badgeClassName="border-purple-500/20 bg-purple-500/10 text-purple-500"
        title="Cover letters that get replies"
        accent="get replies"
        subtitle="Pick a template, drop in the role and company, and we'll draft a ready-to-edit cover letter in seconds."
      />

      <ToolSidebarLayout sidebar={sidebar}>
        <DashboardCard
          titleIcon="send"
          title="Preview"
          action={(
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={copy}>Copy</Button>
              <Button variant="ghost" size="sm" onClick={downloadTxt}>Download</Button>
              <Button size="sm" onClick={generateAi} disabled={aiLoading}>
                {aiLoading ? 'Drafting…' : 'AI draft'}
              </Button>
            </div>
          )}
        >
          <pre className="whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-4 font-sans text-sm leading-relaxed">
            {letter}
          </pre>
          <p className="mt-2 text-right text-xs text-muted-foreground">
            Cover letters are not saved — copy or download once you&apos;re happy with it.
          </p>
        </DashboardCard>
      </ToolSidebarLayout>
    </ToolPage>
    </UpgradeGate>
  )
}
