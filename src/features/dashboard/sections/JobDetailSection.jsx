import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useAppStore from '@/store/authStore'
import useJobStore from '@/store/jobStore'
import useTrackerStore from '@/store/trackerStore'
import useProfileStore from '@/store/profileStore'
import { apiFetch } from '@/services/apiClient'
import { getJobById } from '@/services/jobSearch'
import Loader from '@/components/Loader'
import { APPLICATION_STATUS } from '@/constants/schema'
import { formatDateRange } from '@/utils/profileDates'
import { formatPrimaryEducationSummary } from '@/utils/educationEntries'
import { JobMetaItem, JobMetaRow } from '@/features/dashboard/components/JobMeta'
import JobDescriptionHtml from '@/features/dashboard/components/JobDescriptionHtml'
import '@/styles/dashboard.css'
import '@/styles/jobs.css'
import '@/styles/cards.css'
import '@/styles/forms.css'

export default function JobDetailSection() {
  const { jobId: rawJobId } = useParams()
  const jobId = rawJobId ? decodeURIComponent(rawJobId) : ''
  const navigate = useNavigate()
  const { addToast } = useAppStore()
  const { jobs, isJobSaved, saveJob, unsaveJob, loadSavedJobs } = useJobStore()
  const loadProfile = useProfileStore((s) => s.load)
  const { addApp, loadApps, apps } = useTrackerStore()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [applying, setApplying] = useState(false)

  const applied = useMemo(
    () => apps.some((a) => a.jobId === jobId),
    [apps, jobId],
  )
  const [aiMatch, setAiMatch] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [clLoading, setClLoading] = useState(false)
  const [clCopied, setClCopied] = useState(false)

  useEffect(() => {
    if (!jobId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setAiMatch(null)
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
    setApplying(true)
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
    setApplying(false)
    if (application) {
      addToast('success', `✅ Applied to ${j.title} at ${company}! Added to your tracker.`)
      if (j.url) window.open(j.url, '_blank', 'noopener,noreferrer')
    } else {
      addToast('error', '⚠️ Failed to track application')
    }
  }

  const toggleSave = async (j) => {
    if (isJobSaved(j.id)) {
      await unsaveJob(j.id)
      addToast('info', '🔖 Job removed from saved')
    } else {
      await saveJob(j)
      addToast('success', '🔖 Job saved!')
    }
  }

  const runAiMatch = async () => {
    if (!job || aiLoading) return
    setAiLoading(true)
    try {
      await loadProfile({ force: false })
      const p = useProfileStore.getState().profile || {}
      const skills = (p.skills?.technical || []).join(', ')
      const experienceCount = Array.isArray(p.experience) ? p.experience.length : 0
      const experience = p.isFresher ? 'Fresher' : (experienceCount ? `${experienceCount} role${experienceCount > 1 ? 's' : ''}` : '')
      const data = await apiFetch('/ai/job-match', {
        body: {
          userSkills: skills,
          userExperience: experience,
          jobTitle: job.title,
          jobCompany: job.company || job.co,
          jobDesc: job.description || job.desc,
          jobTags: job.tags,
        },
      })
      setAiMatch(data)
    } catch (err) {
      console.error('AI match error:', err)
      addToast('error', '⚠️ Failed to analyze match')
    }
    setAiLoading(false)
  }

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
      addToast('error', '⚠️ Failed to generate cover letter')
    }
    setClLoading(false)
  }

  if (loading) {
    return <Loader variant="section" label="Loading job details…" />
  }

  if (error || !job) {
    return (
      <div className="jobs-section">
        <div className="jobs-empty">
          <div className="jobs-empty-icon">💼</div>
          <h3>{error || 'Job not found'}</h3>
          <p>This listing may have expired or been removed.</p>
          <div className="jobs-empty-actions">
            <Link to="/dashboard/jobs" className="btn btn-p btn-sm">← Back to Job Board</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="jobs-section job-detail">
      <button type="button" className="btn btn-gh btn-sm job-detail-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="card job-detail-card">
        <div className="job-detail-header">
          <div className="job-detail-logo">{job.logo}</div>
          <div className="job-detail-head">
            <h1 className="job-detail-title">{job.title}</h1>
            <JobMetaRow>
              {(job.company || job.co) && <JobMetaItem icon="🏢">{job.company || job.co}</JobMetaItem>}
              {(job.location || job.loc) && (
                <JobMetaItem icon={job.remote ? '🌐' : '📍'}>{job.location || job.loc}</JobMetaItem>
              )}
              {job.type && <JobMetaItem icon="💼">{job.type}</JobMetaItem>}
              {job.posted && <JobMetaItem icon="🕒">{job.posted}</JobMetaItem>}
              <JobMetaItem icon="💰" className={`jc-meta--salary${!(job.salary || job.sal) ? ' is-muted' : ''}`}>
                {job.salary || job.sal || 'Not listed'}
              </JobMetaItem>
            </JobMetaRow>
          </div>
          <div className="job-detail-match">
            <span className="job-detail-match-val">{job.match || 0}%</span>
            <span className="job-detail-match-lbl">🎯 profile match</span>
          </div>
        </div>

        <div className="match-bar job-detail-match-bar"><div className="match-fill" style={{ width: `${job.match || 0}%` }} /></div>

        <div className="job-detail-tags">
          {job.tags.map((t) => <span key={t} className="tag tb">{t}</span>)}
          {job.type && <span className="tag tg">{job.type}</span>}
        </div>

        <div className="job-detail-actions">
          <button type="button" className="btn btn-o" onClick={() => toggleSave(job)}>
            {isJobSaved(job.id) ? '❤️ Saved' : '🔖 Save'}
          </button>
          <button type="button" className="btn btn-o" disabled={clLoading} onClick={generateCoverLetter}>
            {clLoading ? '⏳ Generating…' : '✉️ Cover Letter'}
          </button>
          {applied ? (
            <Link to="/dashboard/applications" className="btn btn-g">✅ Applied · View tracker</Link>
          ) : (
            <button type="button" className="btn btn-g" disabled={applying} onClick={() => handleApply(job)}>
              {applying ? '⏳ Applying…' : 'Apply'}
            </button>
          )}
        </div>

        <section className="job-detail-section">
          <h2>Job Description</h2>
          <JobDescriptionHtml html={job.descHtml} plain={job.description || job.desc} />
        </section>

        {job.req && job.req[0] !== 'See full job description for details' && (
          <section className="job-detail-section">
            <h2>Requirements</h2>
            <ul className="job-detail-reqs">
              {job.req.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
        )}

        <section className="job-detail-section job-detail-ai">
          <div className="job-detail-ai-head">
            <h2>🎯 Match Analysis</h2>
            {!aiMatch && (
              <button type="button" className="btn btn-p btn-sm" disabled={aiLoading} onClick={runAiMatch}>
                {aiLoading ? '⏳ Analyzing…' : '🤖 AI Match'}
              </button>
            )}
          </div>

          {!aiMatch ? (
            <p className="job-detail-ai-hint">
              Get AI-powered insight on how well this role fits your profile, skills to highlight, and gaps to close.
            </p>
          ) : (
            <div>
              <div className="job-detail-ai-score-row">
                <div className={`job-detail-ai-score job-detail-ai-score--${aiMatch.score >= 80 ? 'high' : aiMatch.score >= 60 ? 'mid' : 'low'}`}>
                  {aiMatch.score}%
                </div>
                <div>
                  <div className="job-detail-ai-verdict">{aiMatch.verdict}</div>
                  <p className="job-detail-ai-summary">{aiMatch.summary}</p>
                </div>
              </div>
              <div className="job-detail-ai-grid">
                {aiMatch.matchedSkills?.length > 0 && (
                  <div>
                    <div className="job-detail-ai-label job-detail-ai-label--ok">✅ Matched Skills</div>
                    <div className="job-detail-ai-chips">
                      {aiMatch.matchedSkills.map((s) => <span key={s} className="job-detail-chip job-detail-chip--ok">{s}</span>)}
                    </div>
                  </div>
                )}
                {aiMatch.missingSkills?.length > 0 && (
                  <div>
                    <div className="job-detail-ai-label job-detail-ai-label--warn">⚡ Skills to Learn</div>
                    <div className="job-detail-ai-chips">
                      {aiMatch.missingSkills.map((s) => <span key={s} className="job-detail-chip job-detail-chip--warn">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
              {aiMatch.recommendations?.length > 0 && (
                <div className="job-detail-recs">
                  <div className="job-detail-ai-label job-detail-ai-label--tip">💡 Recommendations</div>
                  <ul>
                    {aiMatch.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {coverLetter && (
          <section className="job-detail-section job-detail-cover">
            <div className="job-detail-ai-head">
              <h2>✉️ Cover Letter</h2>
              <button type="button" className="btn btn-gh btn-sm" onClick={() => {
                navigator.clipboard.writeText(coverLetter)
                setClCopied(true)
                setTimeout(() => setClCopied(false), 2000)
              }}>
                {clCopied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div className="job-detail-cover-text">{coverLetter}</div>
          </section>
        )}
      </div>
    </div>
  )
}
