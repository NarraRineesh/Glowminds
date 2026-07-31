import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useJobStore from '@/store/jobStore'
import useTrackerStore from '@/store/trackerStore'
import useProfileStore from '@/store/profileStore'
import useEntitlements from '@/hooks/useEntitlements'
import { apiFetch } from '@/services/apiClient'
import { getJobById } from '@/services/jobSearch'
import { buildJobMatchAnalysis } from '@/utils/jobMatchAnalysis'
import Loader from '@/components/Loader'
import { APPLICATION_STATUS } from '@/constants/schema'
import { formatDateRange } from '@/utils/profileDates'
import { formatPrimaryEducationSummary } from '@/utils/educationEntries'
import { JobMetaItem, JobMetaRow } from '@/features/dashboard/components/JobMeta'
import {
  AppIcon,
  Badge,
  Button,
  Card,
  CardContent,
  DashboardCard,
  Progress,
  StatusBadge,
  cn,
} from '@/components/ui'
import JobDescriptionHtml from '@/features/dashboard/components/JobDescriptionHtml'

function scoreTone(score) {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 60) return 'text-amber-500'
  return 'text-destructive'
}

function buildProfilePayload(userDoc, p) {
  const expSummary = (Array.isArray(p.experience) ? p.experience : [])
    .filter((e) => e && (e.company || e.role))
    .map((e) => {
      const dates = formatDateRange(e.startDate, e.endDate, e.duration || '')
      const bits = [e.description, e.bullets].filter(Boolean).join(' — ')
      return `${e.role || ''} at ${e.company || ''}${dates ? ` (${dates})` : ''}${bits ? ` — ${bits}` : ''}`
    })
    .join('; ') || (p.isFresher ? 'Fresher' : '')
  const projects = (Array.isArray(p.projects) ? p.projects : [])
    .map((proj) => `${proj.name || proj.title || ''}: ${proj.description || ''}`.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join('; ')
  return {
    name: userDoc.firstName
      ? `${userDoc.firstName} ${userDoc.lastName || ''}`.trim()
      : (userDoc.displayName || ''),
    title: p.headline || '',
    headline: p.headline || '',
    skills: p.skills?.technical || [],
    education: formatPrimaryEducationSummary(p),
    experience: expSummary,
    projects,
  }
}

export default function JobDetailSection() {
  const { jobId: rawJobId } = useParams()
  const jobId = rawJobId ? decodeURIComponent(rawJobId) : ''
  const navigate = useNavigate()
  const { addToast, user } = useAppStore()
  const { isJobSaved, saveJob, unsaveJob, loadSavedJobs } = useJobStore()
  const loadProfile = useProfileStore((s) => s.load)
  const profile = useProfileStore((s) => s.profile)
  const { addApp, loadApps, apps } = useTrackerStore()
  const { isPro, credits, creditCosts, loading: entLoading, refresh } = useEntitlements()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [descLoading, setDescLoading] = useState(false)
  const [error, setError] = useState(null)
  const [applying, setApplying] = useState(false)

  const applied = useMemo(
    () => apps.some((a) => a.jobId === jobId),
    [apps, jobId],
  )
  const [coverLetter, setCoverLetter] = useState('')
  const [clLoading, setClLoading] = useState(false)
  const [clCopied, setClCopied] = useState(false)
  const [aiFit, setAiFit] = useState(null)
  const [fitLoading, setFitLoading] = useState(false)
  const [kitBusy, setKitBusy] = useState(false)

  const jobFitCost = creditCosts?.jobFit ?? 3
  const coverCost = creditCosts?.coverLetter ?? 5
  const canFit = typeof credits?.balance !== 'number' || credits.balance >= jobFitCost

  useEffect(() => {
    loadProfile({ force: false })
  }, [loadProfile])

  useEffect(() => {
    if (!jobId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setDescLoading(true)
      setError(null)
      setCoverLetter('')
      setAiFit(null)

      const cached = useJobStore.getState().jobs.find((j) => j.id === jobId)
      if (cached && !cancelled) {
        setJob(cached)
        setLoading(false)
      }

      try {
        const data = await getJobById(jobId)
        if (cancelled) return
        if (!data?.job) {
          if (!cached) {
            setError('Job not found')
            setJob(null)
          }
        } else {
          setJob(data.job)
        }
      } catch (err) {
        if (!cancelled && !cached) setError(err.message || 'Failed to load job')
      } finally {
        if (!cancelled) {
          setLoading(false)
          setDescLoading(false)
        }
      }
    }

    load()
    loadSavedJobs()
    loadApps()
    return () => { cancelled = true }
  }, [jobId, loadSavedJobs, loadApps])

  const handleApply = async (j, notesExtra = '') => {
    if (applying || applied) return
    // Open the apply page synchronously (inside the click gesture) so the
    // browser doesn't block the popup — tracking happens after, async.
    const applyUrl = j.url || j.applyUrl || j.jobUrl || ''
    if (applyUrl) window.open(applyUrl, '_blank', 'noopener,noreferrer')
    setApplying(true)
    try {
      const company = j.company || j.co || ''
      const notes = [
        'Applied via Glowminds',
        notesExtra,
        aiFit?.talkTrack ? `Pitch: ${aiFit.talkTrack.slice(0, 280)}` : '',
      ].filter(Boolean).join('\n')
      const application = await addApp({
        company,
        role: j.title,
        status: APPLICATION_STATUS.APPLIED,
        appliedDate: new Date().toISOString().split('T')[0],
        salary: j.salary || j.sal || '',
        notes,
        logo: j.logo,
        source: j.source || 'ats',
        jobUrl: j.url,
        jobId: j.id,
      })
      if (application) {
        addToast('success', `Applied to ${j.title} at ${company}! Added to your tracker.`)
        const uid = user?.uid
        if (uid) {
          const { awardXp } = await import('@/services/gamification')
          await awardXp(uid, 'apply')
        }
      }
    } catch {
      addToast('error', 'Could not track application. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  const toggleSave = async (j) => {
    if (isJobSaved(j.id)) {
      await unsaveJob(j.id)
      addToast('info', 'Job removed from saved')
    } else {
      await saveJob(j)
      addToast('success', 'Job saved!')
    }
  }

  const matchAnalysis = useMemo(
    () => (job ? buildJobMatchAnalysis(job, profile) : null),
    [job, profile],
  )

  const runJobFit = async () => {
    if (!job || fitLoading) return null
    if (!isPro) {
      addToast('error', 'Glowminds Pro is required for AI Job Fit')
      return null
    }
    if (!canFit) {
      addToast('error', 'Not enough AI credits for job fit')
      return null
    }
    setFitLoading(true)
    try {
      await loadProfile({ force: false })
      const userDoc = useProfileStore.getState().user || user || {}
      const p = useProfileStore.getState().profile || {}
      const data = await apiFetch('/ai/job-fit', {
        body: {
          job: {
            title: job.title,
            company: job.company || job.co,
            description: (job.description || job.desc || '').slice(0, 5000),
          },
          profile: buildProfilePayload(userDoc, p),
        },
      })
      setAiFit(data)
      if (!data.cached) await refresh({ force: true })
      addToast('success', data.cached ? 'Job fit (cached)' : 'AI job fit ready')
      return data
    } catch (err) {
      addToast('error', err?.message || 'Job fit failed')
      return null
    } finally {
      setFitLoading(false)
    }
  }

  const generateCoverLetter = async () => {
    if (!job || clLoading) return null
    setClLoading(true)
    try {
      await loadProfile({ force: false })
      const userDoc = useProfileStore.getState().user || user || {}
      const p = useProfileStore.getState().profile || {}
      const company = job.company || job.co
      const data = await apiFetch('/ai/cover-letter', {
        body: {
          profile: buildProfilePayload(userDoc, p),
          jobTitle: job.title,
          company,
          jobDescription: (job.description || job.desc || '').slice(0, 3500),
          template: 'concise',
        },
      })
      setCoverLetter(data.coverLetter)
      await refresh({ force: true })
      return data.coverLetter
    } catch (err) {
      console.error('Cover letter error:', err)
      addToast('error', err?.message || 'Failed to generate cover letter')
      return null
    } finally {
      setClLoading(false)
    }
  }

  const runApplyKit = async () => {
    if (!job || kitBusy) return
    setKitBusy(true)
    try {
      let fit = aiFit
      if (!fit) fit = await runJobFit()
      let letter = coverLetter
      if (!letter) letter = await generateCoverLetter()
      if (fit || letter) {
        addToast('success', 'Apply Kit ready — copy bullets, open resume, or track apply')
      }
    } finally {
      setKitBusy(false)
    }
  }

  const copyBullets = async () => {
    const text = (aiFit?.tailoredBullets || []).join('\n• ')
    if (!text) return
    try {
      await navigator.clipboard.writeText(`• ${text}`)
      addToast('success', 'Tailored bullets copied')
    } catch {
      addToast('error', 'Could not copy')
    }
  }

  const openResumeWithJob = () => {
    const q = new URLSearchParams({
      targetJobId: job.id,
      targetTitle: job.title || '',
      targetCompany: job.company || job.co || '',
    })
    navigate(`/dashboard/resume?${q.toString()}`)
  }

  const discussInCoach = () => {
    const q = new URLSearchParams({
      jobId: job.id,
      jobTitle: job.title || '',
      company: job.company || job.co || '',
      seed: `Help me prepare to apply for ${job.title} at ${job.company || job.co}. Gaps: ${(aiFit?.gaps || []).slice(0, 3).join('; ') || 'analyze my fit'}.`,
    })
    navigate(`/dashboard/ai?${q.toString()}`)
  }

  if (loading) {
    return <Loader variant="section" label="Loading job details…" />
  }

  if (error || !job) {
    return (
      <Card className="py-12">
        <CardContent className="flex flex-col items-center text-center">
          <AppIcon name="jobs" className="mx-auto mb-3 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-bold text-foreground">{error || 'Job not found'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">This listing may have expired or been removed.</p>
          <div className="mt-4">
            <Link to="/dashboard/jobs">
              <Button size="sm">← Back to Job Board</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayScore = aiFit?.score ?? (typeof job.match === 'number' && job.match > 0 ? job.match : null)
    ?? (typeof matchAnalysis?.score === 'number' && matchAnalysis.score > 0 ? matchAnalysis.score : null)
  const hasMatchScore = typeof displayScore === 'number' && displayScore > 0
  const hits = matchAnalysis?.matches || matchAnalysis?.strengths || aiFit?.strengths || []
  const misses = matchAnalysis?.gaps || aiFit?.gaps || []

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
          ← Jobs
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleSave(job)}
          >
            {isJobSaved(jobId) ? 'Saved' : 'Save'}
          </Button>
          <Button type="button" size="sm" disabled={applying || applied} onClick={() => handleApply(job)}>
            {applied ? 'Tracked' : applying ? 'Adding…' : 'Apply & track'}
          </Button>
        </div>
      </div>

      {hasMatchScore && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3.5">
          <div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-success">{displayScore}% match</Badge>
              {(job.remote || job.location) && <Badge variant="outline">{job.remote ? 'Remote' : job.location}</Badge>}
              {misses.length > 0 && <Badge variant="outline" className="text-warning">{misses.length} skill gap{misses.length > 1 ? 's' : ''}</Badge>}
            </div>
            <p className="m-0 max-w-xl text-sm text-muted-foreground">
              {(job.description || job.desc || '').replace(/<[^>]+>/g, ' ').slice(0, 160) || 'Review fit and use Apply Kit before tracking.'}
              …
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className={cn('font-mono text-3xl font-bold', scoreTone(displayScore))}>{displayScore}</div>
            <span className="text-[11px] text-muted-foreground">Fit score</span>
          </div>
        </div>
      )}

      <DashboardCard contentClassName="space-y-5 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
            {job.logo && /^https?:\/\//.test(job.logo) ? (
              <img src={job.logo} alt="" className="h-full w-full rounded-xl object-cover" />
            ) : (
              <AppIcon name={job.logo || 'jobs'} className="size-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black tracking-tight text-foreground">{job.title}</h1>
            <JobMetaRow>
              {(job.company || job.co) && <JobMetaItem icon="buildings">{job.company || job.co}</JobMetaItem>}
              {(job.location || job.loc) && (
                <JobMetaItem icon={job.remote ? 'globe' : 'map-pin'}>{job.location || job.loc}</JobMetaItem>
              )}
              {job.type && <JobMetaItem icon="jobs">{job.type}</JobMetaItem>}
              {job.posted && <JobMetaItem icon="clock">{job.posted}</JobMetaItem>}
              <JobMetaItem icon="salary" className={cn(!(job.salary || job.sal) && 'text-muted-foreground')}>
                {job.salary || job.sal || 'Not listed'}
              </JobMetaItem>
            </JobMetaRow>
          </div>
          {hasMatchScore && (
            <div className="shrink-0 text-center">
              <div className={cn('text-2xl font-black tabular-nums', scoreTone(displayScore))}>{displayScore}%</div>
              <div className="flex items-center justify-center gap-1 text-[0.68rem] text-muted-foreground">
                <AppIcon name="target" className="size-3" />
                {aiFit ? 'AI fit' : 'profile match'}
              </div>
            </div>
          )}
        </div>

        {hasMatchScore && <Progress value={displayScore} className="h-1.5" />}

        {(hits.length > 0 || misses.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why you match</h3>
              <ul className="space-y-1.5 text-sm">
                {(hits.length ? hits : ['Profile signals align with this role']).slice(0, 4).map((h) => (
                  <li key={String(h)} className="flex gap-2">
                    <AppIcon name="check" className="mt-0.5 size-3.5 shrink-0 text-success" />
                    <span>{typeof h === 'string' ? h : h.text || h.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            {misses.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gaps</h3>
                <ul className="space-y-1.5 text-sm">
                  {misses.slice(0, 4).map((g) => (
                    <li key={String(g)} className="flex gap-2">
                      <AppIcon name="warning" className="mt-0.5 size-3.5 shrink-0 text-warning" />
                      <span>{typeof g === 'string' ? g : g.text || g.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {(job.tags || []).map((t) => <StatusBadge key={t} tone="default">{t}</StatusBadge>)}
          {job.type && <StatusBadge tone="success">{job.type}</StatusBadge>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={kitBusy || fitLoading || !isPro} onClick={() => void runApplyKit()}>
            {kitBusy ? 'Building kit…' : <><AppIcon name="sparkle" className="size-4" /> Apply Kit</>}
          </Button>
          <Button variant="outline" disabled={fitLoading || !isPro || !canFit} onClick={() => void runJobFit()}>
            {fitLoading ? 'Analyzing…' : <><AppIcon name="target" className="size-4" /> AI Fit ({jobFitCost})</>}
          </Button>
          <Button variant="outline" onClick={() => toggleSave(job)}>
            {isJobSaved(job.id) ? (
              <><AppIcon name="heart" className="size-4" weight="fill" /> Saved</>
            ) : (
              <><AppIcon name="bookmark" className="size-4" /> Save</>
            )}
          </Button>
          <Button variant="outline" disabled={clLoading} onClick={() => void generateCoverLetter()}>
            {clLoading ? 'Generating…' : <><AppIcon name="cover-letters" className="size-4" /> Cover ({coverCost})</>}
          </Button>
          <Button variant="outline" onClick={discussInCoach}>
            <AppIcon name="robot" className="size-4" /> Discuss in Coach
          </Button>
          {applied ? (
            <Button variant="secondary" onClick={() => navigate('/dashboard/applications')}>
              <AppIcon name="check-circle" className="size-4" /> Applied · View tracker
            </Button>
          ) : (
            <Button disabled={applying} onClick={() => handleApply(job)}>
              {applying ? 'Applying…' : 'Apply & track'}
            </Button>
          )}
        </div>

        <section className="space-y-2 border-t border-border pt-4">
          <h2 className="text-sm font-bold text-foreground">Job Description</h2>
          {descLoading && !(job.descHtml || job.description || job.desc) ? (
            <p className="text-sm text-muted-foreground">Loading description…</p>
          ) : (
            <JobDescriptionHtml html={job.descHtml} plain={job.description || job.desc} />
          )}
        </section>

        {job.req && job.req[0] !== 'See full job description for details' && (
          <section className="space-y-2 border-t border-border pt-4">
            <h2 className="text-sm font-bold text-foreground">Requirements</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {job.req.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
        )}

        {aiFit && (
          <section className="space-y-3 border-t border-border pt-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <AppIcon name="sparkle" className="size-4" />
              AI Job Fit · {aiFit.verdict}
            </h2>
            <p className="text-sm text-muted-foreground">{aiFit.summary}</p>
            {aiFit.gaps?.length > 0 && (
              <div>
                <p className="mb-1 text-[0.72rem] font-bold uppercase tracking-wide text-amber-500">Gaps</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {aiFit.gaps.map((g) => <li key={g}>{g}</li>)}
                </ul>
              </div>
            )}
            {aiFit.tailoredBullets?.length > 0 && (
              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[0.72rem] font-bold uppercase tracking-wide text-primary">Tailored bullets</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => void copyBullets()}>Copy</Button>
                    <Button variant="outline" size="sm" onClick={openResumeWithJob}>Open resume</Button>
                  </div>
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                  {aiFit.tailoredBullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            )}
            {aiFit.talkTrack && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                <p className="mb-1 text-[0.72rem] font-bold uppercase tracking-wide text-muted-foreground">Talk track</p>
                {aiFit.talkTrack}
              </div>
            )}
          </section>
        )}

        {!aiFit && matchAnalysis && (
          <section className="space-y-3 border-t border-border pt-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <AppIcon name="target" className="size-4" />
              Quick match (profile heuristic)
            </h2>
            <p className="text-sm text-muted-foreground">
              {matchAnalysis.summary} Run <span className="font-semibold text-foreground">AI Fit</span> for tailored bullets and a talk track.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {matchAnalysis.matchedSkills?.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-emerald-500">Matched</div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchAnalysis.matchedSkills.map((s) => (
                      <Badge key={s} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {matchAnalysis.missingSkills?.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-amber-500">To learn</div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchAnalysis.missingSkills.map((s) => (
                      <Badge key={s} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {coverLetter && (
          <section className="space-y-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <AppIcon name="cover-letters" className="size-4" />
                Cover Letter
              </h2>
              <Button variant="ghost" size="sm" onClick={() => {
                navigator.clipboard.writeText(coverLetter)
                setClCopied(true)
                setTimeout(() => setClCopied(false), 2000)
              }}>
                {clCopied ? (
                  <><AppIcon name="check-circle" className="size-4" /> Copied!</>
                ) : (
                  <><AppIcon name="copy" className="size-4" /> Copy</>
                )}
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {coverLetter}
            </div>
          </section>
        )}
      </DashboardCard>
    </div>
  )
}
