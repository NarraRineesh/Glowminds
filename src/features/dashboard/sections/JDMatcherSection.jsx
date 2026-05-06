import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import '@/styles/cards.css'
import '@/styles/dashboard.css'
import '@/styles/forms.css'

const SAMPLE_JD = `We are seeking a Frontend Engineer with 2+ years of experience.
Required: React, TypeScript, Tailwind CSS, REST/GraphQL APIs.
Nice to have: Next.js, performance tuning, accessibility.
You will own the design system and ship production features weekly.`

function tokenize(text) {
  return new Set(
    (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1),
  )
}

const STOPWORDS = new Set([
  'the', 'and', 'with', 'have', 'will', 'you', 'are', 'for', 'our', 'your', 'who',
  'this', 'that', 'from', 'into', 'about', 'all', 'any', 'can', 'was', 'has',
])

function extractKeywords(text) {
  const tokens = tokenize(text)
  return Array.from(tokens).filter((t) => !STOPWORDS.has(t))
}

export default function JDMatcherSection() {
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState(SAMPLE_JD)

  const result = useMemo(() => {
    if (!resumeText.trim() || !jdText.trim()) return null
    const jdKeywords = extractKeywords(jdText)
    const resumeKeywords = tokenize(resumeText)
    const matched = jdKeywords.filter((k) => resumeKeywords.has(k))
    const missing = jdKeywords.filter((k) => !resumeKeywords.has(k))
    const score = jdKeywords.length === 0 ? 0 : Math.round((matched.length / jdKeywords.length) * 100)
    return { score, matched, missing, total: jdKeywords.length }
  }, [resumeText, jdText])

  return (
    <>
      <SectionHeader
        badge="AI · Match"
        badgeBg="var(--color-grn2)"
        badgeColor="var(--color-grn)"
        title="See exactly how you stack up"
        accent="stack up"
        subtitle="Paste any job description and your resume — we'll surface the keywords you nailed and the ones recruiters are still hunting for."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]">
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="card"
          >
            <div className="ch">
              <h3>📄 Job Description</h3>
              <button
                type="button"
                className="btn btn-gh btn-sm"
                onClick={() => setJdText(SAMPLE_JD)}
              >
                Use sample
              </button>
            </div>
            <div className="cb">
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={6}
                placeholder="Paste the job description here…"
                className="fta"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="card"
          >
            <div className="ch"><h3>📝 Your Resume Text</h3></div>
            <div className="cb">
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={8}
                placeholder="Paste your resume content here (or copy from Resume Studio)…"
                className="fta"
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="card sticky top-20 self-start"
        >
          <div className="ch"><h3>🎯 Match Report</h3></div>
          <div className="cb">
            {!result ? (
              <div className="py-6 text-center text-[0.85rem] text-[var(--color-muted)]">
                Paste a job description and your resume to see the match.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <div className="relative mx-auto h-24 w-24">
                    <svg className="absolute inset-0" width="96" height="96" viewBox="0 0 96 96" aria-hidden>
                      <circle cx="48" cy="48" r="42" fill="none" stroke="var(--color-bg3)" strokeWidth="8" />
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        fill="none"
                        strokeWidth="8"
                        strokeLinecap="round"
                        stroke={result.score >= 70 ? 'var(--color-grn)' : result.score >= 40 ? 'var(--color-gold)' : 'var(--color-red)'}
                        strokeDasharray={264}
                        strokeDashoffset={264 - (264 * result.score) / 100}
                        transform="rotate(-90 48 48)"
                        className="transition-[stroke-dashoffset] duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-2xl font-black tabular-nums text-[var(--color-txt)]">
                        {result.score}%
                      </span>
                      <span className="text-[0.6rem] uppercase tracking-wider text-[var(--color-muted)]">
                        match
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[var(--color-grn)]">
                    Matched ({result.matched.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched.slice(0, 24).map((k) => (
                      <span key={k} className="tag tg">{k}</span>
                    ))}
                    {result.matched.length === 0 && (
                      <span className="text-[0.74rem] text-[var(--color-muted)]">No matches yet</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[var(--color-red)]">
                    Missing ({result.missing.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing.slice(0, 24).map((k) => (
                      <span key={k} className="tag tr">{k}</span>
                    ))}
                    {result.missing.length === 0 && (
                      <span className="text-[0.74rem] text-[var(--color-grn)]">You covered everything 🎉</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  )
}
