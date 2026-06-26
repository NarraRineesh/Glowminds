import { useState } from 'react'
import SectionHeader from '@/components/dashboard/SectionHeader'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import { Button, ButtonGroup, DashboardCard, Textarea } from '@/components/ui'
import useAppStore from '@/store/authStore'
import useEntitlements from '@/hooks/useEntitlements'
import AiCreditBar from '@/components/AiCreditBar'
import { DEFAULT_PRICING_CONFIG } from '@/constants/pricingDefaults'
import { apiFetch } from '@/services/apiClient'

const TONES = [
  { id: 'professional', label: 'Professional', icon: 'handshake' },
  { id: 'casual', label: 'Casual', icon: 'leaf' },
  { id: 'academic', label: 'Academic', icon: 'graduation' },
  { id: 'concise', label: 'Concise', icon: 'lightning' },
  { id: 'creative', label: 'Creative', icon: 'palette' },
]

const SAMPLE = `I worked on a side project for 3 months that helps students discover internships, and it now has 1200 weekly users. I want to highlight this on my resume.`

export default function ParaphrasingSection() {
  const { addToast } = useAppStore()
  const { credits, creditCosts, isPro, loading: entitlementsLoading, refresh: refreshEntitlements } = useEntitlements()
  const paraphraseCost = creditCosts?.paraphrase ?? DEFAULT_PRICING_CONFIG.creditCosts.paraphrase ?? 1
  const creditBalance = credits?.balance
  const canRun = creditBalance == null || creditBalance >= paraphraseCost
  const [text, setText] = useState('')
  const [tone, setTone] = useState('professional')
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
      const data = await apiFetch('/ai/paraphrase', { body: { text, tone } })
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
    <DashboardCard titleIcon="target" title="Variants" contentClassName="space-y-3">
      {variants.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Hit “Generate variants” to see three rewrites.</p>
      ) : (
        variants.map((v, i) => (
          <div key={i} className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variant {i + 1}</span>
              <Button variant="ghost" size="sm" onClick={() => copy(v)}>Copy</Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{v}</p>
          </div>
        ))
      )}
    </DashboardCard>
  )

  return (
    <ToolPage>
      <SectionHeader
          badge="AI · Writing"
          badgeClassName="border-purple-500/20 bg-purple-500/10 text-purple-500"
          title="Three rewrites, one click"
          accent="three rewrites"
          subtitle="Pick a tone and we'll generate three distinct ways to say the same thing — perfect for resume bullets, cover letters, and outreach."
        />

        <AiCreditBar
          className="mb-4"
          balance={creditBalance}
          cost={paraphraseCost}
          periodEnd={credits?.periodEnd}
          isPro={isPro}
          loading={entitlementsLoading}
          unitLabel="per rewrite"
          onUpgradeSuccess={() => refreshEntitlements({ force: true })}
        />

        <ToolSidebarLayout sidebar={sidebar} sidebarRight>
          <DashboardCard
            titleIcon="pencil"
            title="Original text"
            action={(
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setText(SAMPLE)}>Use sample</Button>
                <Button size="sm" onClick={run} disabled={loading || !text.trim() || !canRun}>
                  {loading ? 'Rewriting…' : 'Generate variants'}
                </Button>
              </div>
            )}
            contentClassName="space-y-4"
          >
            <Textarea
              rows={8}
              placeholder="Paste up to ~4000 characters of text here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">{text.length} / 4000</p>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tone</p>
              <ButtonGroup className="flex-wrap">
                {TONES.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    size="sm"
                    variant={tone === t.id ? 'default' : 'outline'}
                    onClick={() => setTone(t.id)}
                  >
                    <AppIcon name={t.icon} className="size-3.5" />
                    {t.label}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </DashboardCard>
        </ToolSidebarLayout>
      </ToolPage>
  )
}
