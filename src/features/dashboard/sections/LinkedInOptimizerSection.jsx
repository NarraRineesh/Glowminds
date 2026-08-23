import { useEffect, useMemo, useState } from 'react'
import AppIcon from '@/components/icons/AppIcon'
import { Badge, Button, Checkbox, Input, Progress, Textarea, cn } from '@/components/ui'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useEntitlements from '@/hooks/useEntitlements'
import { apiFetch } from '@/services/apiClient'
import { auth } from '@/services/firebase'
import { buildLinkedInAuditSnapshot } from '@/constants/schema'
import Loader from '@/components/Loader'
import {
  AiRail,
  ScoreGauge,
  SectionCard,
  SplitRail,
} from '@/features/dashboard/components/v2'
import { logActivity } from '@/services/activityLog'
import { awardXp } from '@/services/gamification'
import { v2Debug } from '@/utils/v2Debug'

function normalizeLinkedIn(input) {
  const v = (input || '').trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v.replace(/^\/+/, '')}`
}

function isValidLinkedInUrl(input) {
  const v = (input || '').trim()
  if (!v) return false
  try {
    const url = new URL(normalizeLinkedIn(v))
    return /(^|\.)linkedin\.com$/i.test(url.hostname)
  } catch {
    return false
  }
}

const STEPPER_STEPS = ['Import', 'Audit', 'Rewrite']

const FALLBACK_CHECKS = [
  { id: 'photo', label: 'Professional photo', tip: 'Headshot · neutral background · genuine smile', done: false },
  { id: 'banner', label: 'Custom banner', tip: "Don't use the default LinkedIn banner", done: false },
  { id: 'headline', label: 'Keyword-rich headline', tip: 'Role + skills + outcome', done: false },
  { id: 'about', label: 'About section', tip: 'Hook → proof → CTA', done: false },
  { id: 'experience', label: 'Experience with metrics', tip: '2–4 bullets with numbers per role', done: false },
  { id: 'skills', label: '15+ skills', tip: 'Pin your top 3 skills', done: false },
]

function LinkedInStepper({ active, onStep }) {
  return (
    <div className="mb-4 flex items-center gap-0">
      {STEPPER_STEPS.map((label, i) => {
        const done = i < active
        const current = i === active
        return (
          <div key={label} className="flex min-w-0 flex-1 items-center">
            <button
              type="button"
              onClick={() => onStep?.(i)}
              className="flex min-w-0 items-center gap-2 rounded-lg text-left hover:opacity-90"
            >
              <span className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold',
                done && 'bg-emerald-500 text-white',
                current && !done && 'bg-primary text-primary-foreground',
                !done && !current && 'border border-border bg-muted text-muted-foreground',
              )}
              >
                {done ? <AppIcon name="check" className="size-3" /> : i + 1}
              </span>
              <span className={cn(
                'truncate text-xs font-semibold',
                current ? 'text-foreground' : 'text-muted-foreground',
              )}
              >
                {label}
              </span>
            </button>
            {i < STEPPER_STEPS.length - 1 && (
              <div className={cn('mx-2 h-px flex-1', done ? 'bg-emerald-500/50' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function findingSeverity(checked, index) {
  if (checked) return 'ok'
  if (index < 2) return 'high'
  if (index < 4) return 'med'
  return 'low'
}

export default function LinkedInOptimizerSection() {
  const addToast = useAppStore((s) => s.addToast)
  const { credits, creditCosts, refresh } = useEntitlements()
  const creditCost = creditCosts?.linkedinAudit ?? 2
  const balance = credits?.balance
  const canRun = typeof balance !== 'number' || balance >= creditCost

  const [step, setStep] = useState(0)
  const [done, setDone] = useState({})
  const [checklist, setChecklist] = useState(FALLBACK_CHECKS)
  const [rewrites, setRewrites] = useState([])
  const [aiSummary, setAiSummary] = useState('')
  const [aiScore, setAiScore] = useState(null)

  const [headline, setHeadline] = useState('')
  const [about, setAbout] = useState('')
  const [experience, setExperience] = useState('')
  const [running, setRunning] = useState(false)

  const [profileUrl, setProfileUrl] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState('paste')
  const [pasted, setPasted] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasImport = !!(headline.trim() || about.trim() || experience.trim())
  const audited = typeof aiScore === 'number'
  const hasRewrites = rewrites.length > 0

  useEffect(() => {
    let cancelled = false
    async function load() {
      const uid = auth.currentUser?.uid
      if (!uid) { setLoadingProfile(false); return }
      try {
        await useProfileStore.getState().load({ force: false })
        if (cancelled) return
        const profile = useProfileStore.getState().profile || {}
        const url = profile.links?.linkedin || ''
        setProfileUrl(url)
        setPasted(profile.linkedinPaste || '')
        setMode(url && !profile.linkedinPaste ? 'url' : 'paste')
        setEditing(!url && !profile.linkedinPaste)
        setDraft(url)

        const audit = profile.linkedinAudit
        if (audit) {
          setAiScore(typeof audit.score === 'number' ? audit.score : null)
          if (Array.isArray(audit.completedIds)) {
            const map = {}
            for (const id of audit.completedIds) map[id] = true
            setDone(map)
          }
          if (audit.ai?.checklist?.length) setChecklist(audit.ai.checklist)
          if (audit.ai?.rewrites?.length) setRewrites(audit.ai.rewrites)
          if (audit.ai?.summary) setAiSummary(audit.ai.summary)
          const snap = audit.ai?.snapshot
          if (snap && typeof snap === 'object') {
            if (snap.headline) setHeadline(String(snap.headline))
            if (snap.about) setAbout(String(snap.about))
            if (snap.experience) setExperience(String(snap.experience))
          }
          if (audit.ai?.rewrites?.length) setStep(2)
          else if (typeof audit.score === 'number') setStep(1)
          else if (snap?.headline || snap?.about || snap?.experience) setStep(0)
        }
      } catch (e) {
        console.error('LinkedIn load:', e)
      }
      if (!cancelled) setLoadingProfile(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleSaveUrl = async () => {
    if (!isValidLinkedInUrl(draft)) {
      addToast?.('error', 'Enter a valid linkedin.com URL')
      return
    }
    const uid = auth.currentUser?.uid
    if (!uid) { addToast?.('error', 'You must be signed in'); return }
    const normalized = normalizeLinkedIn(draft)
    setSaving(true)
    try {
      const existingLinks = useProfileStore.getState().profile?.links || {}
      await useProfileStore.getState().updateProfile({
        links: { ...existingLinks, linkedin: normalized },
      })
      setProfileUrl(normalized)
      setDraft(normalized)
      setEditing(false)
      addToast?.('success', 'LinkedIn URL saved to your profile')
    } catch (e) {
      console.error('LinkedIn save:', e)
      addToast?.('error', 'Failed to save')
    }
    setSaving(false)
  }

  const persistAudit = async (nextDone, nextScore, aiBlock) => {
    const completedIds = Object.entries(nextDone).filter(([, v]) => v).map(([id]) => id)
    const previous = useProfileStore.getState().profile?.linkedinAudit
    const snapshot = buildLinkedInAuditSnapshot({
      completedIds,
      score: nextScore,
      totalChecks: checklist.length,
      previous,
      ai: aiBlock,
    })
    await useProfileStore.getState().updateProfile({ linkedinAudit: snapshot })
  }

  const toggleCheck = async (id, value) => {
    const next = { ...done, [id]: value }
    setDone(next)
    try {
      await persistAudit(next, aiScore ?? scoreFromDone(next, checklist), undefined)
    } catch (e) {
      console.error(e)
    }
  }

  const useMyProfile = () => {
    const profile = useProfileStore.getState().profile || {}
    fillFieldsFromProfile(profile, { onlyEmpty: false, setHeadline, setAbout, setExperience })
    addToast?.('success', 'Filled from your GlowMinds profile')
  }

  const importFromExtension = async () => {
    try {
      let raw = ''
      try {
        raw = await navigator.clipboard.readText()
      } catch {
        raw = localStorage.getItem('gm_linkedin_extract') || ''
      }
      const data = JSON.parse(raw)
      if (!data || data.source !== 'glowminds-linkedin-assist') {
        throw new Error('Clipboard does not contain GlowMinds LinkedIn Assist data. Use the extension first.')
      }
      if (data.headline) setHeadline(String(data.headline))
      if (data.about) setAbout(String(data.about))
      if (data.experience) setExperience(String(data.experience))
      if (data.url && isValidLinkedInUrl(data.url)) {
        setDraft(data.url)
        setProfileUrl(normalizeLinkedIn(data.url))
      }
      v2Debug('linkedin', 'imported extension payload', data.url)
      const uid = auth.currentUser?.uid
      if (uid) {
        await logActivity(uid, { type: 'linkedin', title: 'Imported LinkedIn via extension' })
        await awardXp(uid, 'linkedin')
      }
      addToast?.('success', 'Imported profile fields from extension')
      setStep(0)
    } catch (err) {
      addToast?.('error', err.message || 'Import failed')
    }
  }

  const applyRewrite = async (r) => {
    const text = String(r?.suggestion || '').trim()
    if (!text) return
    const section = String(r?.section || '').toLowerCase()
    if (section.includes('headline')) setHeadline(text)
    else if (section.includes('about') || section.includes('summary')) setAbout(text)
    else if (section.includes('experience')) setExperience(text)
    try {
      await navigator.clipboard.writeText(text)
      addToast?.('success', 'Applied & copied rewrite')
    } catch {
      addToast?.('success', 'Applied rewrite to the form')
    }
  }

  const copyAllRewrites = async () => {
    const text = rewrites.map((r) => `${r.section || r.title}\n${r.suggestion}`).join('\n\n---\n\n')
    try {
      await navigator.clipboard.writeText(text)
      addToast?.('success', 'All rewrites copied')
    } catch {
      addToast?.('error', 'Could not copy')
    }
  }

  const runAiAudit = async () => {
    if (!hasImport) {
      addToast?.('error', 'Import or paste LinkedIn fields first')
      setStep(0)
      return
    }
    if (!canRun) {
      addToast?.('error', 'Not enough AI credits')
      return
    }
    setRunning(true)
    setStep(1)
    try {
      const profile = useProfileStore.getState().profile || {}
      const res = await apiFetch('/ai/linkedin-audit', {
        body: {
          headline,
          about,
          experience,
          profile: {
            headline: profile.headline,
            summary: profile.summary,
            skills: profile.skills,
            experience: profile.experience,
          },
        },
      })
      const nextChecklist = Array.isArray(res.checklist) && res.checklist.length
        ? res.checklist
        : FALLBACK_CHECKS
      const nextDone = {}
      for (const id of res.completedIds || []) nextDone[id] = true
      for (const c of nextChecklist) {
        if (c.done) nextDone[c.id] = true
      }
      setChecklist(nextChecklist)
      setDone(nextDone)
      setRewrites(Array.isArray(res.rewrites) ? res.rewrites : [])
      setAiSummary(res.summary || '')
      setAiScore(res.score ?? null)
      await persistAudit(nextDone, res.score ?? 0, {
        auditedAt: res.lastReviewedAt || new Date().toISOString(),
        checklist: nextChecklist,
        rewrites: res.rewrites || [],
        summary: res.summary || '',
        snapshot: { headline, about, experience },
      })
      await refresh({ force: true })
      addToast?.('success', 'LinkedIn AI audit ready')
    } catch (err) {
      addToast?.('error', err.message || 'Audit failed')
    } finally {
      setRunning(false)
    }
  }

  const score = useMemo(() => {
    if (typeof aiScore === 'number') return aiScore
    return scoreFromDone(done, checklist)
  }, [aiScore, done, checklist])

  const doneCount = Object.values(done).filter(Boolean).length
  const openFindings = checklist.length - doneCount

  const goStep = (i) => {
    if (i === 1 && !hasImport) {
      addToast?.('info', 'Import LinkedIn fields before audit')
      return
    }
    if (i === 2 && !hasRewrites && !audited) {
      addToast?.('info', 'Run an AI audit first to unlock rewrites')
      return
    }
    setStep(i)
  }

  if (loadingProfile) {
    return <Loader variant="section" label="Loading LinkedIn hub…" />
  }

  return (
    <div className="space-y-4">
      <LinkedInStepper active={step} onStep={goStep} />

      {step === 0 && (
        <SplitRail
          main={(
            <SectionCard title="1 · Add your LinkedIn" action={<Badge variant="outline">Paste or URL</Badge>}>
              <p className="mb-3 text-sm text-muted-foreground">
                Paste your LinkedIn About / experience or save a profile URL. The Chrome extension is optional under Advanced.
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={mode === 'paste' ? 'default' : 'outline'} onClick={() => setMode('paste')}>Paste profile</Button>
                <Button type="button" size="sm" variant={mode === 'url' ? 'default' : 'outline'} onClick={() => setMode('url')}>Profile URL</Button>
              </div>
              {mode === 'paste' && (
                <div className="mb-4 space-y-2">
                  <Textarea
                    className="min-h-[140px]"
                    placeholder="Paste your headline, About, and recent roles…"
                    value={pasted}
                    onChange={(e) => setPasted(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={saving || !pasted.trim()}
                    onClick={async () => {
                      const uid = auth.currentUser?.uid
                      if (!uid) { addToast?.('error', 'You must be signed in'); return }
                      setSaving(true)
                      try {
                        await useProfileStore.getState().updateProfile({ linkedinPaste: pasted.trim() })
                        setEditing(false)
                        addToast?.('success', 'Profile text saved')
                      } catch {
                        addToast?.('error', 'Failed to save')
                      }
                      setSaving(false)
                    }}
                  >
                    {saving ? 'Saving…' : 'Save pasted profile'}
                  </Button>
                </div>
              )}

              <div className="mb-3">
                <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => setShowAdvanced((v) => !v)}>
                  {showAdvanced ? 'Hide advanced' : 'Advanced · Chrome extension'}
                </button>
              </div>
              {showAdvanced && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3 py-3">
                <div>
                  <p className="m-0 text-sm font-semibold">Optional: Paste Assist JSON</p>
                  <p className="m-0 mt-0.5 text-xs text-muted-foreground">Chrome extension is Advanced-only. Clipboard must contain GlowMinds LinkedIn Assist data.</p>
                </div>
                <Button type="button" size="sm" onClick={() => void importFromExtension()}>
                  Import from clipboard
                </Button>
              </div>
              )}

              <div className="mb-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your LinkedIn URL</p>
                {!editing && profileUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-2 truncate rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-semibold text-primary"
                    >
                      <AppIcon name="linkedin" className="size-4 shrink-0" />
                      <span className="truncate">{profileUrl.replace(/^https?:\/\//, '')}</span>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => { setDraft(profileUrl); setEditing(true) }}>Edit</Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Input
                      className="min-w-[220px] flex-1"
                      type="url"
                      placeholder="https://linkedin.com/in/yourname"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <Button size="sm" disabled={saving || !draft.trim()} onClick={handleSaveUrl}>
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Headline — empty until you import or paste"
                />
                <Textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="About — paste from LinkedIn or import via Assist"
                  rows={4}
                />
                <Textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Experience bullets / roles"
                  rows={5}
                />
              </div>
            </SectionCard>
          )}
          rail={(
            <>
              <SectionCard title="Why Assist?">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2"><AppIcon name="check" className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> No password sharing with GlowMinds</li>
                  <li className="flex gap-2"><AppIcon name="check" className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> You control what gets copied</li>
                  <li className="flex gap-2"><AppIcon name="check" className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> Re-import anytime after LinkedIn edits</li>
                </ul>
              </SectionCard>
              <SectionCard title="Next step">
                <p className="mb-3 text-sm text-muted-foreground">
                  After fields are filled, continue to Audit — AI scores headline, About, experience, and skills.
                </p>
                <Button
                  type="button"
                  className="w-full"
                  disabled={!hasImport}
                  onClick={() => setStep(1)}
                >
                  Continue to Audit
                </Button>
                {!hasImport && (
                  <p className="mt-2 text-[11px] text-muted-foreground">Enabled once import has content</p>
                )}
              </SectionCard>
              <AiRail
                title="Tip"
                body="You can also paste headline / About / experience by hand if you prefer not to use the extension yet."
                cta="Fill from GlowMinds profile"
                onCta={useMyProfile}
              />
            </>
          )}
        />
      )}

      {step === 1 && (
        <SplitRail
          main={(
            <SectionCard
              title="Audit findings"
              action={(
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setStep(0)}>Back to import</Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-ai text-background hover:bg-ai/90"
                    disabled={running || !canRun || !hasImport}
                    onClick={() => void runAiAudit()}
                  >
                    {running ? 'Analyzing…' : `Run AI audit · ${creditCost} cr`}
                  </Button>
                </div>
              )}
            >
              {running ? (
                <Loader variant="block" label="Running AI audit…" />
              ) : !audited ? (
                <div className="py-8 text-center">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Run an AI audit on your imported fields to get prioritized findings.
                  </p>
                  <Button
                    type="button"
                    className="bg-ai text-background hover:bg-ai/90"
                    disabled={!canRun || !hasImport}
                    onClick={() => void runAiAudit()}
                  >
                    {`Run AI audit · ${creditCost} cr`}
                  </Button>
                </div>
              ) : (
                <>
                  {openFindings > 0 && (
                    <Badge variant="outline" className="mb-3 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      {openFindings} open finding{openFindings !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {checklist.map((c, index) => {
                      const id = c.id || c.label
                      const checked = !!done[id]
                      const sev = findingSeverity(checked, index)
                      const sevLabel = sev === 'high' ? 'High' : sev === 'med' ? 'Med' : sev === 'ok' ? 'Done' : 'Low'
                      return (
                        <li key={id}>
                          <label className={cn(
                            'flex cursor-pointer items-start gap-2 px-3 py-2.5 transition-colors hover:bg-muted/40',
                            checked && 'bg-emerald-500/5',
                          )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => void toggleCheck(id, Boolean(v))}
                              className="mt-0.5 shrink-0"
                            />
                            <Badge
                              variant="outline"
                              className={cn(
                                'mt-0.5 shrink-0 text-[0.6rem] uppercase',
                                sev === 'high' && 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
                                sev === 'ok' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
                              )}
                            >
                              {sevLabel}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <span className="text-[0.8rem] font-semibold">{c.label || c.title}</span>
                              <p className="m-0 text-[0.68rem] leading-snug text-muted-foreground">{c.tip || c.desc}</p>
                            </div>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                  <Button
                    type="button"
                    className="mt-4 w-full"
                    disabled={!hasRewrites && typeof aiScore !== 'number'}
                    onClick={() => setStep(2)}
                  >
                    Continue to Rewrites
                  </Button>
                </>
              )}
            </SectionCard>
          )}
          rail={(
            <>
              <SectionCard title="LinkedIn health">
                <div className="mb-3 flex items-center gap-3">
                  <ScoreGauge score={score} size={72} label="/100" />
                  <div>
                    <p className="m-0 text-sm font-semibold">{score >= 75 ? 'On track' : 'Needs work'}</p>
                    {aiSummary ? <p className="m-0 mt-1 text-xs text-muted-foreground">{aiSummary}</p> : (
                      <p className="m-0 mt-1 text-xs text-muted-foreground">Run audit to score sections.</p>
                    )}
                  </div>
                </div>
                <p className="text-[0.7rem] text-muted-foreground">{doneCount}/{checklist.length} checklist done</p>
                <Progress value={checklist.length ? (doneCount / checklist.length) * 100 : 0} className="mt-2 h-2" />
              </SectionCard>
              <AiRail
                title="Next"
                body={hasRewrites
                  ? 'Findings are ready — open Rewrites to apply AI fills for headline and About first.'
                  : 'Run the AI audit to unlock prioritized findings and rewrite suggestions.'}
                cta={hasRewrites ? 'Open rewrites' : `Run AI audit · ${creditCost} cr`}
                onCta={() => {
                  if (hasRewrites) setStep(2)
                  else void runAiAudit()
                }}
              />
            </>
          )}
        />
      )}

      {step === 2 && (
        <SplitRail
          main={(
            <SectionCard
              title="AI fills & rewrites"
              action={(
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setStep(1)}>Back to audit</Button>
                  <Button type="button" size="sm" disabled={!rewrites.length} onClick={() => void copyAllRewrites()}>
                    Copy all
                  </Button>
                </div>
              )}
            >
              {!rewrites.length ? (
                <div className="py-8 text-center">
                  <p className="mb-3 text-sm text-muted-foreground">No rewrites yet — run an AI audit to generate fills.</p>
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>Back to audit</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rewrites.map((r) => {
                    const section = r.section || r.title || 'Rewrite'
                    const before = r.before || r.original || ''
                    return (
                      <div key={`${section}-${r.title}`} className="border-b border-border pb-4 last:border-0 last:pb-0">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-sm">{section}{r.title && r.title !== section ? ` · ${r.title}` : ''}</strong>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-ai text-background hover:bg-ai/90"
                            onClick={() => void applyRewrite(r)}
                          >
                            Use & copy
                          </Button>
                        </div>
                        {before ? (
                          <p className="mb-2 text-xs text-muted-foreground line-through">{before}</p>
                        ) : null}
                        <p className="m-0 whitespace-pre-wrap rounded-lg border border-ai/25 bg-ai/5 px-3 py-2.5 text-sm leading-relaxed">
                          {r.suggestion}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </SectionCard>
          )}
          rail={(
            <>
              <AiRail
                title="Apply order"
                body="Copy headline first (highest leverage), then About, then one experience role. Mark findings done as you paste into LinkedIn."
                cta={rewrites[0] ? 'Copy first rewrite' : 'Back to audit'}
                onCta={() => {
                  if (rewrites[0]) void applyRewrite(rewrites[0])
                  else setStep(1)
                }}
              />
              <SectionCard title="Imported fields">
                <ul className="space-y-2 text-sm">
                  {[
                    ['Headline', headline],
                    ['About', about],
                    ['Experience', experience],
                  ].map(([label, val]) => (
                    <li key={label} className="flex items-center justify-between gap-2">
                      <span>{label}</span>
                      <AppIcon
                        name={val?.trim() ? 'check' : 'x'}
                        className={cn('size-3.5', val?.trim() ? 'text-emerald-500' : 'text-muted-foreground/40')}
                      />
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </>
          )}
        />
      )}
    </div>
  )
}

function scoreFromDone(done, checklist) {
  if (!checklist.length) return 0
  const doneCount = checklist.filter((c) => done[c.id || c.label]).length
  return Math.round((doneCount / checklist.length) * 100)
}

function fillFieldsFromProfile(profile, { onlyEmpty, setHeadline, setAbout, setExperience }) {
  const headline = profile?.headline || ''
  const about = profile?.summary ? String(profile.summary) : ''
  const bullets = (profile?.experience || [])
    .slice(0, 4)
    .map((e) => {
      const head = [e.role, e.company].filter(Boolean).join(' @ ')
      const desc = e.description || (Array.isArray(e.bullets) ? e.bullets.join('\n') : '')
      return [head, desc].filter(Boolean).join('\n')
    })
    .filter(Boolean)
    .join('\n\n')

  if (!onlyEmpty || headline) setHeadline(headline)
  if (!onlyEmpty || about) setAbout(about)
  if (!onlyEmpty || bullets) setExperience(bullets)
}
