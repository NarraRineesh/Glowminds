import { useState, useCallback } from 'react'
import useAppStore from '@/store/authStore'
import UpgradeGate from '@/components/UpgradeGate'
import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '@/services/firebase'
import '@/styles/dashboard.css'
import '@/styles/forms.css'
import '@/styles/interview.css'

const functions = getFunctions(app)
const generateQuestionsFn = httpsCallable(functions, 'generateInterviewQuestions')
const evaluateAnswerFn = httpsCallable(functions, 'evaluateAnswer')

const TYPES = [
  { id: 'mixed', icon: '🎯', label: 'Mixed', desc: 'All question types' },
  { id: 'technical', icon: '💻', label: 'Technical', desc: 'Coding & concepts' },
  { id: 'behavioral', icon: '🧠', label: 'Behavioral', desc: 'STAR method Q&A' },
  { id: 'hr', icon: '🤝', label: 'HR Round', desc: 'Culture & soft skills' },
]

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'DevOps Engineer', 'Product Manager',
  'UI/UX Designer', 'Mobile Developer', 'QA Engineer', 'ML Engineer',
]

export default function InterviewSection() {
  const { addToast } = useAppStore()

  // Setup state
  const [phase, setPhase] = useState('setup') // setup | practicing | feedback | summary
  const [role, setRole] = useState('Software Engineer')
  const [type, setType] = useState('mixed')
  const [showTips, setShowTips] = useState(true)

  // Practice state
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [results, setResults] = useState([]) // { question, answer, evaluation }[]

  // Loading states
  const [generating, setGenerating] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const startSession = useCallback(async () => {
    setGenerating(true)
    try {
      const { data } = await generateQuestionsFn({ role, type, count: 10 })
      if (!data.questions?.length) throw new Error('No questions generated')
      setQuestions(data.questions)
      setCurrentIdx(0)
      setAnswer('')
      setResults([])
      setEvaluation(null)
      setPhase('practicing')
      addToast('success', `🎯 ${data.questions.length} questions ready! Good luck.`)
    } catch (err) {
      console.error('Generate questions error:', err)
      addToast('error', `⚠️ ${err.message || 'Failed to generate questions'}`)
    }
    setGenerating(false)
  }, [role, type, addToast])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const { data } = await generateQuestionsFn({ role, type, count: 10 })
      if (data.questions?.length) {
        setQuestions(prev => [...prev, ...data.questions])
        setCurrentIdx(prev => prev + 1)
        setAnswer('')
        setEvaluation(null)
        setPhase('practicing')
        addToast('success', `🎯 ${data.questions.length} more questions loaded!`)
      }
    } catch (err) {
      console.error('Load more error:', err)
      addToast('error', `⚠️ ${err.message || 'Failed to load more questions'}`)
    }
    setLoadingMore(false)
  }, [role, type, addToast])

  const submitAnswer = useCallback(async () => {
    if (!answer.trim() || answer.trim().length < 10) {
      addToast('error', '✍️ Please write a more detailed answer (at least a few sentences)')
      return
    }

    const q = questions[currentIdx]
    setEvaluating(true)
    setPhase('feedback')

    try {
      const { data } = await evaluateAnswerFn({
        question: q.question,
        answer: answer.trim(),
        questionType: q.type,
        role,
      })
      setEvaluation(data)
      setResults(prev => [...prev, { question: q, answer: answer.trim(), evaluation: data }])
    } catch (err) {
      console.error('Evaluate error:', err)
      addToast('error', `⚠️ ${err.message || 'Failed to evaluate answer'}`)
      setPhase('practicing')
    }
    setEvaluating(false)
  }, [answer, questions, currentIdx, role, addToast])

  const nextQuestion = () => {
    setCurrentIdx(prev => prev + 1)
    setAnswer('')
    setEvaluation(null)
    setPhase('practicing')
  }

  const endSession = () => {
    setPhase('summary')
  }

  const isLastQuestion = currentIdx + 1 >= questions.length

  const resetSession = () => {
    setPhase('setup')
    setQuestions([])
    setCurrentIdx(0)
    setAnswer('')
    setResults([])
    setEvaluation(null)
  }

  const q = questions[currentIdx]
  const progress = questions.length ? ((currentIdx + (phase === 'feedback' || phase === 'summary' ? 1 : 0)) / questions.length) * 100 : 0
  const avgScore = results.length ? (results.reduce((sum, r) => sum + (r.evaluation?.score || 0), 0) / results.length).toFixed(1) : 0

  const scoreClass = (s) => s >= 7 ? 'good' : s >= 4 ? 'avg' : 'poor'

  // ── SETUP PHASE ──
  if (phase === 'setup') {
    return (
      <UpgradeGate feature="Interview Prep">
        <div className="dsh-title">Interview Prep 🎤</div>
        <div className="dsh-sub">AI-powered mock interviews with instant feedback</div>

        <div className="iv-setup">
          <div className="iv-setup-title">Start a Mock Interview</div>
          <div className="iv-setup-sub">Choose your role, question type, and let AI be your interviewer</div>

          <div className="fg" style={{ marginBottom: 14 }}>
            <label className="fl">Target Role</label>
            <select className="fsl" value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <label className="fl" style={{ marginBottom: 6, display: 'block' }}>Question Type</label>
          <div className="iv-types">
            {TYPES.map(t => (
              <div key={t.id} className={`iv-type${type === t.id ? ' on' : ''}`} onClick={() => setType(t.id)}>
                <div className="iv-type-ic">{t.icon}</div>
                <div className="iv-type-lbl">{t.label}</div>
                <div className="iv-type-desc">{t.desc}</div>
              </div>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.78rem', color: 'var(--color-txt2)', cursor: 'pointer', marginBottom: 18 }}>
            <input type="checkbox" checked={showTips} onChange={e => setShowTips(e.target.checked)} style={{ accentColor: 'var(--color-blu)' }} />
            Show hints for each question
          </label>

          <button className="btn btn-p btn-w" onClick={startSession} disabled={generating}>
            {generating ? '⏳ Generating questions…' : '🚀 Start Mock Interview'}
          </button>
        </div>
      </UpgradeGate>
    )
  }

  // ── PRACTICING PHASE ──
  if (phase === 'practicing' && q) {
    return (
      <UpgradeGate feature="Interview Prep">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <div>
            <div className="dsh-title">Mock Interview 🎤</div>
            <div className="dsh-sub" style={{ marginBottom: 0 }}>{role} — {type === 'mixed' ? 'Mixed' : type} questions</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {results.length > 0 && <button className="btn btn-p btn-sm" onClick={endSession}>📊 View Summary</button>}
            <button className="btn btn-gh btn-sm" onClick={resetSession}>✕ End</button>
          </div>
        </div>

        <div className="iv-flow">
          <div className="iv-progress">
            <span>Q{currentIdx + 1}/{questions.length}</span>
            <div className="iv-progress-bar">
              <div className="iv-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{Math.round(progress)}%</span>
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
              <div className="iv-q-tips">💡 <strong>Tip:</strong> {q.tips}</div>
            )}

            <textarea
              className="iv-answer"
              placeholder="Type your answer here… Be detailed and specific. Use the STAR method for behavioral questions."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />

            <div className="iv-btns" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-gh btn-sm" onClick={() => setAnswer('')} disabled={!answer}>Clear</button>
              <button className="btn btn-p btn-sm" onClick={submitAnswer} disabled={evaluating || !answer.trim()}>
                {evaluating ? '⏳ Evaluating…' : '📝 Submit Answer'}
              </button>
            </div>
          </div>
        </div>
      </UpgradeGate>
    )
  }

  // ── FEEDBACK PHASE ──
  if (phase === 'feedback') {
    return (
      <UpgradeGate feature="Interview Prep">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <div>
            <div className="dsh-title">AI Feedback 📊</div>
            <div className="dsh-sub" style={{ marginBottom: 0 }}>Question {currentIdx + 1} of {questions.length}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {results.length > 0 && <button className="btn btn-p btn-sm" onClick={endSession}>📊 View Summary</button>}
            <button className="btn btn-gh btn-sm" onClick={resetSession}>✕ End</button>
          </div>
        </div>

        <div className="iv-flow">
          <div className="iv-progress">
            <span>Q{currentIdx + 1}/{questions.length}</span>
            <div className="iv-progress-bar">
              <div className="iv-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{Math.round(progress)}%</span>
          </div>

          {evaluating ? (
            <div className="iv-qcard" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>🤔</div>
              <div style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--color-txt2)' }}>Analyzing your answer…</div>
              <div style={{ fontSize: '.74rem', color: 'var(--color-muted)', marginTop: 4 }}>AI is evaluating your response using expert criteria</div>
            </div>
          ) : evaluation && (
            <div className="iv-feedback">
              <div className={`iv-score-ring ${scoreClass(evaluation.score)}`}>
                {evaluation.score}/10
              </div>
              <div className="iv-fb-text">{evaluation.feedback}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="iv-fb-section">
                  <div className="iv-fb-label">✅ Strengths</div>
                  <ul className="iv-fb-list strengths">
                    {evaluation.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="iv-fb-section">
                  <div className="iv-fb-label">💡 Improvements</div>
                  <ul className="iv-fb-list improvements">
                    {evaluation.improvements?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>

              {evaluation.starBreakdown && (
                <div className="iv-fb-section">
                  <div className="iv-fb-label">⭐ STAR Breakdown</div>
                  <div className="iv-star">
                    <div className="iv-star-item">
                      <div className="iv-star-lbl s">S — Situation</div>
                      <div className="iv-star-val">{evaluation.starBreakdown.situation}</div>
                    </div>
                    <div className="iv-star-item">
                      <div className="iv-star-lbl t">T — Task</div>
                      <div className="iv-star-val">{evaluation.starBreakdown.task}</div>
                    </div>
                    <div className="iv-star-item">
                      <div className="iv-star-lbl a">A — Action</div>
                      <div className="iv-star-val">{evaluation.starBreakdown.action}</div>
                    </div>
                    <div className="iv-star-item">
                      <div className="iv-star-lbl r">R — Result</div>
                      <div className="iv-star-val">{evaluation.starBreakdown.result}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="iv-fb-section">
                <div className="iv-fb-label">🎯 Sample Answer</div>
                <div className="iv-sample">{evaluation.sampleAnswer}</div>
              </div>

              <div className="iv-btns">
                {!isLastQuestion && (
                  <button className="btn btn-p btn-sm" onClick={nextQuestion}>➤ Next Question</button>
                )}
                {isLastQuestion && (
                  <button className="btn btn-o btn-sm" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? '⏳ Loading…' : '📥 Load 10 More Questions'}
                  </button>
                )}
                {results.length > 0 && (
                  <button className="btn btn-gh btn-sm" onClick={endSession}>📊 End & View Summary</button>
                )}
              </div>
            </div>
          )}
        </div>
      </UpgradeGate>
    )
  }

  // ── SUMMARY PHASE ──
  if (phase === 'summary') {
    return (
      <UpgradeGate feature="Interview Prep">
        <div className="dsh-title">Session Complete 🎉</div>
        <div className="dsh-sub">Here's how you did in your {role} mock interview</div>

        <div className="iv-summary">
          <div className={`iv-summary-score`} style={{ color: avgScore >= 7 ? 'var(--color-grn)' : avgScore >= 4 ? 'var(--color-gold)' : 'var(--color-red)' }}>
            {avgScore}/10
          </div>
          <div className="iv-summary-label">Average Score across {results.length} questions</div>

          {results.map((r, i) => (
            <div key={i} style={{ textAlign: 'left', background: 'var(--color-bg2)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-muted)' }}>Q{i + 1}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`iv-badge ${r.question.type}`}>{r.question.type}</span>
                  <span style={{ fontSize: '.82rem', fontWeight: 800, fontFamily: "'JetBrains Mono',monospace",
                    color: r.evaluation?.score >= 7 ? 'var(--color-grn)' : r.evaluation?.score >= 4 ? 'var(--color-gold)' : 'var(--color-red)' }}>
                    {r.evaluation?.score}/10
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '.8rem', fontWeight: 600, lineHeight: 1.5 }}>{r.question.question}</div>
              {r.evaluation?.feedback && (
                <div style={{ fontSize: '.72rem', color: 'var(--color-muted)', marginTop: 4, lineHeight: 1.5 }}>{r.evaluation.feedback}</div>
              )}
            </div>
          ))}

          <div className="iv-btns" style={{ marginTop: 20 }}>
            <button className="btn btn-p btn-sm" onClick={resetSession}>🔄 New Session</button>
            <button className="btn btn-gh btn-sm" onClick={() => { setPhase('setup') }}>⚙️ Change Settings</button>
          </div>
        </div>
      </UpgradeGate>
    )
  }

  return null
}
