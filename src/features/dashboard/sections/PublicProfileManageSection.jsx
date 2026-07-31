import { useEffect, useMemo, useState } from 'react'
import useProfileStore from '@/store/profileStore'
import useAppStore from '@/store/authStore'
import { publishPublicProfile, slugify, unpublishPublicProfile } from '@/services/publicProfile'
import { pageUrl } from '@/config/site'
import { SectionCard, WorkspaceHeader } from '@/features/dashboard/components/v2'
import { Badge, Button, Input, Switch, cn } from '@/components/ui'

const THEMES = [
  { id: 'midnight', label: 'Midnight', swatch: 'bg-slate-900' },
  { id: 'paper', label: 'Paper', swatch: 'bg-stone-100 border border-stone-300' },
  { id: 'signal', label: 'Signal', swatch: 'bg-primary/80' },
]

function sectionOn(profile, id) {
  if (id === 'about') return !!(profile?.summary || profile?.headline)
  if (id === 'experience') return (profile?.experience || []).length > 0
  if (id === 'projects') return (profile?.projects || []).length > 0
  if (id === 'skills') return (profile?.skills?.technical || profile?.skills || []).length > 0
  if (id === 'education') return (profile?.education || []).length > 0
  return true
}

/** [v2:public] Owner customize / copy-link UI */
export default function PublicProfileManageSection() {
  const user = useAppStore((s) => s.user)
  const { profile, updateProfile, load } = useProfileStore()
  const pub = profile?.public || {}
  const [slug, setSlug] = useState(pub.slug || slugify(user?.displayName || user?.firstName || 'me'))
  const [enabled, setEnabled] = useState(!!pub.enabled)
  const [showEmail, setShowEmail] = useState(!!pub.showEmail)
  const [showPhone, setShowPhone] = useState(!!pub.showPhone)
  const [theme, setTheme] = useState('midnight')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    load({ force: false }).catch(() => {})
  }, [load])

  useEffect(() => {
    if (pub.slug) setSlug(pub.slug)
    setEnabled(!!pub.enabled)
    setShowEmail(!!pub.showEmail)
    setShowPhone(!!pub.showPhone)
  }, [pub.slug, pub.enabled, pub.showEmail, pub.showPhone])

  const publicUrl = useMemo(() => pageUrl(`/u/${slugify(slug)}`), [slug])
  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')
    || user?.displayName
    || 'Your name'
  const initials = displayName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const skills = profile?.skills?.technical || (Array.isArray(profile?.skills) ? profile.skills : [])

  const sections = useMemo(() => [
    { id: 'about', label: 'About', on: sectionOn(profile, 'about'), locked: true },
    { id: 'experience', label: 'Experience', on: sectionOn(profile, 'experience'), locked: true },
    { id: 'projects', label: 'Projects', on: sectionOn(profile, 'projects'), locked: true },
    { id: 'skills', label: 'Skills', on: sectionOn(profile, 'skills'), locked: true },
    { id: 'education', label: 'Education', on: sectionOn(profile, 'education'), locked: true },
    { id: 'contact-email', label: 'Contact email', on: showEmail, locked: false },
    { id: 'contact-phone', label: 'Contact phone', on: showPhone, locked: false },
  ], [profile, showEmail, showPhone])

  const savePublic = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const uid = user?.uid
      if (!uid) throw new Error('Sign in required')
      if (!enabled) {
        if (pub.slug) await unpublishPublicProfile(pub.slug)
        await updateProfile({
          public: { ...pub, enabled: false, slug: slugify(slug), showEmail, showPhone },
        })
        setMsg('Public profile disabled.')
        return
      }
      const { slug: nextSlug } = await publishPublicProfile(uid, { ...profile, email: user?.email }, {
        slug,
        enabled: true,
        showEmail,
        showPhone,
        stats: pub.stats,
      })
      await updateProfile({
        public: { enabled: true, slug: nextSlug, showEmail, showPhone, stats: pub.stats || { views: 0, resumeDownloads: 0 } },
      })
      setMsg('Public profile published.')
    } catch (err) {
      setMsg(err.message || 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setMsg('Link copied.')
    } catch {
      setMsg(publicUrl)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <WorkspaceHeader
        secondaryLabel="Copy link"
        onSecondary={copy}
        primaryLabel={busy ? 'Saving…' : 'Save & publish'}
        onPrimary={() => { if (!busy) savePublic() }}
      >
        {enabled && pub.slug && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open(`/u/${pub.slug}`, '_blank', 'noopener,noreferrer')}
          >
            Preview
          </Button>
        )}
        <Badge variant="outline" className={cn(
          'text-[0.68rem]',
          enabled ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
        )}
        >
          {enabled ? 'Published' : 'Draft'}
        </Badge>
      </WorkspaceHeader>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.68rem] text-muted-foreground">
            /u/
          </span>
          <Input className="h-8 border-0 bg-background pl-8 text-sm shadow-none" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
        </div>
        <p className="truncate text-[0.68rem] text-muted-foreground sm:max-w-[240px]">{publicUrl}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <SectionCard title="Visibility">
            <label className="flex items-center justify-between gap-3 py-1.5">
              <span className="text-sm">Enable public profile</span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </label>
          </SectionCard>

          <SectionCard title="Sections" action={<span className="text-[0.68rem] text-muted-foreground">Auto from profile data</span>}>
            <ul className="divide-y divide-border">
              {sections.map((s) => (
                <li key={s.id} className="flex items-center gap-2 py-2">
                  <span className="min-w-0 flex-1 text-sm">{s.label}</span>
                  <span className="text-[0.68rem] text-muted-foreground">{s.on ? 'On' : 'Empty'}</span>
                  {s.locked ? (
                    <span className={cn(
                      'size-4 shrink-0 rounded-full border-2',
                      s.on ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/30',
                    )} />
                  ) : (
                    <Switch
                      checked={s.on}
                      onCheckedChange={(v) => {
                        if (s.id === 'contact-email') setShowEmail(v)
                        if (s.id === 'contact-phone') setShowPhone(v)
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Theme" action={<span className="text-[0.68rem] text-muted-foreground">Preview only</span>}>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                    theme === t.id ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/30',
                  )}
                >
                  <span className={cn('size-4 rounded-full', t.swatch)} />
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[0.68rem] text-muted-foreground">Theme selection is a visual hint — full theming ships in a later release.</p>
          </SectionCard>

          {msg && (
            <p className={cn('text-sm', msg.includes('Could') ? 'text-destructive' : 'text-muted-foreground')}>{msg}</p>
          )}
        </div>

        <SectionCard title="Live preview" action={<span className="text-[0.68rem] text-muted-foreground">Desktop</span>} className="lg:sticky lg:top-4 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-2.5 py-1.5">
              <span className="size-2 rounded-full bg-red-400/80" />
              <span className="size-2 rounded-full bg-amber-400/80" />
              <span className="size-2 rounded-full bg-emerald-400/80" />
              <div className="mx-auto min-w-0 flex-1 truncate rounded-md bg-background px-2 py-0.5 text-center text-[0.62rem] text-muted-foreground">
                glowminds.app/u/{slugify(slug)}
              </div>
            </div>
            <div className={cn(
              'space-y-3 p-3 text-xs',
              theme === 'midnight' && 'bg-slate-950 text-slate-100',
              theme === 'paper' && 'bg-stone-50 text-stone-900',
              theme === 'signal' && 'bg-gradient-to-br from-primary/10 to-background',
            )}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  theme === 'midnight' ? 'bg-slate-800 text-slate-100' : 'bg-muted text-foreground',
                )}
                >
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{displayName}</p>
                  <p className={cn('truncate text-[0.68rem]', theme === 'midnight' ? 'text-slate-400' : 'text-muted-foreground')}>
                    {profile?.headline || 'Your headline'}
                    {profile?.location ? ` · ${profile.location}` : ''}
                  </p>
                </div>
              </div>
              {profile?.summary && (
                <p className={cn('line-clamp-3 text-[0.68rem] leading-relaxed', theme === 'midnight' ? 'text-slate-300' : 'text-muted-foreground')}>
                  {profile.summary}
                </p>
              )}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {skills.slice(0, 4).map((s) => (
                    <span key={s} className={cn(
                      'rounded px-1.5 py-0.5 text-[0.6rem]',
                      theme === 'midnight' ? 'bg-slate-800 text-slate-300' : 'bg-muted text-muted-foreground',
                    )}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {(profile?.experience || []).length > 0 && (
                <div className="space-y-1.5 border-t border-border/50 pt-2">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-wide opacity-70">Experience</p>
                  {(profile.experience || []).slice(0, 2).map((e, i) => (
                    <div key={i}>
                      <p className="font-semibold">{e.role || e.title}</p>
                      <p className={cn('text-[0.62rem]', theme === 'midnight' ? 'text-slate-400' : 'text-muted-foreground')}>{e.company}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
