import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useJobStore from '@/store/jobStore'
import useTrackerStore from '@/store/trackerStore'
import useProfileStore from '@/store/profileStore'
import useIsPro from '@/hooks/useIsPro'
import useEntitlements from '@/hooks/useEntitlements'
import useUpgradePro from '@/hooks/useUpgradePro'
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

export default function JobDetailSection() {
  const { jobId: rawJobId } = useParams()
  const jobId = rawJobId ? decodeURIComponent(rawJobId) : ''
  const navigate = useNavigate()
  const { addToast } = useAppStore()
  const { jobs, isJobSaved, saveJob, unsaveJob, loadSavedJobs } = useJobStore()
  const loadProfile = useProfileStore((s) => s.load)
  const isPro = useIsPro()
  const { entitlements } = useEntitlements()
  const { startUpgrade, loading: upgradeLoading } = useUpgradePro()
  const profile = useProfileStore((s) => s.profile)
  const { addApp, loadApps, apps } = useTrackerStore()
  const freeAppLimit = entitlements?.freeLimits?.applications ?? 10
  const appCount = entitlements?.entitlements?.applicationCount ?? apps.length
  const canTrackMore = isPro || appCount < freeAppLimit

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [applying, setApplying] = useState(false)

  const applied = useMemo(
    () => apps.some((a) => a.jobId === jobId),
    [apps, jobId],
  )
  const [coverLetter, setCoverLetter] = useState('')
  const [clLoading, setClLoading] = useState(false)
  const [clCopied, setClCopied] = useState(false)

  useEffect(() => {
    loadProfile({ force: false })
  }, [loadProfile])

  useEffect(() => {
    if (!jobId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setCoverLetter('')

      const cached = jobs.find((j) => j.id === jobId)
      if (cached) {
        if (!cancelled) {
          setJob(cached)
          setLoading(false)
        }
        getJobById(jobId).then((data) => {
          if (!cancelled && data?.job) setJob(data.job)
        }).catch(() => {})
        return
      }

      try {
        await loadProfile({ force: false })
        const data = await getJobById(jobId)
        if (cancelled) return
        if (!data?.job) {
          setError('Job not found')
          setJob(null)
        } else {
          setJob(data.job)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load job')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    loadSavedJobs()
    loadApps()
    return () => { cancelled = true }
  }, [jobId, jobs, loadProfile, loadSavedJobs, loadApps])

  const handleApply = async (j) => {
    if (applying || applied) return
    if (!canTrackMore) {
      addToast('info', `Free plan allows ${freeAppLimit} tracked applications. Upgrade for unlimited tracking.`)
      navigate('/pricing')
      return
    }
    setApplying(true)
    try {
      const company = j.company || j.co || ''
      const application = await addApp({
        company,
        role: j.title,
        status: APPLICATION_STATUS.APPLIED,
        appliedDate: new Date().toISOString().split('T')[0],
        salary: j.salary || j.sal || '',
        notes: 'Applied via Glowminds',
        logo: j.logo,
        source: j.source || 'ats',
        jobUrl: j.url,
        jobId: j.id,
      })
      if (application) {
        addToast('success', `Applied to ${j.title} at ${company}! Added to your tracker.`)
        if (j.url) window.open(j.url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      addToast('error', 'Could not track application — you may have reached the free limit.')
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

  const generateCoverLetter = async () => {
    if (!job || clLoading) return
    setClLoading(true)
    try {
      await loadProfile({ force: false })
      const userDoc = useProfileStore.getState().user || {}
      const p = useProfileStore.getState().profile || {}
      const expSummary = (Array.isArray(p.experience) ? p.experience : [])
        .filter((e) => e && (e.company || e.role))
        .map((e) => {
          const dates = formatDateRange(e.startDate, e.endDate, e.duration || '')
          const bits = [e.description, e.bullets].filter(Boolean).join(' — ')
          return `${e.role || ''} at ${e.company || ''}${dates ? ` (${dates})` : ''}${bits ? ` — ${bits}` : ''}`
        })
        .join('; ') || (p.isFresher ? 'Fresher' : '')
      const profilePayload = {
        name: userDoc.firstName ? `${userDoc.firstName} ${userDoc.lastName || ''}`.trim() : (userDoc.displayName || ''),
        title: p.headline || '',
        skills: p.skills?.technical || [],
        education: formatPrimaryEducationSummary(p),
        experience: expSummary,
      }
      const company = job.company || job.co
      const data = await apiFetch('/ai/cover-letter', {
        body: {
          profile: profilePayload,
          jobTitle: job.title,
          company,
          jobDescription: (job.description || job.desc || '').slice(0, 1500),
        },
      })
      setCoverLetter(data.coverLetter)
    } catch (err) {
      console.error('Cover letter error:', err)
      addToast('error', 'Failed to generate cover letter')
    }
    setClLoading(false)
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

  const matchScore = job.match || 0

  return (
    <div className="w-full min-w-0">
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => navigate(-1)}>
        ← Back
      </Button>

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
          <div className="shrink-0 text-center">
            <div className={cn('text-2xl font-black tabular-nums', scoreTone(matchScore))}>{matchScore}%</div>
            <div className="flex items-center justify-center gap-1 text-[0.68rem] text-muted-foreground">
              <AppIcon name="target" className="size-3" />
              profile match
            </div>
          </div>
        </div>

        <Progress value={matchScore} className="h-1.5" />

        <div className="flex flex-wrap gap-1.5">
          {job.tags.map((t) => <StatusBadge key={t} tone="default">{t}</StatusBadge>)}
          {job.type && <StatusBadge tone="success">{job.type}</StatusBadge>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toggleSave(job)}>
            {isJobSaved(job.id) ? (
              <><AppIcon name="heart" className="size-4" weight="fill" /> Saved</>
            ) : (
              <><AppIcon name="bookmark" className="size-4" /> Save</>
            )}
          </Button>
          <Button
            variant="outline"
            disabled={clLoading || upgradeLoading}
            onClick={() => {
              if (!isPro) {
                void startUpgrade({ plan: 'yearly' })
                return
              }
              generateCoverLetter()
            }}
          >
            {clLoading ? 'Generating…' : !isPro ? (
              <><AppIcon name="lock" className="size-4" /> Cover Letter (Pro)</>
            ) : (
              <><AppIcon name="cover-letters" className="size-4" /> Cover Letter</>
            )}
          </Button>
          {applied ? (
            <Button variant="secondary" onClick={() => navigate('/dashboard/applications')}>
              <AppIcon name="check-circle" className="size-4" /> Applied · View tracker
            </Button>
          ) : (
            <Button disabled={applying} onClick={() => handleApply(job)}>
              {applying ? 'Applying…' : 'Apply'}
            </Button>
          )}
        </div>

        <section className="space-y-2 border-t border-border pt-4">
          <h2 className="text-sm font-bold text-foreground">Job Description</h2>
          <JobDescriptionHtml html={job.descHtml} plain={job.description || job.desc} />
        </section>

        {job.req && job.req[0] !== 'See full job description for details' && (
          <section className="space-y-2 border-t border-border pt-4">
            <h2 className="text-sm font-bold text-foreground">Requirements</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {job.req.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
        )}

        {matchAnalysis && (
          <section className="space-y-3 border-t border-border pt-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <AppIcon name="target" className="size-4" />
              Match Analysis
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className={cn('text-3xl font-black tabular-nums', scoreTone(matchAnalysis.score))}>
                  {matchAnalysis.score}%
                </div>
                <div>
                  <div className="font-bold text-foreground">{matchAnalysis.verdict}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{matchAnalysis.summary}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {matchAnalysis.matchedSkills?.length > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1 text-[0.72rem] font-bold uppercase tracking-wide text-emerald-500">
                      <AppIcon name="check-circle" className="size-3.5" />
                      Matched Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchAnalysis.matchedSkills.map((s) => (
                        <Badge key={s} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {matchAnalysis.missingSkills?.length > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1 text-[0.72rem] font-bold uppercase tracking-wide text-amber-500">
                      <AppIcon name="lightning" className="size-3.5" />
                      Skills to Learn
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchAnalysis.missingSkills.map((s) => (
                        <Badge key={s} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {matchAnalysis.recommendations?.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1 text-[0.72rem] font-bold uppercase tracking-wide text-primary">
                    <AppIcon name="lightbulb" className="size-3.5" />
                    Recommendations
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {matchAnalysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
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
