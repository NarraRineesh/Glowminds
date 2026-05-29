import { useState, useCallback, useMemo } from 'react'
import useAppStore from '@/store/authStore'
import useInterviewStore from '@/store/interviewStore'
import UpgradeGate from '@/components/UpgradeGate'
import { apiFetch } from '@/services/apiClient'
import '@/styles/dashboard.css'
import '@/styles/forms.css'
import '@/styles/interview.css'

const TYPES = [
  { id: 'mixed', icon: '🎯', label: 'Mixed', desc: 'All question types' },
  { id: 'technical', icon: '💻', label: 'Technical', desc: 'Coding & concepts' },
  { id: 'behavioral', icon: '🧠', label: 'Behavioral', desc: 'STAR scenarios' },
  { id: 'hr', icon: '🤝', label: 'HR Round', desc: 'Culture & soft skills' },
]

const COUNT_OPTIONS = [5, 10, 20, 50]
const DEFAULT_COUNT = 10

const LETTERS = ['A', 'B', 'C', 'D']

export default function InterviewSection() {
  const { addToast } = useAppStore()
  const startStoredSession = useInterviewStore((s) => s.startSession)
  const saveStoredAnswer = useInterviewStore((s) => s.saveAnswer)
  const appendStoredQuestions = useInterviewStore((s) => s.appendQuestions)
  const completeStoredSession = useInterviewStore((s) => s.completeSession)

  // setup | practicing | grading | summary
  const [phase, setPhase] = useState('setup')
  const [role, setRole] = useState('')
  const [type, setType] = useState('mixed')
  const [count, setCount] = useState(DEFAULT_COUNT)
  const [showTips, setShowTips] = useState(true)

  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  // { [questionIndex]: number } — option index the user picked
  const [picks, setPicks] = useState({})
  const [currentIdx, setCurrentIdx] = useState(0)

  const [generating, setGenerating] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [evaluations, setEvaluations] = useState([]) // [{ index, isCorrect, selectedIndex, correctIndex }]
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
      addToast('success', `🎯 ${fetched.length} MCQs ready. Pick an option for each, then submit.`)
    } catch (err) {
      console.error('Generate questions error:', err)
      addToast('error', `⚠️ ${err.message || 'Failed to generate questions'}`)
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
        addToast('success', `🎯 ${more.length} more MCQs added!`)
      }
    } catch (err) {
      console.error('Load more error:', err)
      addToast('error', `⚠️ ${err.message || 'Failed to load more questions'}`)
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
      addToast('error', '✍️ Pick at least one option before submitting')
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

      // Persist per-question picks back to the Firestore session doc.
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
      addToast('success', '📊 Session graded! Scroll for per-question review.')
    } catch (err) {
      console.error('Evaluate session error:', err)
      addToast('error', `⚠️ ${err.message || 'Failed to grade session'}`)
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

  // ── SETUP PHASE ──
  if (phase === 'setup') {
    return (
      <UpgradeGate feature="Interview Prep">
        <div className="dsh-title">Interview Prep 🎤</div>
        <div className="dsh-sub">AI-powered MCQ mock interviews — pick the best option, get instant scoring + study plan</div>

        <div className="iv-setup">
          <div className="iv-setup-title">Start a Mock Interview</div>
          <div className="iv-setup-sub">Pick your role, question style, and how many MCQs you want. The AI grades your whole session at the end in a single batch call — you can load 5 more anytime mid-session.</div>

          <div className="fg" style={{ marginBottom: 14 }}>
            <label className="fl">Target Role</label>
            <input
              type="text"
              className="fi"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer, Product Manager"
            />
          </div>

          <label className="fl" style={{ marginBottom: 6, display: 'block' }}>Question Type</label>
          <div className="iv-types">
            {TYPES.map((t) => (
              <div key={t.id} className={`iv-type${type === t.id ? ' on' : ''}`} onClick={() => setType(t.id)}>
                <div className="iv-type-ic">{t.icon}</div>
                <div className="iv-type-lbl">{t.label}</div>
                <div className="iv-type-desc">{t.desc}</div>
              </div>
            ))}
          </div>

          <div className="fg" style={{ marginTop: 14, marginBottom: 14 }}>
            <label className="fl" htmlFor="iv-count">Number of Questions</label>
            <select
              id="iv-count"
              className="fsl"
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || DEFAULT_COUNT)}
              style={{ maxWidth: 200 }}
            >
              {COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} questions</option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.78rem', color: 'var(--color-txt2)', cursor: 'pointer', marginBottom: 18 }}>
            <input type="checkbox" checked={showTips} onChange={(e) => setShowTips(e.target.checked)} style={{ accentColor: 'var(--color-blu)' }} />
            Show hints with each question
          </label>

          <button className="btn btn-p btn-w" onClick={startSession} disabled={generating || !role.trim()}>
            {generating ? `⏳ Generating ${count} questions…` : `🚀 Start Mock Interview (${count} Qs)`}
          </button>
        </div>
      </UpgradeGate>
    )
  }

  // ── PRACTICING PHASE ──
  if (phase === 'practicing' && q) {
    const selected = picks[currentIdx]
    return (
      <UpgradeGate feature="Interview Prep">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <div>
            <div className="dsh-title">Mock Interview 🎤</div>
            <div className="dsh-sub" style={{ marginBottom: 0 }}>{role} — {type === 'mixed' ? 'Mixed' : type} MCQs</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-p btn-sm" onClick={submitSession} disabled={evaluating || answeredCount === 0}>
              {evaluating ? '⏳ Grading…' : '📊 Submit & Grade'}
            </button>
            <button className="btn btn-gh btn-sm" onClick={exitSession}>✕ End</button>
          </div>
        </div>

        <div className="iv-flow">
          <div className="iv-progress">
            <span>Q{currentIdx + 1}/{questions.length}</span>
            <div className="iv-progress-bar">
              <div className="iv-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{answeredCount}/{questions.length} answered</span>
          </div>

          <div className="iv-qcard">
            <div className="iv-q-header">
              <div className="iv-q-num">Question {currentIdx + 1}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className={`iv-badge ${q.type}`}>{q.type}</span>
                <span className={`iv-badge ${q.difficulty}`}>{q.difficulty}</span>
              </div>
            </div>

            <div className="iv-q-text">{q.question}</div>

            {showTips && q.tips && (
              <div className="iv-q-tips">💡 <strong>Approach:</strong> {q.tips}</div>
            )}

            {showTips && Array.isArray(q.hints) && q.hints.length > 0 && (
              <div className="iv-q-tips" style={{ marginTop: 6 }}>
                <strong>✨ Hints:</strong>
                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                  {q.hints.slice(0, 4).map((h, i) => (
                    <li key={i} style={{ fontSize: '.78rem', lineHeight: 1.5 }}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {q.options.map((opt, optIdx) => {
                const isSelected = selected === optIdx
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => pickOption(currentIdx, optIdx)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      transition: 'all .15s',
                      border: `1.5px solid ${isSelected ? 'var(--color-blu)' : 'var(--color-bdr)'}`,
                      background: isSelected ? 'rgba(56,139,253,.10)' : 'var(--color-bg3)',
                      color: 'var(--color-txt)',
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '.78rem',
                        fontWeight: 700,
                        background: isSelected ? 'var(--color-blu)' : 'var(--color-surf)',
                        color: isSelected ? '#fff' : 'var(--color-txt2)',
                        border: `1px solid ${isSelected ? 'var(--color-blu)' : 'var(--color-bdr)'}`,
                      }}
                    >
                      {LETTERS[optIdx]}
                    </span>
                    <span style={{ fontSize: '.86rem', lineHeight: 1.5, fontWeight: isSelected ? 600 : 500 }}>
                      {opt}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="iv-btns" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-gh btn-sm" onClick={() => goTo(currentIdx - 1)} disabled={currentIdx === 0}>← Previous</button>
                <button
                  className="btn btn-gh btn-sm"
                  onClick={() => setPicks((prev) => { const n = { ...prev }; delete n[currentIdx]; return n })}
                  disabled={selected === undefined}
                >
                  Clear pick
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!isLastQuestion ? (
                  <button className="btn btn-p btn-sm" onClick={() => goTo(currentIdx + 1)}>Next ➤</button>
                ) : (
                  <>
                    <button className="btn btn-o btn-sm" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? '⏳ Loading…' : '📥 5 More'}
                    </button>
                    <button className="btn btn-p btn-sm" onClick={submitSession} disabled={evaluating || answeredCount === 0}>
                      {evaluating ? '⏳ Grading…' : '📊 Submit & Grade'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Question pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {questions.map((_, i) => {
              const isCurrent = i === currentIdx
              const isAnswered = Number.isInteger(picks[i]) && picks[i] >= 0
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className="btn btn-gh btn-xs"
                  style={{
                    minWidth: 36,
                    borderColor: isCurrent ? 'var(--color-blu)' : isAnswered ? 'var(--color-grn)' : 'var(--color-bdr)',
                    color: isCurrent ? 'var(--color-blu)' : isAnswered ? 'var(--color-grn)' : undefined,
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {isAnswered ? '✓ ' : ''}Q{i + 1}
                </button>
              )
            })}
          </div>
        </div>
      </UpgradeGate>
    )
  }

  // ── GRADING PHASE ──
  if (phase === 'grading') {
    return (
      <UpgradeGate feature="Interview Prep">
        <div className="dsh-title">Grading Session… 📊</div>
        <div className="dsh-sub">Computing your score and asking the AI for a tailored study plan</div>
        <div className="iv-qcard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤔</div>
          <div style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--color-txt2)' }}>Analyzing patterns…</div>
          <div style={{ fontSize: '.76rem', color: 'var(--color-muted)', marginTop: 6 }}>Per-question correctness is instant. The AI summary takes ~5–10 s.</div>
        </div>
      </UpgradeGate>
    )
  }

  // ── SUMMARY PHASE ──
  if (phase === 'summary') {
    const total = sessionSummary?.total ?? questions.length
    const correct = sessionSummary?.score ?? evaluations.filter((e) => e.isCorrect).length
    const percent = sessionSummary?.percent ?? (total ? Math.round((correct / total) * 100) : 0)
    const summaryColor = percent >= 70 ? 'var(--color-grn)' : percent >= 50 ? 'var(--color-gold)' : 'var(--color-red)'

    return (
      <UpgradeGate feature="Interview Prep">
        <div className="dsh-title">Session Complete 🎉</div>
        <div className="dsh-sub">Here's how you did in your {role} mock interview</div>

        <div className="iv-summary">
          <div className="iv-summary-score" style={{ color: summaryColor }}>
            {correct}/{total}
          </div>
          <div className="iv-summary-label">
            Score · {percent}% correct
            {sessionSummary?.verdict ? ` · ${sessionSummary.verdict}` : ''}
          </div>

          {sessionSummary?.summary && (
            <div style={{ background: 'var(--color-bg2)', borderRadius: 10, padding: '14px 16px', margin: '16px 0', textAlign: 'left' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6 }}>📋 Coaching Summary</div>
              <div style={{ fontSize: '.84rem', lineHeight: 1.6 }}>{sessionSummary.summary}</div>

              {Array.isArray(sessionSummary.topStrengths) && sessionSummary.topStrengths.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-grn)' }}>✅ You handled well</div>
                  <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '.78rem' }}>
                    {sessionSummary.topStrengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(sessionSummary.topImprovements) && sessionSummary.topImprovements.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-gold)' }}>💡 Focus areas</div>
                  <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '.78rem' }}>
                    {sessionSummary.topImprovements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(sessionSummary.studyTopics) && sessionSummary.studyTopics.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-blu2)' }}>📚 Study plan</div>
                  <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '.78rem' }}>
                    {sessionSummary.studyTopics.map((t, i) => (
                      <li key={i}>
                        <strong>{t.topic}</strong>
                        {t.priority ? <span style={{ color: 'var(--color-muted)', fontSize: '.7rem' }}> · {t.priority} priority</span> : null}
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
            return (
              <div
                key={i}
                style={{
                  textAlign: 'left',
                  background: 'var(--color-bg2)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 10,
                  borderLeft: `3px solid ${userIdx < 0 ? 'var(--color-muted)' : isCorrect ? 'var(--color-grn)' : 'var(--color-red)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-muted)' }}>Q{i + 1}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`iv-badge ${qq.type}`}>{qq.type}</span>
                    <span style={{ fontSize: '.74rem', fontWeight: 700, color: userIdx < 0 ? 'var(--color-muted)' : isCorrect ? 'var(--color-grn)' : 'var(--color-red)' }}>
                      {userIdx < 0 ? 'skipped' : isCorrect ? '✓ correct' : '✕ incorrect'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '.84rem', fontWeight: 600, lineHeight: 1.5, marginBottom: 6 }}>{qq.question}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  {qq.options.map((opt, optIdx) => {
                    const isUserPick = optIdx === userIdx
                    const isAnswer = optIdx === correctIdx
                    let bg = 'transparent'
                    let border = 'var(--color-bdr)'
                    let color = 'var(--color-txt2)'
                    if (isAnswer) { bg = 'rgba(46,160,67,.10)'; border = 'var(--color-grn)'; color = 'var(--color-grn)' }
                    else if (isUserPick && !isCorrect) { bg = 'rgba(248,81,73,.10)'; border = 'var(--color-red)'; color = 'var(--color-red)' }
                    return (
                      <div
                        key={optIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: bg,
                          border: `1px solid ${border}`,
                          fontSize: '.78rem',
                          color,
                          fontWeight: isAnswer || isUserPick ? 600 : 500,
                        }}
                      >
                        <span style={{ width: 18, fontWeight: 700, fontSize: '.74rem' }}>{LETTERS[optIdx]}</span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {isAnswer && <span style={{ fontSize: '.7rem' }}>✓ correct</span>}
                        {isUserPick && !isAnswer && <span style={{ fontSize: '.7rem' }}>your pick</span>}
                      </div>
                    )
                  })}
                </div>

                {qq.explanation && (
                  <div style={{ fontSize: '.76rem', color: 'var(--color-txt2)', marginTop: 8, lineHeight: 1.55, background: 'var(--color-bg3)', borderRadius: 8, padding: '8px 10px' }}>
                    <strong>Why:</strong> {qq.explanation}
                  </div>
                )}
              </div>
            )
          })}

          <div className="iv-btns" style={{ marginTop: 20 }}>
            <button className="btn btn-p btn-sm" onClick={() => { setPhase('setup'); resetState() }}>🔄 New Session</button>
            <button className="btn btn-gh btn-sm" onClick={() => setPhase('setup')}>⚙️ Change Settings</button>
          </div>
        </div>
      </UpgradeGate>
    )
  }

  return null
}
