import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GlowmindsResumeSection from '@/features/dashboard/sections/GlowmindsResumeSection'
import useAppStore from '@/store/authStore'
import useIsPro from '@/hooks/useIsPro'
import { loadEmbedResumes, saveEmbedResumeImmediate } from '@/services/resumeStore'
import { improveText, reviewResume } from '@/services/resumeAi'
import { apiFetch } from '@/services/apiClient'
import { logActivity } from '@/services/activityLog'
import { auth } from '@/services/firebase'
import useProfileStore from '@/store/profileStore'
import { v2Debug } from '@/utils/v2Debug'
import { profileToGlowmindsResume } from '@/utils/profileToGlowmindsResume'
import { ScoreGauge, SectionCard } from '@/features/dashboard/components/v2'
import { AppIcon, Button, Progress } from '@/components/ui'
import { RESUME_TEMPLATES, templatePreviewSrc } from '@/constants/resumeTemplates'

const TABS = [
  { id: 'templates', label: '1. Templates' },
  { id: 'builder', label: '2. Details' },
  { id: 'ats', label: '3. AI Analysis' },
  { id: 'resumes', label: 'My Resumes' },
]

function flattenResumeText(resume) {
  const data = resume?.data || resume || {}
  const parts = [
    data.basics?.name,
    data.basics?.headline,
    data.summary?.content?.replace(/<[^>]+>/g, ' '),
  ]
  const sections = data.sections || {}
  for (const key of Object.keys(sections)) {
    const items = sections[key]?.items || []
    for (const item of items) {
      parts.push(item.company, item.position, item.name, item.description?.replace?.(/<[^>]+>/g, ' ') || item.summary)
    }
  }
  return parts.filter(Boolean).join('\n').replace(/\s+/g, ' ').trim()
}

