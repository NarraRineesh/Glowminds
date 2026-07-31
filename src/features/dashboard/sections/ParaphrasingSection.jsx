import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import { Button, DashboardCard, Select, Textarea, cn } from '@/components/ui'
import useAppStore from '@/store/authStore'
import useEntitlements from '@/hooks/useEntitlements'
import useIsLg from '@/hooks/useIsLg'
import { DEFAULT_PRICING_CONFIG } from '@/constants/pricingDefaults'
import { apiFetch } from '@/services/apiClient'

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'academic', label: 'Academic' },
  { id: 'concise', label: 'Concise' },
  { id: 'creative', label: 'Creative' },
]

const SCOPES = [
  { id: 'about', label: 'About', hint: 'Profile / LinkedIn summary' },
  { id: 'headline', label: 'Headline', hint: 'One-line positioning' },
  { id: 'bullet', label: 'Bullet', hint: 'Resume achievement line' },
  { id: 'cover', label: 'Cover letter', hint: 'Paragraph or opening' },
]

const VARIANT_NAMES = ['A · Confident', 'B · Concise', 'C · Warm']

const SAMPLE = `I worked on a side project for 3 months that helps students discover internships, and it now has 1200 weekly users. I want to highlight this on my resume.`

export default function ParaphrasingSection() {
  const isLg = useIsLg()
  const { addToast } = useAppStore()
  const { credits, creditCosts, loading: entLoading, refresh: refreshEntitlements } = useEntitlements()
  const paraphraseCost = creditCosts?.paraphrase ?? DEFAULT_PRICING_CONFIG.creditCosts.paraphrase ?? 1
  const creditBalance = credits?.balance
  const canRun = creditBalance == null || creditBalance >= paraphraseCost
  const [text, setText] = useState('')
  const [tone, setTone] = useState('professional')
  const [scope, setScope] = useState('about')
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!text.trim() || text.trim().length < 3) {
      addToast('error', 'Add some text to paraphrase')
      return
    }
    if (!canRun) {
      addToast('error', 'Not enough AI credits for paraphrasing')
      return
    }
    setLoading(true)
    setVariants([])
    try {
      const data = await apiFetch('/ai/paraphrase', { body: { text, tone, scope } })
      setVariants(data?.variants || [])
      refreshEntitlements({ force: true }).catch(() => {})
    } catch (err) {
      console.error('paraphrase:', err)
      addToast('error', err.message || 'Paraphrase failed')
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

  const sidebar = (
    <div className="space-y-2.5 sm:space-y-4">
      <DashboardCard
        titleIcon="sliders"
        title="What to rewrite"
        contentClassName="space-y-2 !py-3 sm:!py-4"
      >
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-1 sm:gap-2">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              className={cn(
                'rounded-xl border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:px-3 sm:py-2.5',
                scope === s.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30 hover:border-primary/40',
              )}
            >
              <span className="block text-sm font-semibold text-foreground">{s.label}</span>
              <span className="mt-0.5 block text-[0.65rem] leading-snug text-muted-foreground sm:text-[0.68rem]">
                {s.hint}
              </span>
            </button>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard
        titleIcon="palette"
        title="Preferences"
        contentClassName="space-y-2.5 !py-3 sm:space-y-3 sm:!py-4"
      >
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Tone</span>
          <Select value={tone} onChange={(e) => setTone(e.target.value)}>
            {TONES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </Select>
        </label>

        <Button
          className="w-full"
          onClick={run}
          disabled={loading || entLoading || !text.trim() || !canRun}
        >
          {loading
            ? 'Rewriting…'
            : `Generate variants · ${paraphraseCost} credit${paraphraseCost === 1 ? '' : 's'}`}
        </Button>

        {!canRun && (
          <p className="text-xs text-amber-600">
            Not enough credits.{' '}
            <Link to="/dashboard/settings" className="underline">Check balance</Link>
          </p>
        )}

        <Button
          className="w-full"
          variant="ghost"
          type="button"
          onClick={() => {
            setText(SAMPLE)
            setVariants([])
          }}
        >
          Load sample text
        </Button>
      </DashboardCard>
    </div>
  )

  const originalCard = (
    <DashboardCard
      titleIcon="pencil"
      title="Original text"
      contentClassName="space-y-2 !py-3 sm:space-y-3 sm:!py-4"
    >
      {!text.trim() && !loading ? (
        <div className="hidden flex-col items-center gap-3 py-8 text-center sm:flex sm:py-10">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <AppIcon name="paraphrase" className="size-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Rewrite in your voice</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Paste a headline, about section, resume bullet, or cover-letter snippet.
            Pick scope and tone in the sidebar, then generate three variants.
          </p>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground sm:hidden">
        Paste text, choose scope & tone below, then generate.
      </p>
      <Textarea
        rows={text.trim() ? 7 : 4}
        className="min-h-[6.5rem] sm:min-h-0"
        placeholder={`Paste ${SCOPES.find((s) => s.id === scope)?.label.toLowerCase() || 'text'} here…`}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 4000))}
      />
      <p className="text-right text-xs text-muted-foreground">{text.length} / 4000</p>
    </DashboardCard>
  )

  const variantsCard = (
    <DashboardCard
      titleIcon="sparkle"
      title="Variants"
      action={
        variants.length > 0 ? (
          <span className="text-xs text-muted-foreground">{variants.length} options</span>
        ) : null
      }
      contentClassName="space-y-2.5 !py-3 sm:space-y-3 sm:!py-4"
    >
      {loading ? (
        <p className="py-4 text-center text-sm text-muted-foreground sm:py-10">Generating three rewrites…</p>
      ) : variants.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted-foreground sm:py-10">
          Variants appear here after you generate.
        </p>
      ) : (
        variants.map((v, i) => (
          <div key={i} className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {VARIANT_NAMES[i] || `Variant ${i + 1}`}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => copy(v)}>Copy</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setText(v)
                    addToast('success', 'Applied to editor')
                  }}
                >
                  Use
                </Button>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{v}</p>
          </div>
        ))
      )}
    </DashboardCard>
  )

  return (
    <ToolPage>
      {isLg ? (
        <ToolSidebarLayout sidebar={sidebar}>
          {originalCard}
          {variantsCard}
        </ToolSidebarLayout>
      ) : (
        <div className="flex min-w-0 flex-col gap-2.5">
          {originalCard}
          {sidebar}
          {variantsCard}
        </div>
      )}
    </ToolPage>
  )
}
