import { useState, useEffect } from 'react'
import { AppIcon, Badge, Button, cn } from '@/components/ui'
import useAppStore from '@/store/authStore'
import useDailyQuizStore from '@/store/dailyQuizStore'
import { todayKey as quizTodayKey } from '@/utils/dateKeys'
import useGamificationStore from '@/store/gamificationStore'
import { getDailyQuestion } from '@/features/dashboard/data/quizQuestions'

const LEGACY_STORAGE_KEY = 'nx_daily_quiz_state'

function optionClass(i, isPicked, submitted, correctIndex) {
  const isAnswer = i === correctIndex
  if (submitted) {
    if (isAnswer) return 'border-emerald-500/40 bg-emerald-500/10'
    if (isPicked) return 'border-destructive/40 bg-destructive/10'
    return 'border-border bg-muted/50 opacity-70'
  }
  if (isPicked) return 'border-primary/40 bg-primary/10'
  return 'border-border bg-muted/50 hover:border-primary/20'
}

function letterClass(i, isPicked, submitted, correctIndex) {
  const isAnswer = i === correctIndex
  if (submitted && isAnswer) return 'border-emerald-500 text-emerald-500'
  if (submitted && isPicked) return 'border-destructive text-destructive'
  if (isPicked) return 'border-primary text-primary'
  return 'border-border text-muted-foreground'
}

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

  useEffect(() => {
    try { localStorage.removeItem(LEGACY_STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  const isCorrect = (submitted && selected !== null && selected === question.correct)
    || (submitted && revealCorrect)

  const handleSubmit = async () => {
    if (selected == null || submitted) return
    setSubmitted(true)
    const correct = selected === question.correct
    setRevealCorrect(correct)

    try {
      const result = await recordAnswer({ questionId: question.id, isCorrect: correct })
      if (result?.skipped && result.reason === 'already-answered-today') {
        addToast('info', 'You already played today — come back tomorrow!')
      } else if (correct) {
        addToast('success', `+${result?.xpDelta ?? question.xp} XP`)
      } else {
        addToast('info', 'Not quite — check the explanation')
      }
    } catch (err) {
      console.error('record daily quiz answer:', err)
    }
    onComplete?.(correct)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
          {question.category}
        </Badge>
        <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-500">
          +{question.xp} XP
        </Badge>
        <span className="ms-auto text-xs tabular-nums text-muted-foreground">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <h3 className={cn('font-semibold leading-snug text-foreground', compact ? 'text-sm' : 'text-base sm:text-lg')}>
        {question.question}
      </h3>

      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const isPicked = selected === i
          return (
            <button
              key={opt}
              type="button"
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors',
                optionClass(i, isPicked, submitted, question.correct),
                submitted ? 'cursor-default' : 'cursor-pointer',
              )}
            >
              <span className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                letterClass(i, isPicked, submitted, question.correct),
              )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0 flex-1">{opt}</span>
              {submitted && i === question.correct && (
                <AppIcon name="check-circle" className="size-4 shrink-0 text-emerald-500" />
              )}
              {submitted && i !== question.correct && isPicked && (
                <AppIcon name="x-circle" className="size-4 shrink-0 text-destructive" />
              )}
            </button>
          )
        })}
      </div>

      {submitted && (
        selected == null ? (
          <div className="rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <AppIcon name="check-circle" className="size-4 text-emerald-500" />
              You already played today
            </div>
            <p className="text-muted-foreground">Come back tomorrow for a fresh question and more XP.</p>
          </div>
        ) : (
          <div className={cn(
            'rounded-xl border px-3 py-3 text-sm',
            isCorrect ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/10',
          )}
          >
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <AppIcon name={isCorrect ? 'target' : 'lightbulb'} className="size-4" />
              {isCorrect ? 'Correct!' : 'Heads up'}
            </div>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )
      )}

      <div className="flex items-center justify-end gap-2">
        {!submitted ? (
          <Button type="button" size="sm" disabled={selected == null} onClick={handleSubmit}>
            Submit answer
          </Button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Come back tomorrow for the next question
            <AppIcon name="paraphrase" className="size-3.5" />
          </span>
        )}
      </div>
    </div>
  )
}