export default function ResumeHubSection() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'templates'
  const user = useAppStore((s) => s.user)
  const isPro = useIsPro()
  const addToast = useAppStore((s) => s.addToast)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const profileAnalysis = useProfileStore((s) => s.profile?.resumeAnalysis)
  const [resumes, setResumes] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [grammar, setGrammar] = useState(null)
  const [rewrites, setRewrites] = useState([])

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
    if (id === 'templates') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  const startFromTemplate = async (templateId) => {
    if (!user?.uid) return
    setBusy(true)
    setError(null)
    try {
      const store = useProfileStore.getState()
      if (!store.loaded) await store.load()
      const built = profileToGlowmindsResume(user, store.profile, store.user)
      const id = crypto.randomUUID()
      const resume = {
        ...built,
        id,
        slug: id,
        name: `${user.displayName || 'Resume'} — ${templateId}`,
        data: {
          ...built.data,
          metadata: {
            ...(built.data?.metadata || {}),
            template: isPro ? templateId : (templateId === 'onyx' ? 'onyx' : templateId),
          },
        },
      }
      if (!isPro) {
        resume.data.metadata.template = 'onyx'
      }
      await saveEmbedResumeImmediate(user.uid, resume, { isPro })
      navigate(`/dashboard/resume/${id}`)
    } catch (err) {
      setError(err.message || 'Could not create resume')
      addToast?.('error', err.message || 'Could not create resume')
    } finally {
      setBusy(false)
    }
  }

  const runAnalysis = async () => {
    if (!active) {
      setError('Select a template and add details first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const text = flattenResumeText(active)
      const [result, grammarRes] = await Promise.all([
        isPro
          ? reviewResume({ resume: active }).catch((err) => {
              throw err
            })
          : Promise.resolve(null),
        text.length >= 3
          ? apiFetch('/ai/grammar', { body: { text: text.slice(0, 8000) } }).catch(() => null)
          : Promise.resolve(null),
      ])
      v2Debug('ats', 'review result', result?.overallScore)
      setGrammar(grammarRes)
      if (result) {
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
      }
    } catch (err) {
      setError(err.message || 'AI analysis failed')
    } finally {
      setBusy(false)
    }
  }

  const improveSummary = async () => {
    const raw = String(active?.data?.summary?.content || '').replace(/<[^>]+>/g, ' ').trim()
    if (raw.length < 3) {
      setError('Add a summary in Details first.')
      return
    }
    setBusy(true)
    try {
      const variants = await improveText({ text: raw, tone: 'professional' })
      setRewrites(variants)
    } catch (err) {
      setError(err.message || 'Could not improve text')
    } finally {
      setBusy(false)
    }
  }

  const scorecard = Array.isArray(analysis?.scorecard) ? analysis.scorecard : []
  const suggestions = Array.isArray(analysis?.suggestions) ? analysis.suggestions : []

  return (
    <div className={tab === 'builder' ? 'flex h-full min-h-0 w-full flex-col' : 'flex h-full min-h-0 w-full flex-col gap-3 p-4'}>
      <div className={`flex flex-wrap items-center gap-2 ${tab === 'builder' ? 'px-4 pt-2' : ''}`}>
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
          <p className="m-0 text-xs text-muted-foreground">
            Templates → select → enter or sync details → GLOWMINDS AI analysis
          </p>
        </div>

      {tab === 'templates' && (
        <SectionCard title="Resume templates">
          <p className="mb-3 mt-0 text-sm text-muted-foreground">
            Pick a layout first. Free plan uses Onyx; Pro unlocks every template. Next you will enter or sync details, then run AI analysis.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RESUME_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                disabled={busy}
                onClick={() => void startFromTemplate(tpl.id)}
                className="overflow-hidden rounded-xl border border-border bg-card text-left hover:border-primary/40"
              >
                <img src={templatePreviewSrc(tpl.id)} alt="" className="aspect-[3/4] w-full object-cover object-top bg-muted" />
                <div className="p-3">
                  <p className="m-0 text-sm font-semibold">{tpl.name}</p>
                  <p className="m-0 mt-1 text-xs text-muted-foreground">{tpl.desc}</p>
                  {!isPro && tpl.id !== 'onyx' ? (
                    <p className="m-0 mt-1 text-[0.65rem] uppercase tracking-wide text-primary">Pro template · opens as Onyx on Free</p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'builder' && (
        <div className="min-h-0 flex-1">
          <GlowmindsResumeSection />
        </div>
      )}

      {tab === 'ats' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="GLOWMINDS AI analysis" className="lg:col-span-1">
            <div className="flex flex-col items-center gap-3 py-2">
              <ScoreGauge score={analysis?.overallScore || grammar?.score || 0} size={140} label="/100" />
              <Button type="button" disabled={busy} onClick={runAnalysis}>
                {busy ? 'Analyzing…' : 'Run grammar, quality & ATS check'}
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={improveSummary}>
                Improve summary descriptions
              </Button>
              {error && <p className="text-center text-sm text-destructive">{error}</p>}
              {!isPro && (
                <p className="m-0 text-center text-xs text-muted-foreground">
                  Grammar runs on Free. Full ATS review is Pro.
                </p>
              )}
            </div>
          </SectionCard>
          <SectionCard title="Quality breakdown" className="lg:col-span-1">
            {scorecard.length ? (
              <ul className="space-y-3">
                {scorecard.map((row) => (
                  <li key={row.id || row.name || row.dimension}>
                    <div className="mb-1 flex justify-between text-[0.75rem]">
                      <span className="font-medium">{row.name || row.dimension || row.id}</span>
                      <span className="tabular-nums text-muted-foreground">{row.score ?? row.value ?? 0}</span>
                    </div>
                    <Progress value={Number(row.score ?? row.value ?? 0)} />
                  </li>
                ))}
              </ul>
            ) : grammar?.suggestions?.length ? (
              <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
                {grammar.suggestions.slice(0, 8).map((s, i) => (
                  <li key={i}>{s.reason || `${s.original} → ${s.replacement}`}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Run analysis for grammar, content quality, and keywords.</p>
            )}
          </SectionCard>
          <SectionCard title="Fixes & stronger wording" className="lg:col-span-1">
            {suggestions.length ? (
              <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
                {suggestions.slice(0, 8).map((s, i) => (
                  <li key={i}>{typeof s === 'string' ? s : s.text || s.title}</li>
                ))}
              </ul>
            ) : null}
            {rewrites.length ? (
              <div className="mt-3 space-y-2">
                <p className="m-0 text-xs font-semibold uppercase text-muted-foreground">Improved descriptions</p>
                {rewrites.map((r) => (
                  <p key={r} className="m-0 rounded-md border border-border bg-muted/40 p-2 text-sm">{r}</p>
                ))}
              </div>
            ) : null}
            {!suggestions.length && !rewrites.length ? (
              <p className="text-sm text-muted-foreground">Suggestions appear after analysis or Improve summary.</p>
            ) : null}
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setTab('builder')}>
              Back to details
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
              <Button type="button" className="mt-3" size="sm" onClick={() => setTab('templates')}>Choose a template</Button>
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
                    <Button type="button" size="sm" variant="outline" onClick={() => setTab('ats')}>
                      Analyze
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
    </div>
  )
}
