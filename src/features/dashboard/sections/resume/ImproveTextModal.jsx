import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { improveText, IMPROVE_TONES } from '@/services/resumeAi'

/**
 * Modal that takes a snippet of resume text, asks Gemini to rewrite it in
 * a chosen tone, and lets the user pick one of three variants.
 *
 * Props:
 *  - open: boolean
 *  - originalText: string (pre-fetched selection / field text)
 *  - onAccept(variant: string): called when the user picks a variant
 *  - onClose(): called to dismiss
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

  // Kick off a fetch each time the modal opens
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

  // ESC to close
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[700] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[620px] overflow-hidden rounded-2xl border border-[var(--color-bdr2)] bg-[var(--color-surf)] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-bdr)] px-6 py-4">
              <div>
                <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--color-blu2)]">
                  AI · Improve text
                </div>
                <h2 className="mt-1 text-lg font-bold text-[var(--color-txt)]">
                  Pick a rewrite
                </h2>
                <p className="mt-1 text-xs text-[var(--color-txt2)]">
                  Replaces your current selection (or the focused field if nothing is selected).
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--color-bdr)] bg-[var(--color-surf2)] text-[var(--color-txt2)] hover:bg-[var(--color-red2)] hover:text-[var(--color-red)]"
              >
                ✕
              </button>
            </div>

            {/* Original snippet */}
            <div className="px-6 pt-4">
              <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--color-txt2)]">
                Original
              </div>
              <div className="mt-1 max-h-24 overflow-auto rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg3)] p-3 text-[0.82rem] leading-relaxed text-[var(--color-txt)]">
                {originalText || <em className="text-[var(--color-txt2)]">Nothing to improve.</em>}
              </div>
            </div>

            {/* Tone tabs */}
            <div className="px-6 pt-4">
              <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--color-txt2)]">
                Tone
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {IMPROVE_TONES.map((t) => {
                  const active = t.id === tone
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onPickTone(t.id)}
                      disabled={loading}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[var(--color-blu)] bg-[var(--color-blu3)] text-[var(--color-blu2)]'
                          : 'border-[var(--color-bdr)] bg-[var(--color-surf2)] text-[var(--color-txt2)] hover:border-[var(--color-bdr2)]'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Variants */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--color-txt2)]">
                  Suggestions
                </div>
                <button
                  type="button"
                  onClick={() => fetchVariants(tone)}
                  disabled={loading}
                  className="rounded-md border border-[var(--color-bdr)] bg-[var(--color-surf2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-txt2)] hover:bg-[var(--color-bg3)] disabled:opacity-60"
                >
                  {loading ? 'Generating…' : '↻ Regenerate'}
                </button>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {loading && [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg border border-[var(--color-bdr)] bg-[var(--color-bg3)]"
                  />
                ))}

                {!loading && error && (
                  <div className="rounded-lg border border-[var(--color-red)] bg-[var(--color-red2)] px-3 py-2 text-sm text-[var(--color-red)]">
                    {error}
                  </div>
                )}

                {!loading && !error && variants.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onAccept?.(v)}
                    className="group flex items-start gap-3 rounded-lg border border-[var(--color-bdr)] bg-[var(--color-surf2)] p-3 text-left transition-all hover:-translate-y-px hover:border-[var(--color-blu)] hover:bg-[var(--color-blu3)]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-blu)] text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-[0.86rem] leading-relaxed text-[var(--color-txt)]">
                      {v}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-[var(--color-bdr)] bg-[var(--color-bg3)] px-6 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[var(--color-bdr)] bg-[var(--color-surf)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-txt2)] hover:bg-[var(--color-surf2)]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
