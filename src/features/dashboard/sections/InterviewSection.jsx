import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPreferredRole } from '@/constants/schema'
import useAppStore from '@/store/authStore'
import useInterviewStore from '@/store/interviewStore'
import useProfileStore from '@/store/profileStore'
import useEntitlements from '@/hooks/useEntitlements'
import UpgradeGate from '@/components/UpgradeGate'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import {
  AppIcon,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  DashboardCard,
  Input,
  PageTitle,
  Progress,
  Select,
  cn,
} from '@/components/ui'
import { apiFetch } from '@/services/apiClient'

const TYPES = [
  { id: 'mixed', icon: 'target', label: 'Mixed', desc: 'All question types' },
  { id: 'technical', icon: 'laptop', label: 'Technical', desc: 'Coding & concepts' },
  { id: 'behavioral', icon: 'brain', label: 'Behavioral', desc: 'STAR scenarios' },
  { id: 'hr', icon: 'handshake', label: 'HR Round', desc: 'Culture & soft skills' },
]

const COUNT_OPTIONS = [5, 10, 20, 50]
const DEFAULT_COUNT = 10

const LETTERS = ['A', 'B', 'C', 'D']

const TYPE_BADGE = {
  technical: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  behavioral: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  hr: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  mixed: 'border-primary/30 bg-primary/10 text-primary',
}

const DIFF_BADGE = {
  easy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  hard: 'border-destructive/30 bg-destructive/10 text-destructive',
}

function QuestionBadge({ kind, value }) {
  const styles = kind === 'type' ? TYPE_BADGE[value] : DIFF_BADGE[value]
  return (
    <Badge variant="outline" className={cn('text-[0.68rem] capitalize', styles || 'text-muted-foreground')}>
      {value}
    </Badge>
  )
}

function formatSessionDate(when) {
  if (!when) return '—'
  if (when?.toDate) return when.toDate().toLocaleDateString()
  if (when instanceof Date) return when.toLocaleDateString()
  if (typeof when === 'string') {
    const d = new Date(when)
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
  }
  return '—'
}

