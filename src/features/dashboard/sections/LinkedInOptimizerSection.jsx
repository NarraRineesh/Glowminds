import { useEffect, useMemo, useState } from 'react'
import SectionHeader from '@/components/dashboard/SectionHeader'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import { Badge, Button, Checkbox, DashboardCard, Input, Progress, cn } from '@/components/ui'
import useAppStore from '@/store/authStore'
import useProfileStore from '@/store/profileStore'
import { auth } from '@/services/firebase'
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

const CHECKS = [
  { id: 'photo', label: 'Professional photo', desc: 'Headshot · neutral background · genuine smile · 400×400+', weight: 12 },
  { id: 'banner', label: 'Custom banner', desc: 'Don\'t use the default — banner is prime real estate', weight: 6 },
  { id: 'headline', label: 'Keyword-rich headline', desc: 'Include role + 2 skills + outcome (e.g. "Frontend Engineer · React, TS · shipped 30+ features")', weight: 18 },
  { id: 'about', label: 'About section (3+ paragraphs)', desc: 'Hook → proof → call to action. Add a bullet list of skills.', weight: 14 },
  { id: 'experience', label: 'Experience with metrics', desc: 'Each role has 2–4 bullets, each with a number / outcome', weight: 16 },
  { id: 'skills', label: '15+ skills + endorsements', desc: 'Pin your top 3 skills. Endorsements drive search ranking.', weight: 12 },
  { id: 'projects', label: 'Featured projects / posts', desc: 'Pin 3 highlights to your "Featured" section', weight: 8 },
  { id: 'recommendations', label: '2+ recommendations', desc: 'Recommendations from peers/managers boost trust signals', weight: 8 },
  { id: 'activity', label: 'Active in last 30 days', desc: 'Like, comment, or post weekly — boosts visibility', weight: 6 },
]

const HEADLINE_TIPS = [
  'Lead with the role, not the company',
  'Use 2–3 specific skills (React, TypeScript) instead of buzzwords',
  'Include a result or outcome (shipped X, reduced Y by Z%)',
  'Avoid "Aspiring" / "Looking for opportunities" — sound confident',
]

export default function LinkedInOptimizerSection() {
  const addToast = useAppStore((s) => s.addToast)
  const [done, setDone] = useState({})

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
        const url = useProfileStore.getState().profile?.links?.linkedin || ''
        setProfileUrl(url)
        setEditing(!url)
        setDraft(url)
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

  const score = useMemo(() => {
    const total = CHECKS.reduce((s, c) => s + c.weight, 0)
    const earned = CHECKS.reduce((s, c) => s + (done[c.id] ? c.weight : 0), 0)
    return Math.round((earned / total) * 100)
  }, [done])

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
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          {tone === 'great' && <><AppIcon name="rocket" className="size-4" /> Recruiters can find you easily</>}
          {tone === 'ok' && <><AppIcon name="wrench" className="size-4" /> Strong base — a few wins away</>}
          {tone === 'low' && <><AppIcon name="review" className="size-4" /> Start with the headline</>}
        </p>
      </DashboardCard>

      <DashboardCard titleIcon="lightbulb" title="Headline tips" contentClassName="space-y-2">
        {HEADLINE_TIPS.map((t) => (
          <div key={t} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <AppIcon name="check" className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
            <span>{t}</span>
          </div>
        ))}
      </DashboardCard>
    </>
  )

  return (
    <ToolPage>
      <SectionHeader
        badge="LinkedIn · Audit"
        badgeClassName="border-primary/20 bg-primary/10 text-primary"
        title="Make recruiters find you first"
        accent="find you first"
        subtitle="A 9-point audit covering everything that drives LinkedIn search ranking and recruiter trust signals — check off as you fix each item."
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
            <span className="text-xs text-muted-foreground">Pulled from your profile</span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {profileUrl
                ? 'Update your LinkedIn URL — we\'ll save it back to your profile.'
                : 'No LinkedIn URL on your profile yet. Add it once and the optimizer will use it everywhere.'}
            </p>
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

      <ToolSidebarLayout sidebar={sidebar} sidebarRight>
        <DashboardCard
          titleIcon="check-circle"
          title="Profile audit"
          action={<span className="text-xs text-muted-foreground">{doneCount}/{CHECKS.length} done</span>}
          contentClassName="space-y-2"
        >
          {CHECKS.map((c) => {
            const checked = !!done[c.id]
            return (
              <label
                key={c.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                  checked ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-border bg-muted/50 hover:border-primary/20',
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => setDone((d) => ({ ...d, [c.id]: Boolean(v) }))}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{c.label}</span>
                    <Badge variant="secondary" className="text-[0.65rem] tabular-nums">+{c.weight} pts</Badge>
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{c.desc}</p>
                </div>
              </label>
            )
          })}
        </DashboardCard>
      </ToolSidebarLayout>
    </ToolPage>
  )
}
