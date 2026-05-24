import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import useAppStore from '@/store/authStore'
import UpgradeGate from '@/components/UpgradeGate'
import { apiFetch } from '@/services/apiClient'
import '@/styles/cards.css'
import '@/styles/dashboard.css'
import '@/styles/forms.css'

const SAMPLE = `I has been working as a developer for 3 years, and i build many projects with React. My team mate said my english need improvement.`

const SEVERITY_META = {
  high: { label: 'High', className: 'grammar-sev-high' },
  medium: { label: 'Medium', className: 'grammar-sev-medium' },
  low: { label: 'Low', className: 'grammar-sev-low' },
}

function normalizeSuggestion(raw) {
  if (typeof raw === 'string') {
    return { original: '', replacement: raw, reason: '', severity: 'medium' }
  }
  const severity = ['high', 'medium', 'low'].includes(raw?.severity) ? raw.severity : 'medium'
  return {
    original: raw?.original || raw?.before || raw?.from || '',
    replacement: raw?.replacement || raw?.after || raw?.to || '',
    reason: raw?.reason || '',
    severity,
  }
}

export default function GrammarCheckSection() {
  const { addToast } = useAppStore()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const run = async () => {
    if (!text.trim() || text.trim().length < 3) {
      addToast('error', '✍️ Add some text to check')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const data = await apiFetch('/ai/grammar', { body: { text } })
      setResult(data)
    } catch (err) {
      console.error('grammar check:', err)
      addToast('error', `⚠️ ${err.message || 'Grammar check failed'}`)
    }
    setLoading(false)
  }

  const copy = async (s) => {
    try {
      await navigator.clipboard.writeText(s)
      addToast('success', '📋 Copied')
    } catch {
      addToast('error', '⚠️ Could not copy')
    }
  }

  return (
    <UpgradeGate feature="Grammar Check">
      <SectionHeader
        badge="AI · Writing"
        badgeBg="var(--color-blu3)"
        badgeColor="var(--color-blu2)"
        title="Polish every sentence"
        accent="every sentence"
        subtitle="Paste any text — bios, emails, application answers — and we'll fix grammar, score it, and call out specific edits."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="card"
        >
          <div className="ch">
            <h3>📝 Your text</h3>
            <div className="flex gap-2">
              <button type="button" className="btn btn-gh btn-sm" onClick={() => setText(SAMPLE)}>Use sample</button>
              <button type="button" className="btn btn-p btn-sm" onClick={run} disabled={loading || !text.trim()}>
                {loading ? '⏳ Checking…' : '✍️ Check grammar'}
              </button>
            </div>
          </div>
          <div className="cb">
            <textarea
              className="fta"
              rows={10}
              placeholder="Paste up to ~8000 characters of text here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-2 text-right text-[.66rem] text-[var(--color-muted)]">{text.length} / 8000</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="card sticky top-20 self-start"
        >
          <div className="ch"><h3>🎯 Result</h3></div>
          <div className="cb">
            {!result ? (
              <div className="py-6 text-center text-[0.85rem] text-[var(--color-muted)]">
                Hit “Check grammar” to see corrections.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black tabular-nums" style={{ color: result.score >= 80 ? 'var(--color-grn)' : result.score >= 50 ? 'var(--color-gold)' : 'var(--color-red)' }}>
                    {result.score}
                  </div>
                  <div className="text-[.7rem] uppercase tracking-wider text-[var(--color-muted)]">
                    Quality<br />score
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[var(--color-grn)]">
                    Corrected
                    <button type="button" className="btn btn-gh btn-sm" onClick={() => copy(result.corrected)}>Copy</button>
                  </div>
                  <div className="rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg2)] p-3 text-[.86rem] leading-relaxed text-[var(--color-txt)] whitespace-pre-wrap">
                    {result.corrected}
                  </div>
                </div>

                {result.suggestions?.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[var(--color-blu)]">
                      Suggestions ({result.suggestions.length})
                    </div>
                    <p className="mb-2 text-[.72rem] text-[var(--color-muted)]">Full breakdown shown below the editor.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {result?.suggestions?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          className="card"
        >
          <div className="ch">
            <h3>✏️ Suggested edits</h3>
            <span className="text-[.72rem] text-[var(--color-muted)]">{result.suggestions.length} change{result.suggestions.length === 1 ? '' : 's'}</span>
          </div>
          <div className="cb">
            <ul className="grammar-suggestions-list">
              {result.suggestions.map((raw, i) => {
                const s = normalizeSuggestion(raw)
                const sev = SEVERITY_META[s.severity] || SEVERITY_META.medium
                const hasDiff = Boolean(s.original?.trim() || s.replacement?.trim())
                return (
                  <li key={i} className="grammar-suggestion-card">
                    <div className="grammar-suggestion-head">
                      <span className={`grammar-sev-badge ${sev.className}`}>{sev.label} priority</span>
                      {s.replacement?.trim() && (
                        <button type="button" className="btn btn-gh btn-sm" onClick={() => copy(s.replacement)}>
                          Copy fix
                        </button>
                      )}
                    </div>

                    {hasDiff ? (
                      <div className="grammar-diff">
                        {s.original?.trim() && (
                          <div className="grammar-diff-block">
                            <span className="grammar-diff-label">Original</span>
                            <p className="grammar-diff-text grammar-diff-original">{s.original}</p>
                          </div>
                        )}
                        {s.original?.trim() && s.replacement?.trim() && (
                          <div className="grammar-diff-arrow" aria-hidden>↓</div>
                        )}
                        {s.replacement?.trim() && (
                          <div className="grammar-diff-block">
                            <span className="grammar-diff-label">Replace with</span>
                            <p className="grammar-diff-text grammar-diff-replacement">{s.replacement}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="grammar-diff-text grammar-diff-replacement">{s.replacement || s.reason}</p>
                    )}

                    {s.reason && hasDiff && (
                      <p className="grammar-suggestion-reason">
                        <span className="grammar-reason-label">Why:</span> {s.reason}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </motion.div>
      )}
    </UpgradeGate>
  )
}