function InterviewSectionContent() {
  const navigate = useNavigate()
  const { addToast } = useAppStore()
  const { credits, creditCosts, loading: entLoading } = useEntitlements()
  const startStoredSession = useInterviewStore((s) => s.startSession)
  const saveStoredAnswer = useInterviewStore((s) => s.saveAnswer)
  const appendStoredQuestions = useInterviewStore((s) => s.appendQuestions)
  const completeStoredSession = useInterviewStore((s) => s.completeSession)
  const loadHistory = useInterviewStore((s) => s.loadHistory)
  const sessions = useInterviewStore((s) => s.sessions)
  const historyLoading = useInterviewStore((s) => s.loading)

  const [phase, setPhase] = useState('setup')
  const [role, setRole] = useState('')
  const [type, setType] = useState('mixed')
  const [count, setCount] = useState(DEFAULT_COUNT)
  const [showTips, setShowTips] = useState(true)
  const creditCost = creditCosts?.interviewSession ?? 10
  const canAfford = typeof credits?.balance !== 'number' || credits.balance >= creditCost

  useEffect(() => {
    useProfileStore.getState().load().then(() => {
      const p = useProfileStore.getState().profile
      if (!role) setRole(getPreferredRole(p, ''))
    }).catch(() => {})
    loadHistory().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed role once on mount
  }, [loadHistory])

  const lastSession = sessions[0] || null
  const lastScore = lastSession
    ? Math.round(lastSession.percent ?? lastSession.totalScore ?? 0)
    : null

  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [picks, setPicks] = useState({})
  const [currentIdx, setCurrentIdx] = useState(0)

  const [generating, setGenerating] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [evaluations, setEvaluations] = useState([])
  const [sessionSummary, setSessionSummary] = useState(null)

  const resetState = () => {
    setSessionId(null)
    setQuestions([])
    setPicks({})
    setCurrentIdx(0)
    setEvaluations([])
    setSessionSummary(null)
  }

  const startSession = useCallback(async () => {
    const trimmedRole = role.trim()
    if (!trimmedRole) {
      addToast('error', 'Please enter your target role')
      return
    }
    setRole(trimmedRole)
    setGenerating(true)
    try {
      const data = await apiFetch('/ai/interview-questions', {
        body: { role: trimmedRole, type, count },
      })
      const fetched = data.questions || []
      if (!fetched.length) throw new Error('No questions generated')
      const sid = await startStoredSession({ role: trimmedRole, type, questions: fetched })
      resetState()
      setSessionId(sid)
      setQuestions(fetched)
      setPhase('practicing')
      addToast('success', `${fetched.length} MCQs ready. Pick an option for each, then submit.`)
    } catch (err) {
      console.error('Generate questions error:', err)
      addToast('error', err.message || 'Failed to generate questions')
    }
    setGenerating(false)
  }, [role, type, count, addToast, startStoredSession])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const data = await apiFetch('/ai/interview-questions', {
        body: { role, type, count: 5 },
      })
      const more = data.questions || []
      if (more.length) {
        const merged = await appendStoredQuestions({ sessionId, questions, newQuestions: more })
        setQuestions(merged || [...questions, ...more])
        addToast('success', `${more.length} more MCQs added!`)
      }
    } catch (err) {
      console.error('Load more error:', err)
      addToast('error', err.message || 'Failed to load more questions')
    }
    setLoadingMore(false)
  }, [role, type, addToast, appendStoredQuestions, sessionId, questions])

  const pickOption = (qIdx, optIdx) => {
    setPicks((prev) => ({ ...prev, [qIdx]: optIdx }))
  }

  const goTo = (nextIdx) => {
    const clamped = Math.max(0, Math.min(questions.length - 1, nextIdx))
    setCurrentIdx(clamped)
  }

  const submitSession = useCallback(async () => {
    const items = questions.map((q, idx) => ({
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      options: q.options,
      correctIndex: q.correctIndex,
      selectedIndex: Number.isInteger(picks[idx]) ? picks[idx] : -1,
    }))
    const answeredCount = items.filter((it) => it.selectedIndex >= 0).length
    if (answeredCount === 0) {
      addToast('error', 'Pick at least one option before submitting')
      return
    }

    setEvaluating(true)
    setPhase('grading')
    try {
      const data = await apiFetch('/ai/evaluate-session', {
        body: { role, items },
      })
      const evals = Array.isArray(data?.evaluations) ? data.evaluations : []
      setEvaluations(evals)
      setSessionSummary(data?.session || null)

      let snapshot = questions
      for (let idx = 0; idx < items.length; idx += 1) {
        const updated = await saveStoredAnswer({
          sessionId,
          questions: snapshot,
          questionIndex: idx,
          selectedIndex: items[idx].selectedIndex,
          evaluation: evals[idx] || null,
        })
        if (updated) snapshot = updated
      }
      if (sessionId) completeStoredSession(sessionId).catch(() => {})

      setPhase('summary')
      addToast('success', 'Session graded! Scroll for per-question review.')
    } catch (err) {
      console.error('Evaluate session error:', err)
      addToast('error', err.message || 'Failed to grade session')
      setPhase('practicing')
    }
    setEvaluating(false)
  }, [
    addToast,
    completeStoredSession,
    picks,
    questions,
    role,
    saveStoredAnswer,
    sessionId,
  ])

  const exitSession = () => {
    if (sessionId) completeStoredSession(sessionId).catch(() => {})
    setPhase('setup')
    resetState()
  }

  const q = questions[currentIdx]
  const answeredCount = useMemo(
    () => Object.values(picks).filter((v) => Number.isInteger(v) && v >= 0).length,
    [picks],
  )
  const progress = questions.length ? (answeredCount / questions.length) * 100 : 0
  const isLastQuestion = currentIdx + 1 >= questions.length

  if (phase === 'setup') {
    const setupSidebar = (
      <div className="space-y-4">
        <DashboardCard titleIcon="target" title="Target role" contentClassName="space-y-3">
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Software Engineer"
          />
          <p className="text-xs text-muted-foreground">
            Prefills from your profile preferred role when available.
          </p>
        </DashboardCard>

        <DashboardCard titleIcon="interview" title="Session preferences" contentClassName="space-y-3">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Question type</p>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={cn(
                    'rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    type === t.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted/30 hover:border-primary/40',
                  )}
                  onClick={() => setType(t.id)}
                >
                  <AppIcon name={t.icon} className="size-5 text-primary" />
                  <div className="mt-1 text-sm font-semibold text-foreground">{t.label}</div>
                  <div className="text-[0.68rem] text-muted-foreground">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Questions</span>
            <Select
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || DEFAULT_COUNT)}
            >
              {COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} questions</option>
              ))}
            </Select>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={showTips} onCheckedChange={(v) => setShowTips(!!v)} />
            Show hints with each question
          </label>

          <Button
            className="w-full"
            onClick={startSession}
            disabled={generating || entLoading || !role.trim() || !canAfford}
          >
            {generating
              ? `Generating ${count} questions…`
              : `Start mock · ${creditCost} credits`}
          </Button>
          {!canAfford && (
            <p className="text-xs text-amber-600">
              Not enough credits.{' '}
              <Link to="/dashboard/settings" className="underline">Check balance</Link>
            </p>
          )}
        </DashboardCard>

        {lastSession && (
          <DashboardCard titleIcon="trophy" title="Last score" contentClassName="space-y-2">
            <p
              className={cn(
                'text-3xl font-bold tabular-nums',
                lastScore >= 70 ? 'text-emerald-500' : lastScore >= 40 ? 'text-amber-500' : 'text-muted-foreground',
              )}
            >
              {lastScore || '—'}
              {lastScore != null ? <span className="text-base font-medium text-muted-foreground">%</span> : null}
            </p>
            <p className="text-sm text-muted-foreground">
              {lastSession.role || 'Session'} · {lastSession.type || 'mixed'}
            </p>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                if (lastSession.role) setRole(lastSession.role)
                if (lastSession.type) setType(lastSession.type)
              }}
            >
              Reuse this setup
            </Button>
          </DashboardCard>
        )}
      </div>
    )

    return (
      <ToolPage>
        <ToolSidebarLayout sidebar={setupSidebar}>
          <DashboardCard>
            <div className="flex flex-col items-center gap-3 py-10 text-center sm:py-14">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <AppIcon name="interview" className="size-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Practice your next interview</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Set a role and question style in the sidebar, then start a mock.
                Answers are graded in one pass when you submit the session.
              </p>
            </div>
          </DashboardCard>

          <DashboardCard titleIcon="clock" title="Recent sessions" contentClassName="space-y-3">
            {historyLoading && !sessions.length ? (
              <p className="text-sm text-muted-foreground">Loading history…</p>
            ) : !sessions.length ? (
              <p className="text-sm text-muted-foreground">
                No past sessions yet. Finish a mock to see scores here.
              </p>
            ) : (
              <ul className="space-y-2">
                {sessions.slice(0, 8).map((s) => {
                  const score = typeof s.totalScore === 'number'
                    ? Math.round(s.totalScore)
                    : typeof s.percent === 'number'
                      ? Math.round(s.percent)
                      : null
                  return (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{s.role || 'Interview'}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.type || 'mixed'} · {formatSessionDate(s.completedAt || s.createdAt)}
                          {score != null ? ` · ${score}%` : ''}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (s.role) setRole(s.role)
                          if (s.type) setType(s.type)
                          addToast('success', `Prefill: ${s.role || 'role'}`)
                        }}
                      >
                        Reuse
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </DashboardCard>
        </ToolSidebarLayout>
      </ToolPage>
    )
  }

  if (phase === 'practicing' && q) {
    const selected = picks[currentIdx]
    return (
      <ToolPage>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <PageTitle
            title="Mock Interview"
            subtitle={`${role} — ${type === 'mixed' ? 'Mixed' : type} MCQs`}
            className="mb-0"
          />
          <div className="flex gap-1.5">
            <Button size="sm" onClick={submitSession} disabled={evaluating || answeredCount === 0}>
              {evaluating ? 'Grading…' : 'Submit & Grade'}
            </Button>
            <Button variant="ghost" size="sm" onClick={exitSession}>
              <AppIcon name="x" className="size-4" /> End
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-[0.78rem] text-muted-foreground">
            <span className="font-semibold text-foreground">Q{currentIdx + 1}/{questions.length}</span>
            <Progress value={progress} className="h-2 min-w-[120px] flex-1" />
            <span>{answeredCount}/{questions.length} answered</span>
          </div>

          <Card>
            <CardContent className="space-y-4 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[0.72rem] font-bold uppercase tracking-wide text-muted-foreground">
                  Question {currentIdx + 1}
                </div>
                <div className="flex gap-1.5">
                  <QuestionBadge kind="type" value={q.type} />
                  <QuestionBadge kind="difficulty" value={q.difficulty} />
                </div>
              </div>

              <div className="text-[0.92rem] font-semibold leading-relaxed text-foreground">{q.question}</div>

              {showTips && q.tips && (
                <div className="flex items-start gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[0.78rem] text-muted-foreground">
                  <AppIcon name="lightbulb" className="mt-0.5 size-4 shrink-0" />
                  <span><strong className="text-foreground">Approach:</strong> {q.tips}</span>
                </div>
              )}

              {showTips && Array.isArray(q.hints) && q.hints.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-[0.78rem] text-muted-foreground">
                  <strong className="flex items-center gap-1 text-foreground">
                    <AppIcon name="sparkle" className="size-3.5" /> Hints:
                  </strong>
                  <ul className="mt-1 list-disc pl-5">
                    {q.hints.slice(0, 4).map((h, i) => (
                      <li key={i} className="leading-relaxed">{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selected === optIdx
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => pickOption(currentIdx, optIdx)}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted hover:border-primary/30',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.78rem] font-bold',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground',
                        )}
                      >
                        {LETTERS[optIdx]}
                      </span>
                      <span className={cn('text-[0.86rem] leading-relaxed', isSelected ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>
                        {opt}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-wrap justify-between gap-2 pt-1">
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => goTo(currentIdx - 1)} disabled={currentIdx === 0}>← Previous</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPicks((prev) => { const n = { ...prev }; delete n[currentIdx]; return n })}
                    disabled={selected === undefined}
                  >
                    Clear pick
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  {!isLastQuestion ? (
                    <Button size="sm" onClick={() => goTo(currentIdx + 1)}>Next ➤</Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore ? 'Loading…' : '5 More'}
                      </Button>
                      <Button size="sm" onClick={submitSession} disabled={evaluating || answeredCount === 0}>
                        {evaluating ? 'Grading…' : 'Submit & Grade'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-1.5">
            {questions.map((_, i) => {
              const isCurrent = i === currentIdx
              const isAnswered = Number.isInteger(picks[i]) && picks[i] >= 0
              return (
                <Button
                  key={i}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => goTo(i)}
                  className={cn(
                    'min-w-9',
                    isCurrent && 'border-primary text-primary font-bold',
                    !isCurrent && isAnswered && 'border-emerald-500 text-emerald-500',
                  )}
                >
                  {isAnswered ? <AppIcon name="check" className="size-3" weight="bold" /> : null}Q{i + 1}
                </Button>
              )
            })}
          </div>
        </div>
      </ToolPage>
    )
  }

  if (phase === 'grading') {
    return (
      <ToolPage>
        <PageTitle
          title="Grading Session…"
          subtitle="Computing your score and asking the AI for a tailored study plan"
        />
        <Card>
          <CardContent className="py-16 text-center">
            <AppIcon name="brain" className="mx-auto mb-3 size-12 text-muted-foreground" />
            <div className="text-base font-bold text-muted-foreground">Analyzing patterns…</div>
            <div className="mt-1.5 text-[0.76rem] text-muted-foreground">Per-question correctness is instant. The AI summary takes ~5–10 s.</div>
          </CardContent>
        </Card>
      </ToolPage>
    )
  }

  if (phase === 'summary') {
    const total = sessionSummary?.total ?? questions.length
    const correct = sessionSummary?.score ?? evaluations.filter((e) => e.isCorrect).length
    const percent = sessionSummary?.percent ?? (total ? Math.round((correct / total) * 100) : 0)
    const summaryColor = percent >= 70 ? 'text-emerald-500' : percent >= 50 ? 'text-amber-500' : 'text-destructive'

    return (
      <ToolPage>
        <PageTitle
          title="Session Complete"
          subtitle={`Here's how you did in your ${role} mock interview`}
        />

        <Card>
          <CardContent className="space-y-4 pt-6 text-center">
            <div className={cn('text-4xl font-black tabular-nums', summaryColor)}>
              {correct}/{total}
            </div>
            <div className="text-sm text-muted-foreground">
              Score · {percent}% correct
              {sessionSummary?.verdict ? ` · ${sessionSummary.verdict}` : ''}
            </div>

            {sessionSummary?.summary && (
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-left">
                <div className="mb-1.5 flex items-center gap-1 text-[0.72rem] font-bold uppercase tracking-wide text-muted-foreground">
                  <AppIcon name="applications" className="size-3.5" />
                  Coaching Summary
                </div>
                <div className="text-[0.84rem] leading-relaxed text-foreground">{sessionSummary.summary}</div>

                {Array.isArray(sessionSummary.topStrengths) && sessionSummary.topStrengths.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1 text-[0.72rem] font-bold text-emerald-500">
                      <AppIcon name="check-circle" className="size-3.5" />
                      You handled well
                    </div>
                    <ul className="mt-1 list-disc pl-5 text-[0.78rem] text-muted-foreground">
                      {sessionSummary.topStrengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {Array.isArray(sessionSummary.topImprovements) && sessionSummary.topImprovements.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-[0.72rem] font-bold text-amber-500">
                      <AppIcon name="lightbulb" className="size-3.5" />
                      Focus areas
                    </div>
                    <ul className="mt-1 list-disc pl-5 text-[0.78rem] text-muted-foreground">
                      {sessionSummary.topImprovements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {Array.isArray(sessionSummary.studyTopics) && sessionSummary.studyTopics.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1 text-[0.72rem] font-bold text-primary">
                      <AppIcon name="interview" className="size-3.5" />
                      Study plan
                    </div>
                    <ul className="mt-1 list-disc pl-5 text-[0.78rem] text-muted-foreground">
                      {sessionSummary.studyTopics.map((t, i) => (
                        <li key={i}>
                          <strong className="text-foreground">{t.topic}</strong>
                          {t.priority ? <span className="text-muted-foreground"> · {t.priority} priority</span> : null}
                          {t.reason ? ` — ${t.reason}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    const topics = (sessionSummary.studyTopics || [])
                      .map((t) => t.topic)
                      .filter(Boolean)
                      .join('; ')
                    const q = new URLSearchParams({
                      topics: topics || (sessionSummary.topImprovements || []).join('; '),
                      seed: `Coach me on weak topics from my ${role} mock interview (${percent}%): ${topics || 'general improvements'}. Give a 1-week study plan.`,
                    })
                    navigate(`/dashboard/ai?${q.toString()}`)
                  }}
                >
                  <AppIcon name="robot" className="size-4" /> Coach me on weak topics
                </Button>
              </div>
            )}

            {questions.map((qq, i) => {
              const evalRow = evaluations[i]
              const userIdx = evalRow?.selectedIndex ?? -1
              const correctIdx = qq.correctIndex
              const isCorrect = evalRow?.isCorrect ?? false
              const borderColor = userIdx < 0 ? 'border-l-muted-foreground' : isCorrect ? 'border-l-emerald-500' : 'border-l-destructive'
              return (
                <div
                  key={i}
                  className={cn('rounded-xl border border-border bg-muted/30 p-3.5 text-left border-l-[3px]', borderColor)}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[0.72rem] font-bold text-muted-foreground">Q{i + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <QuestionBadge kind="type" value={qq.type} />
                      <span className={cn(
                        'text-[0.74rem] font-bold',
                        userIdx < 0 ? 'text-muted-foreground' : isCorrect ? 'text-emerald-500' : 'text-destructive',
                      )}>
                        {userIdx < 0 ? 'skipped' : isCorrect ? (
                          <span className="inline-flex items-center gap-0.5"><AppIcon name="check" className="size-3" weight="bold" /> correct</span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5"><AppIcon name="x" className="size-3" /> incorrect</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mb-1.5 text-[0.84rem] font-semibold leading-relaxed text-foreground">{qq.question}</div>

                  <div className="mt-2 flex flex-col gap-1">
                    {qq.options.map((opt, optIdx) => {
                      const isUserPick = optIdx === userIdx
                      const isAnswer = optIdx === correctIdx
                      return (
                        <div
                          key={optIdx}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[0.78rem]',
                            isAnswer && 'border-emerald-500/50 bg-emerald-500/10 font-semibold text-emerald-500',
                            isUserPick && !isCorrect && 'border-destructive/50 bg-destructive/10 font-semibold text-destructive',
                            !isAnswer && !(isUserPick && !isCorrect) && 'border-border text-muted-foreground',
                          )}
                        >
                          <span className="w-[18px] text-[0.74rem] font-bold">{LETTERS[optIdx]}</span>
                          <span className="flex-1">{opt}</span>
                          {isAnswer && <span className="inline-flex items-center gap-0.5 text-[0.7rem]"><AppIcon name="check" className="size-3" weight="bold" /> correct</span>}
                          {isUserPick && !isAnswer && <span className="text-[0.7rem]">your pick</span>}
                        </div>
                      )
                    })}
                  </div>

                  {qq.explanation && (
                    <div className="mt-2 rounded-lg bg-muted px-2.5 py-2 text-[0.76rem] leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Why:</strong> {qq.explanation}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button size="sm" onClick={() => { setPhase('setup'); resetState() }}>New Session</Button>
              <Button variant="ghost" size="sm" onClick={() => setPhase('setup')}>
                <AppIcon name="settings" className="size-4" /> Change Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </ToolPage>
    )
  }

  return null
}

export default function InterviewSection() {
  return (
    <UpgradeGate feature="AI Mock Interviews">
      <InterviewSectionContent />
    </UpgradeGate>
  )
}
