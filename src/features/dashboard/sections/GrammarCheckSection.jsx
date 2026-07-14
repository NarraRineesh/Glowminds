import { useState } from 'react'
import SectionHeader from '@/components/dashboard/SectionHeader'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import { Badge, Button, DashboardCard, Progress, Textarea, cn } from '@/components/ui'
import useAppStore from '@/store/authStore'
import useEntitlements from '@/hooks/useEntitlements'
import { DEFAULT_PRICING_CONFIG } from '@/constants/pricingDefaults'
import { apiFetch } from '@/services/apiClient'

const SAMPLE = `I has been working as a developer for 3 years, and i build many projects with React. My team mate said my english need improvement.`

const SEVERITY_META = {
  high: { label: 'High', className: 'border-destructive/20 bg-destructive/10 text-destructive' },
  medium: { label: 'Medium', className: 'border-amber-500/20 bg-amber-500/10 text-amber-500' },
  low: { label: 'Low', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' },
}

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-destructive'
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
  const { credits, creditCosts, isPro, loading: entitlementsLoading, refresh: refreshEntitlements } = useEntitlements()
  const grammarCost = creditCosts?.grammar ?? DEFAULT_PRICING_CONFIG.creditCosts.grammar ?? 1
  const creditBalance = credits?.balance
  const canRun = creditBalance == null || creditBalance >= grammarCost
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const run = async () => {
    if (!text.trim() || text.trim().length < 3) {
      addToast('error', 'Add some text to check')
      return
    }
    if (!canRun) {
      addToast('error', 'Not enough AI credits for grammar check')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const data = await apiFetch('/ai/grammar', { body: { text } })
      setResult(data)
      refreshEntitlements({ force: true }).catch(() => {})
    } catch (err) {
      console.error('grammar check:', err)
      addToast('error', err.message || 'Grammar check failed')
    }
    setLoading(false)
  }

  const copy = async (s) => {
    try {
      await navigator.clipboard.writeText(s)
      addToast('success', 'Copied')
    } catch {
      addToast('error', 'Could not copy')
    }
  }

  const applyCorrected = () => {
    if (!result?.corrected) return
    setText(result.corrected)
    addToast('success', 'Applied corrected text to editor')
  }

  const applySuggestion = (s) => {
    const original = s.original?.trim()
    const replacement = s.replacement?.trim()
    if (!original || !replacement) {
      if (replacement) {
        setText((prev) => (prev.includes(replacement) ? prev : `${prev.trim()}\n${replacement}`.trim()))
        addToast('success', 'Appended suggested phrasing')
      }
      return
    }
    if (!text.includes(original)) {
      addToast('error', 'Original phrase not found in editor — paste corrected text instead')
      return
    }
    setText((prev) => prev.replace(original, replacement))
    addToast('success', 'Applied edit')
  }

  const sidebar = (
    <DashboardCard titleIcon="target" title="Result">
      {!result ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Hit “Check grammar” to see corrections.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={cn('text-3xl font-black tabular-nums', scoreColor(result.score))}>{result.score}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quality score</span>
          </div>
          <Progress
            value={result.score}
            className={cn(
              'gap-0 [&_[data-slot=progress-track]]:h-2',
              result.score >= 80
                ? '[&_[data-slot=progress-indicator]]:bg-emerald-500'
                : result.score >= 50
                  ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
                  : '[&_[data-slot=progress-indicator]]:bg-destructive',
            )}
          />
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Corrected</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => copy(result.corrected)}>Copy</Button>
                <Button variant="outline" size="sm" onClick={applyCorrected}>Apply to editor</Button>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {result.corrected}
            </div>
          </div>
          {result.suggestions?.length > 0 && (
            <p className="text-xs text-muted-foreground">{result.suggestions.length} suggested edit{result.suggestions.length === 1 ? '' : 's'} below</p>
          )}
        </div>
      )}
    </DashboardCard>
  )

  return (
    <ToolPage>
      <SectionHeader
          badge="AI · Writing"
          badgeClassName="border-primary/20 bg-primary/10 text-primary"
          title="Polish every sentence"
          accent="every sentence"
          subtitle="Paste any text — bios, emails, application answers — and we'll fix grammar, score it, and call out specific edits."
        />

        <ToolSidebarLayout sidebar={sidebar} sidebarRight>
          <DashboardCard
            titleIcon="pencil"
            title="Your text"
            action={(
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setText(SAMPLE)}>Use sample</Button>
                <Button size="sm" onClick={run} disabled={loading || !text.trim() || !canRun}>
                  {loading ? 'Checking…' : 'Check grammar'}
                </Button>
              </div>
            )}
          >
            <Textarea
              rows={10}
              placeholder="Paste up to ~8000 characters of text here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="mt-2 text-right text-xs text-muted-foreground">{text.length} / 8000</p>
          </DashboardCard>

          {result?.suggestions?.length > 0 && (
            <DashboardCard
              titleIcon="pencil"
              title="Suggested edits"
              action={<span className="text-xs text-muted-foreground">{result.suggestions.length} change{result.suggestions.length === 1 ? '' : 's'}</span>}
            >
              <ul className="space-y-3">
                {result.suggestions.map((raw, i) => {
                  const s = normalizeSuggestion(raw)
                  const sev = SEVERITY_META[s.severity] || SEVERITY_META.medium
                  const hasDiff = Boolean(s.original?.trim() || s.replacement?.trim())
                  return (
                    <li key={i} className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Badge variant="outline" className={cn('text-[0.65rem] font-bold uppercase', sev.className)}>
                          {sev.label} priority
                        </Badge>
                        <div className="flex gap-1">
                          {s.replacement?.trim() && (
                            <Button variant="ghost" size="sm" onClick={() => copy(s.replacement)}>Copy</Button>
                          )}
                          {(s.original?.trim() || s.replacement?.trim()) && (
                            <Button variant="outline" size="sm" onClick={() => applySuggestion(s)}>Apply</Button>
                          )}
                        </div>
                      </div>
                      {hasDiff ? (
                        <div className="space-y-2">
                          {s.original?.trim() && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original</span>
                              <p className="mt-1 rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-sm leading-relaxed line-through decoration-destructive/60">{s.original}</p>
                            </div>
                          )}
                          {s.replacement?.trim() && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Replace with</span>
                              <p className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-sm leading-relaxed">{s.replacement}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-sm leading-relaxed">{s.replacement || s.reason}</p>
                      )}
                      {s.reason && hasDiff && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Why:</span> {s.reason}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </DashboardCard>
          )}
        </ToolSidebarLayout>
      </ToolPage>
  )
}
