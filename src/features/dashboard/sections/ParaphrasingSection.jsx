import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import useAppStore from '@/store/authStore'
import UpgradeGate from '@/components/UpgradeGate'
import { apiFetch } from '@/services/apiClient'
import '@/styles/cards.css'
import '@/styles/dashboard.css'
import '@/styles/forms.css'

const TONES = [
  { id: 'professional', label: 'Professional', icon: '🤝' },
  { id: 'casual', label: 'Casual', icon: '🌿' },
  { id: 'academic', label: 'Academic', icon: '🎓' },
  { id: 'concise', label: 'Concise', icon: '⚡' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
]

const SAMPLE = `I worked on a side project for 3 months that helps students discover internships, and it now has 1200 weekly users. I want to highlight this on my resume.`

export default function ParaphrasingSection() {
  const { addToast } = useAppStore()
  const [text, setText] = useState('')
  const [tone, setTone] = useState('professional')
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!text.trim() || text.trim().length < 3) {
      addToast('error', '✍️ Add some text to paraphrase')
      return
    }
    setLoading(true)
    setVariants([])
    try {
      const data = await apiFetch('/ai/paraphrase', { body: { text, tone } })
      setVariants(data?.variants || [])
    } catch (err) {
      console.error('paraphrase:', err)
      addToast('error', `⚠️ ${err.message || 'Paraphrase failed'}`)
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
    <UpgradeGate feature="Paraphrasing">
      <SectionHeader
        badge="AI · Writing"
        badgeBg="var(--color-prp2)"
        badgeColor="var(--color-prp)"
        title="Three rewrites, one click"
        accent="three rewrites"
        subtitle="Pick a tone and we'll generate three distinct ways to say the same thing — perfect for resume bullets, cover letters, and outreach."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="card"
        >
          <div className="ch">
            <h3>📝 Original text</h3>
            <div className="flex gap-2">
              <button type="button" className="btn btn-gh btn-sm" onClick={() => setText(SAMPLE)}>Use sample</button>
              <button type="button" className="btn btn-p btn-sm" onClick={run} disabled={loading || !text.trim()}>
                {loading ? '⏳ Rewriting…' : '🔁 Generate variants'}
              </button>
            </div>
          </div>
          <div className="cb flex flex-col gap-3">
            <textarea
              className="fta"
              rows={8}
              placeholder="Paste up to ~4000 characters of text here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="text-right text-[.66rem] text-[var(--color-muted)]">{text.length} / 4000</div>

            <div>
              <div className="mb-1.5 text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[var(--color-muted)]">Tone</div>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[.74rem] font-semibold transition ${tone === t.id ? 'border-[var(--color-prp)] bg-[var(--color-prp2)] text-[var(--color-prp)]' : 'border-[var(--color-bdr)] bg-[var(--color-bg3)] text-[var(--color-txt2)] hover:border-[var(--color-bdr2)]'}`}
                  >
                    <span aria-hidden>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="card sticky top-20 self-start"
        >
          <div className="ch"><h3>🎯 Variants</h3></div>
          <div className="cb flex flex-col gap-3">
            {variants.length === 0 ? (
              <div className="py-6 text-center text-[0.85rem] text-[var(--color-muted)]">
                Hit “Generate variants” to see three rewrites.
              </div>
            ) : (
              variants.map((v, i) => (
                <div key={i} className="rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg2)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[.62rem] font-bold uppercase tracking-[0.1em] text-[var(--color-muted)]">Variant {i + 1}</span>
                    <button type="button" className="btn btn-gh btn-sm" onClick={() => copy(v)}>Copy</button>
                  </div>
                  <div className="whitespace-pre-wrap text-[.86rem] leading-relaxed text-[var(--color-txt)]">{v}</div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </UpgradeGate>
  )
}
