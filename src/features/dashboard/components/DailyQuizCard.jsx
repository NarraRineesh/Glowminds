import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '@/store/authStore'
import useDailyQuizStore from '@/store/dailyQuizStore'
import { todayKey as quizTodayKey } from '@/utils/dateKeys'
import useGamificationStore from '@/store/gamificationStore'
import { getDailyQuestion } from '@/features/dashboard/data/quizQuestions'

const LEGACY_STORAGE_KEY = 'nx_daily_quiz_state'

/**
 * Reusable Daily Quiz card. Used both inside the DailyQuizSection and the
 * DailyQuizModal popup.
 *
 * The answer itself is NOT persisted; the only server-side effect is the
 * gamification update on the user doc. We treat
 * `gamification.dailyQuizLastAnsweredDate === today` as "answered today".
 */
export default function DailyQuizCard({ onComplete, compact = false }) {
  const { addToast } = useAppStore()
  const recordAnswer = useDailyQuizStore((s) => s.recordAnswer)
  const lastAnsweredQuestionId = useDailyQuizStore((s) => s.lastAnsweredQuestionId)
  const lastAnsweredCorrect = useDailyQuizStore((s) => s.lastAnsweredCorrect)
  const quizLastAnsweredDate = useGamificationStore((s) => s.gamification?.dailyQuizLastAnsweredDate)

  const question = getDailyQuestion()
  const today = quizTodayKey()

  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [revealCorrect, setRevealCorrect] = useState(false)

  useEffect(() => {
    if (quizLastAnsweredDate === today && !submitted) {
      setSubmitted(true)
      if (lastAnsweredQuestionId === question.id) {
        setRevealCorrect(!!lastAnsweredCorrect)
      }
    }
  }, [quizLastAnsweredDate, today, submitted, lastAnsweredQuestionId, question.id, lastAnsweredCorrect])

  // Best-effort cleanup of the legacy localStorage key.
  useEffect(() => {
    try { localStorage.removeItem(LEGACY_STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  const isCorrect = (submitted && selected !== null && selected === question.correct) || (submitted && revealCorrect)

  const handleSubmit = async () => {
    if (selected == null || submitted) return
    setSubmitted(true)
    const correct = selected === question.correct
    setRevealCorrect(correct)

    try {
      const result = await recordAnswer({ questionId: question.id, isCorrect: correct })
      if (result?.skipped && result.reason === 'already-answered-today') {
        addToast('info', '✅ You already played today — come back tomorrow!')
      } else if (correct) {
        addToast('success', `🎉 +${result?.xpDelta ?? question.xp} XP`)
      } else {
        addToast('info', '❌ Not quite — check the explanation')
      }
    } catch (err) {
      console.error('record daily quiz answer:', err)
    }
    onComplete?.(correct)
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
            {selected == null ? (
              <div className="mb-4 rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg2)] px-3.5 py-3 text-[0.82rem] leading-relaxed">
                <div className="mb-1 font-bold">✅ You already played today</div>
                <div className="text-[var(--color-txt2)]">Come back tomorrow for a fresh question and more XP.</div>
              </div>
            ) : (
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
            )}
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
