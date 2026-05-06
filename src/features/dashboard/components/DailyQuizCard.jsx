import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '@/store/authStore'
import { getDailyQuestion, getTodayKey } from '@/features/dashboard/data/quizQuestions'

const STORAGE_KEY = 'nx_daily_quiz_state'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* swallow */
  }
}

/**
 * Reusable Daily Quiz card. Used both inside the DailyQuizSection and the
 * DailyQuizModal popup. Persists today's answer locally so it survives
 * navigation and reload.
 */
export default function DailyQuizCard({ onComplete, compact = false }) {
  const { addToast } = useAppStore()
  const question = getDailyQuestion()
  const todayKey = getTodayKey()

  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const state = loadState()
    if (state?.date === todayKey && state?.questionId === question.id) {
      setSelected(state.selected)
      setSubmitted(true)
    }
  }, [todayKey, question.id])

  const isCorrect = submitted && selected === question.correct

  const handleSubmit = () => {
    if (selected == null || submitted) return
    setSubmitted(true)
    saveState({ date: todayKey, questionId: question.id, selected })
    if (selected === question.correct) {
      addToast('success', `🎉 +${question.xp} XP — nice work!`)
    } else {
      addToast('info', '❌ Not quite — check the explanation')
    }
    onComplete?.(selected === question.correct)
  }

  return (
    <div className="relative overflow-hidden">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[var(--color-bdr)] bg-[var(--color-blu3)] px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[var(--color-blu2)]">
          {question.category}
        </span>
        <span className="rounded-full border border-[var(--color-bdr)] bg-[var(--color-gold2)] px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[var(--color-gold)]">
          +{question.xp} XP
        </span>
        <span className="ml-auto text-[0.62rem] font-mono text-[var(--color-muted)]">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <h3
        className={`mb-4 font-extrabold leading-snug tracking-tight text-[var(--color-txt)] ${
          compact ? 'text-[1rem]' : 'text-[clamp(1.05rem,2vw,1.25rem)]'
        }`}
      >
        {question.question}
      </h3>

      <div className="mb-4 flex flex-col gap-2">
        {question.options.map((opt, i) => {
          const isPicked = selected === i
          const isAnswer = i === question.correct
          let stateClass = 'border-[var(--color-bdr)] bg-[var(--color-bg3)] hover:border-[var(--color-bdr2)]'
          if (submitted) {
            if (isAnswer) {
              stateClass =
                'border-[var(--color-grn)] bg-[var(--color-grn2)] text-[var(--color-grn)]'
            } else if (isPicked) {
              stateClass = 'border-[var(--color-red)] bg-[var(--color-red2)] text-[var(--color-red)]'
            } else {
              stateClass = 'border-[var(--color-bdr)] bg-[var(--color-bg3)] opacity-70'
            }
          } else if (isPicked) {
            stateClass = 'border-[var(--color-blu)] bg-[var(--color-blu3)] text-[var(--color-blu2)]'
          }

          return (
            <button
              key={opt}
              type="button"
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[0.86rem] font-medium transition-all duration-200 ${stateClass} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-bold ${
                  submitted && isAnswer
                    ? 'border-[var(--color-grn)] text-[var(--color-grn)]'
                    : submitted && isPicked
                      ? 'border-[var(--color-red)] text-[var(--color-red)]'
                      : isPicked
                        ? 'border-[var(--color-blu)] text-[var(--color-blu2)]'
                        : 'border-[var(--color-bdr)] text-[var(--color-muted)]'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0 flex-1">{opt}</span>
              {submitted && isAnswer && <span aria-hidden>✅</span>}
              {submitted && !isAnswer && isPicked && <span aria-hidden>❌</span>}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className={`mb-4 rounded-xl border px-3.5 py-3 text-[0.82rem] leading-relaxed ${
                isCorrect
                  ? 'border-[var(--color-grn)]/40 bg-[var(--color-grn2)] text-[var(--color-txt)]'
                  : 'border-[var(--color-gold)]/40 bg-[var(--color-gold2)] text-[var(--color-txt)]'
              }`}
            >
              <div className="mb-1 font-bold">
                {isCorrect ? '🎯 Correct!' : '💡 Heads up'}
              </div>
              <div className="text-[var(--color-txt2)]">{question.explanation}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-end gap-2">
        {!submitted ? (
          <button
            type="button"
            disabled={selected == null}
            onClick={handleSubmit}
            className="btn btn-p btn-sm disabled:opacity-50"
          >
            Submit Answer
          </button>
        ) : (
          <span className="text-[0.74rem] text-[var(--color-muted)]">
            Come back tomorrow for the next question 🔁
          </span>
        )}
      </div>
    </div>
  )
}

export { STORAGE_KEY as DAILY_QUIZ_STORAGE_KEY }
