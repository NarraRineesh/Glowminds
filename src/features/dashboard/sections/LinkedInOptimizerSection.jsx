import { useEffect, useMemo, useState } from 'react'
import SectionHeader from '@/components/dashboard/SectionHeader'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import { Badge, Button, Checkbox, DashboardCard, Input, Progress, Textarea, cn } from '@/components/ui'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import useEntitlements from '@/hooks/useEntitlements'
import { apiFetch } from '@/services/apiClient'
import { auth } from '@/services/firebase'
import { buildLinkedInAuditSnapshot } from '@/constants/schema'
import Loader from '@/components/Loader'

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

const FALLBACK_CHECKS = [
  { id: 'photo', label: 'Professional photo', tip: 'Headshot · neutral background · genuine smile', done: false },
  { id: 'banner', label: 'Custom banner', tip: "Don't use the default LinkedIn banner", done: false },
  { id: 'headline', label: 'Keyword-rich headline', tip: 'Role + skills + outcome', done: false },
  { id: 'about', label: 'About section', tip: 'Hook → proof → CTA', done: false },
  { id: 'experience', label: 'Experience with metrics', tip: '2–4 bullets with numbers per role', done: false },
  { id: 'skills', label: '15+ skills', tip: 'Pin your top 3 skills', done: false },
]

export default function LinkedInOptimizerSection() {
  const addToast = useAppStore((s) => s.addToast)
  const { isPro, credits, creditCosts, loading: entLoading, refresh } = useEntitlements()
  const creditCost = creditCosts?.linkedinAudit ?? 2
  const balance = credits?.balance
  const canRun = typeof balance !== 'number' || balance >= creditCost

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
        setEditing(!url)
        setDraft(url)
        fillFieldsFromProfile(profile, { onlyEmpty: true, setHeadline, setAbout, setExperience })

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
          // Prefer last audited paste snapshot if fields empty
          const snap = audit.ai?.snapshot
          if (snap && typeof snap === 'object') {
            if (snap.headline) setHeadline(String(snap.headline))
            if (snap.about) setAbout(String(snap.about))
            if (snap.experience) setExperience(String(snap.experience))
          }
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

  const runAiAudit = async () => {
    if (!canRun) {
      addToast?.('error', 'Not enough AI credits')
      return
    }
    setRunning(true)
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

  const tone = score >= 80 ? 'great' : score >= 50 ? 'ok' : 'low'
  const doneCount = Object.values(done).filter(Boolean).length

  const sidebar = (
    <>
      <DashboardCard titleIcon="chart" title="LinkedIn score" contentClassName="space-y-3 text-center">
        <p className={cn(
          'text-4xl font-black tabular-nums',
          tone === 'great' ? 'text-emerald-500' : tone === 'ok' ? 'text-amber-500' : 'text-primary',
        )}>
          {score}
        </p>
        <Progress
          value={score}
          className={cn(
            'gap-0 [&_[data-slot=progress-track]]:h-2',
            tone === 'great'
              ? '[&_[data-slot=progress-indicator]]:bg-emerald-500'
              : tone === 'ok'
                ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
                : '[&_[data-slot=progress-indicator]]:bg-primary',
          )}
        />
        <p className="text-xs text-muted-foreground">out of 100</p>
        {aiSummary ? <p className="text-left text-xs text-muted-foreground">{aiSummary}</p> : null}
      </DashboardCard>

      {rewrites.length > 0 && (
        <DashboardCard titleIcon="lightbulb" title="AI rewrites" contentClassName="space-y-3">
          {rewrites.map((r) => (
            <div key={`${r.section}-${r.title}`} className="rounded-lg border border-border/60 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{r.section} · {r.title}</p>
                <Button variant="ghost" size="sm" onClick={() => void applyRewrite(r)}>Apply</Button>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap">{r.suggestion}</p>
            </div>
          ))}
        </DashboardCard>
      )}
    </>
  )

  return (
    <ToolPage>
      <SectionHeader
        badge="LinkedIn · AI Audit"
        badgeClassName="border-primary/20 bg-primary/10 text-primary"
        title="Make recruiters find you first"
        accent="find you first"
        subtitle="Paste your About and Experience for an AI audit, or use the checklist to track improvements."
      />

      <DashboardCard
        titleIcon="linkedin"
        title="Your LinkedIn"
        action={profileUrl && !editing ? (
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <AppIcon name="check" className="size-3" /> Linked
          </Badge>
        ) : null}
      >
        {loadingProfile ? (
          <Loader variant="block" label="Loading your profile…" />
        ) : !editing && profileUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-2 truncate rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/40"
              title={profileUrl}
            >
              <AppIcon name="linkedin" className="size-4 shrink-0" />
              <span className="truncate">{profileUrl.replace(/^https?:\/\//, '')}</span>
            </a>
            <Button variant="ghost" size="sm" onClick={() => { setDraft(profileUrl); setEditing(true) }}>Edit</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="min-w-[220px] flex-1"
                type="url"
                inputMode="url"
                placeholder="https://linkedin.com/in/yourname"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !saving) handleSaveUrl() }}
              />
              <Button size="sm" disabled={saving || !draft.trim()} onClick={handleSaveUrl}>
                {saving ? 'Saving…' : 'Save to profile'}
              </Button>
              {profileUrl && (
                <Button variant="ghost" size="sm" disabled={saving} onClick={() => { setDraft(profileUrl); setEditing(false) }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        titleIcon="sparkle"
        title="AI LinkedIn audit"
        className="mt-4"
        contentClassName="space-y-3"
        action={(
          <Button variant="ghost" size="sm" disabled={running} onClick={useMyProfile}>
            Use my profile
          </Button>
        )}
      >
        <p className="text-sm text-muted-foreground">
          Paste text from LinkedIn (no scraping), or prefill from your GlowMinds profile. Costs {creditCost} AI credits.
        </p>
        <Input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Your LinkedIn headline"
          disabled={running}
        />
        <Textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Paste your About section…"
          rows={5}
          disabled={running}
        />
        <Textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="Paste Experience bullets…"
          rows={6}
          disabled={running}
        />
        <Button disabled={running || !canRun} onClick={runAiAudit}>
          {running ? 'Analyzing…' : 'Run AI audit'}
        </Button>
      </DashboardCard>

      <ToolSidebarLayout sidebar={sidebar} sidebarRight className="mt-4">
        <DashboardCard
          titleIcon="check-circle"
          title="Profile audit"
          action={<span className="text-xs text-muted-foreground">{doneCount}/{checklist.length} done</span>}
          contentClassName="space-y-2"
        >
          {checklist.map((c) => {
            const id = c.id || c.label
            const checked = !!done[id]
            return (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                  checked ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-border bg-muted/50 hover:border-primary/20',
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => void toggleCheck(id, Boolean(v))}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold">{c.label || c.title}</span>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{c.tip || c.desc}</p>
                </div>
              </label>
            )
          })}
        </DashboardCard>
      </ToolSidebarLayout>
    </ToolPage>
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
