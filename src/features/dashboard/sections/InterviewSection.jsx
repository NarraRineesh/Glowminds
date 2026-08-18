import { useState, useCallback, useEffect, useMemo } from 'react'
import useAppStore from '@/store/authStore'
import useInterviewStore from '@/store/interviewStore'
import UpgradeGate from '@/components/UpgradeGate'
import { AiCreditsBadge } from '@/components/dashboard/PlanUsageSummary'
import {
  AppIcon,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  FormField,
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

export default function InterviewSection() {
  const { addToast } = useAppStore()
  const startStoredSession = useInterviewStore((s) => s.startSession)
  const saveStoredAnswer = useInterviewStore((s) => s.saveAnswer)
  const appendStoredQuestions = useInterviewStore((s) => s.appendQuestions)
  const completeStoredSession = useInterviewStore((s) => s.completeSession)
  const sessions = useInterviewStore((s) => s.sessions)
  const loadHistory = useInterviewStore((s) => s.loadHistory)

  useEffect(() => {
    loadHistory().catch(() => {})
  }, [loadHistory])

  const latestSession = sessions[0] || null

  const openSession = (session) => {
    if (!session) return
    const qs = Array.isArray(session.questions) ? session.questions : []
    setSessionId(session.id)
    setRole(session.role || '')
    setType(session.type || 'mixed')
    setQuestions(qs)
    const nextPicks = {}
    qs.forEach((q, idx) => {
      if (Number.isInteger(q.selectedIndex) && q.selectedIndex >= 0) nextPicks[idx] = q.selectedIndex
    })
    setPicks(nextPicks)
    if (session.status === 'completed') {
      setEvaluations(qs.map((q) => q.evaluation || { isCorrect: !!q.isCorrect, selectedIndex: q.selectedIndex ?? -1 }))
      setSessionSummary({
        total: qs.length,
        score: session.totalScore ?? qs.filter((q) => q.isCorrect).length,
        percent: qs.length ? Math.round(((session.totalScore ?? qs.filter((q) => q.isCorrect).length) / qs.length) * 100) : 0,
      })
      setPhase('summary')
    } else {
      setCurrentIdx(0)
      setPhase('practicing')
    }
  }

  const [phase, setPhase] = useState('setup')
  const [role, setRole] = useState('')
  const [type, setType] = useState('mixed')
  const [count, setCount] = useState(DEFAULT_COUNT)
  const [showTips, setShowTips] = useState(true)

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
    return (
      <UpgradeGate feature="Interview Prep" creditAction="interviewSession">
        <PageTitle
          title="Interview Prep"
          subtitle="AI-powered MCQ mock interviews — pick the best option, get instant scoring + study plan"
          className="mb-4"
        />
        <div className="mb-4">
          <AiCreditsBadge action="interviewSession" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start a Mock Interview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pick your role, question style, and how many MCQs you want. The AI grades your whole session at the end in a single batch call — you can load 5 more anytime mid-session.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Target Role">
              <Input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer, Product Manager"
              />
            </FormField>

            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Question Type</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cn(
                      'rounded-xl border p-3 text-left transition-colors',
                      type === t.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted hover:border-primary/40',
                    )}
                    onClick={() => setType(t.id)}
                  >
                    <AppIcon name={t.icon} className="size-6 text-primary" />
                    <div className="mt-1 text-sm font-bold text-foreground">{t.label}</div>
                    <div className="text-[0.72rem] text-muted-foreground">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <FormField label="Number of Questions" htmlFor="iv-count">
              <Select
                id="iv-count"
                className="max-w-[200px]"
                value={count}
                onChange={(e) => setCount(Number(e.target.value) || DEFAULT_COUNT)}
              >
                {COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} questions</option>
                ))}
              </Select>
            </FormField>

            <label className="flex cursor-pointer items-center gap-2 text-[0.78rem] text-muted-foreground">
              <Checkbox checked={showTips} onCheckedChange={(v) => setShowTips(!!v)} />
              Show hints with each question
            </label>

            <Button className="w-full" onClick={startSession} disabled={generating || !role.trim()}>
              {generating ? `Generating ${count} questions…` : `Start Mock Interview (${count} Qs)`}
            </Button>
          </CardContent>
        </Card>

        {latestSession && (
          <Card className="mt-4 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Continue where you left off</CardTitle>
              <p className="text-sm text-muted-foreground">
                {latestSession.role || 'Mock interview'}
                {latestSession.status === 'completed' ? ' · completed' : ' · in progress'}
                {Array.isArray(latestSession.questions) ? ` · ${latestSession.questions.length} questions` : ''}
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => openSession(latestSession)}>
                {latestSession.status === 'completed' ? 'Review session' : 'Resume session'}
              </Button>
              <Button size="sm" variant="outline" onClick={startSession} disabled={generating || !role.trim()}>
                Start new
              </Button>
            </CardContent>
          </Card>
        )}

        {sessions.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Recent sessions</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {sessions.slice(0, 5).map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50"
                  onClick={() => openSession(session)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{session.role || 'Interview'}</span>
                    <span className="block text-xs text-muted-foreground">
                      {session.status === 'completed' ? 'Completed' : 'In progress'}
                      {Number.isFinite(Number(session.totalScore)) ? ` · ${session.totalScore} correct` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-primary">
                    {session.status === 'completed' ? 'Review' : 'Resume'}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </UpgradeGate>
    )
  }

  if (phase === 'practicing' && q) {
    const selected = picks[currentIdx]
    return (
      <UpgradeGate feature="Interview Prep" creditAction="interviewSession">
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
      </UpgradeGate>
    )
  }

  if (phase === 'grading') {
    return (
      <UpgradeGate feature="Interview Prep" creditAction="interviewSession">
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
      </UpgradeGate>
    )
  }

  if (phase === 'summary') {
    const total = sessionSummary?.total ?? questions.length
    const correct = sessionSummary?.score ?? evaluations.filter((e) => e.isCorrect).length
    const percent = sessionSummary?.percent ?? (total ? Math.round((correct / total) * 100) : 0)
    const summaryColor = percent >= 70 ? 'text-emerald-500' : percent >= 50 ? 'text-amber-500' : 'text-destructive'

    return (
      <UpgradeGate feature="Interview Prep" creditAction="interviewSession">
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
      </UpgradeGate>
    )
  }

  return null
}
