import { useCallback, useEffect, useState } from 'react'
import { improveText, IMPROVE_TONES } from '@/services/resumeAi'
import { AppDialog, Badge, Button, cn } from '@/components/ui'

/**
 * Modal that takes a snippet of resume text, asks Gemini to rewrite it in
 * a chosen tone, and lets the user pick one of three variants.
 */
export default function ImproveTextModal({ open, originalText = '', onAccept, onClose }) {
  const [tone, setTone] = useState('professional')
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchVariants = useCallback(async (nextTone = tone) => {
    setLoading(true)
    setError('')
    setVariants([])
    try {
      const out = await improveText({ text: originalText, tone: nextTone })
      if (!out.length) throw new Error('No variants returned. Try again.')
      setVariants(out)
    } catch (err) {
      console.error('improveText:', err)
      setError(err?.message || 'Could not improve text. Try again.')
    } finally {
      setLoading(false)
    }
  }, [originalText, tone])

  useEffect(() => {
    if (!open) return
    setTone('professional')
    fetchVariants('professional')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, originalText])

  const onPickTone = (id) => {
    if (id === tone || loading) return
    setTone(id)
    fetchVariants(id)
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose?.() }}
      size="lg"
      className="max-w-[620px] gap-0 overflow-hidden p-0 sm:max-w-[620px]"
      contentClassName="gap-0 p-0"
      footer={(
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      )}
    >
      <div className="border-b border-border px-6 py-4">
        <Badge variant="outline" className="border-primary/20 bg-primary/10 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-primary">
          AI · Improve text
        </Badge>
        <h2 className="mt-2 text-lg font-bold text-foreground">
          Pick a rewrite
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Replaces your current selection (or the focused field if nothing is selected).
        </p>
      </div>

      <div className="px-6 pt-4">
        <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Original
        </div>
        <div className="mt-1 max-h-24 overflow-auto rounded-lg border border-border bg-muted p-3 text-[0.82rem] leading-relaxed text-foreground">
          {originalText || <em className="text-muted-foreground">Nothing to improve.</em>}
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Tone
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {IMPROVE_TONES.map((t) => {
            const active = t.id === tone
            return (
              <Button
                key={t.id}
                type="button"
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPickTone(t.id)}
                disabled={loading}
                className={cn(
                  'h-auto rounded-full px-3 py-1.5 text-xs font-semibold',
                  !active && 'bg-muted/50 text-muted-foreground',
                )}
              >
                {t.label}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="px-6 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Suggestions
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchVariants(tone)}
            disabled={loading}
          >
            {loading ? 'Generating…' : '↻ Regenerate'}
          </Button>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          {loading && [0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-border bg-muted"
            />
          ))}

          {!loading && error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && variants.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onAccept?.(v)}
              className="group flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3 text-left transition-all hover:-translate-y-px hover:border-primary hover:bg-primary/10"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span className="text-[0.86rem] leading-relaxed text-foreground">
                {v}
              </span>
            </button>
          ))}
        </div>
      </div>
    </AppDialog>
  )
}
