import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SEO from '@/components/SEO'
import { bumpPublicStat, getPublicProfile } from '@/services/publicProfile'
import { AppIcon, Badge, Button } from '@/components/ui'
import Loader from '@/components/Loader'

function formatExpDates(e) {
  const start = e.startDate || e.start || ''
  const end = e.endDate || e.end || (e.current ? 'Present' : '')
  if (!start && !end) return null
  return [start, end].filter(Boolean).join(' — ')
}

/** [v2:public] Public career profile at /u/:slug */
export default function PublicCareerProfilePage() {
  const { slug } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getPublicProfile(slug)
      .then((data) => {
        if (cancelled) return
        setProfile(data?.enabled === false ? null : data)
        if (data?.enabled !== false && data?.slug) bumpPublicStat(data.slug || slug, 'views')
      })
      .catch(() => {
        if (!cancelled) setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [slug])

  if (loading) return <Loader variant="section" label="Loading profile…" />
  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <SEO title="Profile not found" path={`/u/${slug || ''}`} noIndex description="This public profile is private or does not exist." />
        <h1 className="text-xl font-bold">Profile not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This public profile is private or does not exist.</p>
        <p className="mt-4"><Link to="/" className="text-sm font-medium text-primary hover:underline">Back to Glowminds</Link></p>
      </div>
    )
  }

  const initials = (profile.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const hasProjects = (profile.projects || []).length > 0
  const hasExperience = (profile.experience || []).length > 0
  const hasEducation = (profile.education || []).length > 0
  const hasSkills = (profile.skills || []).length > 0

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${profile.name} — ${profile.headline || 'Career Profile'}`}
        description={profile.summary?.slice(0, 155) || `${profile.name} on Glowminds`}
        path={`/u/${profile.slug || slug}`}
      />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="text-sm font-bold tracking-tight text-primary">GlowMinds</Link>
          <nav className="flex flex-wrap gap-1">
            {hasExperience && <a href="#experience" className="rounded-md px-2 py-1 text-[0.75rem] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">Experience</a>}
            {hasProjects && <a href="#projects" className="rounded-md px-2 py-1 text-[0.75rem] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">Projects</a>}
            {hasSkills && <a href="#skills" className="rounded-md px-2 py-1 text-[0.75rem] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">Skills</a>}
          </nav>
          {profile.email && (
            <Button type="button" size="sm" asChild>
              <a href={`mailto:${profile.email}`}>Contact</a>
            </Button>
          )}
        </div>
      </header>

      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-[1fr_auto] md:px-6 md:py-12">
          <div className="space-y-4">
            {profile.headline && (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{profile.headline.split('·')[0]?.trim() || profile.headline}</p>
            )}
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{profile.name}</h1>
            {profile.headline && (
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{profile.headline}</p>
            )}
            {profile.summary && (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{profile.summary}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.email && (
                <Button type="button" asChild>
                  <a href={`mailto:${profile.email}`}>Contact me</a>
                </Button>
              )}
              {profile.links?.portfolio && (
                <Button type="button" variant="outline" asChild>
                  <a href={profile.links.portfolio} target="_blank" rel="noreferrer">Portfolio</a>
                </Button>
              )}
              {profile.links?.linkedin && (
                <Button type="button" variant="outline" size="icon" asChild>
                  <a href={profile.links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <AppIcon name="linkedin" className="size-4" />
                  </a>
                </Button>
              )}
              {profile.links?.github && (
                <Button type="button" variant="outline" size="icon" asChild>
                  <a href={profile.links.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                    <AppIcon name="code" className="size-4" />
                  </a>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-muted-foreground">
              {profile.location && (
                <span className="inline-flex items-center gap-1">
                  <AppIcon name="map-pin" className="size-3" /> {profile.location}
                </span>
              )}
              {hasSkills && (
                <span>{(profile.skills || []).slice(0, 4).join(' · ')}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:min-w-[200px]">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-black text-primary">
              {initials}
            </div>
            <div className="grid w-full grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xl font-black tabular-nums">{profile.stats?.views ?? 0}</p>
                <p className="text-[0.65rem] text-muted-foreground">profile views</p>
              </div>
              <div>
                <p className="text-xl font-black tabular-nums">{profile.stats?.resumeDownloads ?? 0}</p>
                <p className="text-[0.65rem] text-muted-foreground">resume downloads</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasExperience && (
        <section id="experience" className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          <h2 className="mb-5 text-lg font-bold">Experience</h2>
          <ul className="space-y-5">
            {(profile.experience || []).map((e, i) => (
              <li key={i} className="flex gap-4 border-b border-border pb-5 last:border-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold uppercase text-muted-foreground">
                  {(e.company || '?').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{e.role || e.title}{e.company ? ` · ${e.company}` : ''}</p>
                  {formatExpDates(e) && (
                    <p className="text-[0.75rem] text-muted-foreground">{formatExpDates(e)}</p>
                  )}
                  {(e.description || e.bullets) && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {e.description || (Array.isArray(e.bullets) ? e.bullets.join('\n') : e.bullets)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasProjects && (
        <section id="projects" className="border-t border-border bg-muted/10">
          <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
            <h2 className="mb-5 text-lg font-bold">Projects</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(profile.projects || []).map((p, i) => (
                <article key={i} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold">{p.name || p.title}</p>
                  {p.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                  )}
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                      View project
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasSkills && (
        <section id="skills" className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          <h2 className="mb-4 text-lg font-bold">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {(profile.skills || []).map((s) => (
              <Badge key={s} variant="secondary">{s}</Badge>
            ))}
          </div>
        </section>
      )}

      {hasEducation && (
        <section className="border-t border-border bg-muted/10">
          <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
            <h2 className="mb-4 text-lg font-bold">Education</h2>
            <ul className="space-y-3">
              {(profile.education || []).map((e, i) => (
                <li key={i}>
                  <p className="font-semibold">{e.degree || e.school}</p>
                  <p className="text-sm text-muted-foreground">{e.school || e.institution}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 md:px-6">
          <span className="text-xs text-muted-foreground">Powered by GlowMinds</span>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to="/">Create yours</Link>
          </Button>
        </div>
      </footer>
    </div>
  )
}
