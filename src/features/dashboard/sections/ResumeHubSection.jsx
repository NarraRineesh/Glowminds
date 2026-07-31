import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GlowmindsResumeSection from '@/features/dashboard/sections/GlowmindsResumeSection'
import useAppStore from '@/store/authStore'
import useIsPro from '@/hooks/useIsPro'
import { loadEmbedResumes, saveEmbedResumeImmediate } from '@/services/resumeStore'
import { reviewResume } from '@/services/resumeAi'
import { logActivity } from '@/services/activityLog'
import { auth } from '@/services/firebase'
import useProfileStore from '@/store/profileStore'
import { v2Debug } from '@/utils/v2Debug'
import { ScoreGauge, SectionCard } from '@/features/dashboard/components/v2'
import { AppIcon, Button, Progress } from '@/components/ui'

const TABS = [
  { id: 'builder', label: 'Builder' },
  { id: 'ats', label: 'ATS Score' },
  { id: 'resumes', label: 'My Resumes' },
  { id: 'templates', label: 'Templates' },
]

/** [v2:ats] Resume hub with ATS score tab on top of existing builder */
export default function ResumeHubSection() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'builder'
  const user = useAppStore((s) => s.user)
  const isPro = useIsPro()
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const profileAnalysis = useProfileStore((s) => s.profile?.resumeAnalysis)
  const [resumes, setResumes] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const active = useMemo(() => resumes[0] || null, [resumes])
  const analysis = active?.data?.metadata?.analysis || active?.metadata?.analysis || profileAnalysis || null

  useEffect(() => {
    if (!user?.uid) return
    loadEmbedResumes(user.uid)
      .then(setResumes)
      .catch(() => setResumes([]))
  }, [user?.uid, tab])

  const setTab = (id) => {
    const next = new URLSearchParams(params)
    if (id === 'builder') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  const runAts = async () => {
    if (!active) {
      setError('Create a resume in the Builder first.')
      return
    }
    if (!isPro) {
      setError('ATS Score is a Pro feature.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      // [v2:ats] Reuse existing resume-review API; persist for Overview scores
      const result = await reviewResume({ resume: active })
      v2Debug('ats', 'review result', result?.overallScore)
      const uid = auth.currentUser?.uid
      const nextResume = {
        ...active,
        data: {
          ...(active.data || {}),
          metadata: {
            ...(active.data?.metadata || {}),
            analysis: result,
          },
        },
      }
      if (uid) {
        await saveEmbedResumeImmediate(uid, nextResume, { isPro })
        await updateProfile({ resumeAnalysis: result })
        await logActivity(uid, { type: 'ats', title: `ATS score ${result?.overallScore ?? '—'}` })
      }
      setResumes((prev) => prev.map((r) => (r.id === nextResume.id ? nextResume : r)))
    } catch (err) {
      setError(err.message || 'ATS check failed')
    } finally {
      setBusy(false)
    }
  }

  const scorecard = Array.isArray(analysis?.scorecard) ? analysis.scorecard : []
  const suggestions = Array.isArray(analysis?.suggestions) ? analysis.suggestions : []

  return (
    <div className={tab === 'builder' ? 'h-full min-h-0 w-full' : 'flex h-full min-h-0 w-full flex-col gap-3 p-4'}>
      {tab !== 'builder' && (
        <div className="flex gap-1 rounded-lg bg-muted p-1 self-start">
          {TABS.map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={tab === t.id ? 'default' : 'ghost'}
              className="h-8"
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      )}

      {tab === 'builder' && <GlowmindsResumeSection />}

      {tab === 'ats' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="ATS Score" className="lg:col-span-1">
            <div className="flex flex-col items-center gap-3 py-2">
              <ScoreGauge score={analysis?.overallScore || 0} size={140} label="/100" />
              <Button type="button" disabled={busy} onClick={runAts}>
                {busy ? 'Scoring…' : analysis ? 'Re-run ATS check' : 'Run ATS check'}
              </Button>
              {error && <p className="text-center text-sm text-destructive">{error}</p>}
            </div>
          </SectionCard>
          <SectionCard title="Breakdown" className="lg:col-span-1">
            {scorecard.length ? (
              <ul className="space-y-3">
                {scorecard.map((row) => (
                  <li key={row.id || row.name}>
                    <div className="mb-1 flex justify-between text-[0.75rem]">
                      <span className="font-medium">{row.name || row.id}</span>
                      <span className="tabular-nums text-muted-foreground">{row.score ?? row.value ?? 0}</span>
                    </div>
                    <Progress value={Number(row.score ?? row.value ?? 0)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Run an ATS check to see content, skills, formatting, and keyword breakdown.</p>
            )}
          </SectionCard>
          <SectionCard title="AI Suggestions" className="lg:col-span-1">
            {suggestions.length ? (
              <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
                {suggestions.slice(0, 8).map((s, i) => (
                  <li key={i}>{typeof s === 'string' ? s : s.text || s.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Suggestions appear after an ATS review.</p>
            )}
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setTab('builder')}>
              Open builder
            </Button>
          </SectionCard>
        </div>
      )}

      {tab === 'resumes' && (
        <SectionCard title="My Resumes">
          {!resumes.length ? (
            <div className="py-6 text-center">
              <AppIcon name="resume" className="mx-auto mb-2 size-8 opacity-40" />
              <p className="text-sm text-muted-foreground">No resumes yet.</p>
              <Button type="button" className="mt-3" size="sm" onClick={() => setTab('builder')}>Create resume</Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {resumes.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.title || r.name || 'Untitled resume'}</p>
                    <p className="text-[0.7rem] text-muted-foreground">
                      ATS {r.data?.metadata?.analysis?.overallScore ?? r.metadata?.analysis?.overallScore ?? '—'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => { setTab('ats') }}>
                      ATS
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => navigate(`/dashboard/resume/${r.id}`)}>
                      Edit
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {tab === 'templates' && (
        <SectionCard title="Templates">
          <div className="space-y-3">
            <p className="m-0 text-sm text-muted-foreground">
              Templates live in the Builder — open a resume and use Design → Template on the right (or Export tab on mobile).
            </p>
            <Button type="button" size="sm" onClick={() => setTab('builder')}>
              Go to Builder
            </Button>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
