import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import SectionHeader from '@/components/dashboard/SectionHeader'
import useAppStore from '@/store/authStore'
import { db, auth } from '@/services/firebase'
import Loader from '@/components/Loader'
import '@/styles/cards.css'
import '@/styles/dashboard.css'
import '@/styles/forms.css'

function normalizeLinkedIn(input) {
  const v = (input || '').trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v.replace(/^\/+/, '')}`
}

function isValidLinkedInUrl(input) {
  const v = (input || '').trim()
  if (!v) return false
  try {
    const url = new URL(normalizeLinkedIn(v))
    return /(^|\.)linkedin\.com$/i.test(url.hostname)
  } catch {
    return false
  }
}

const CHECKS = [
  {
    id: 'photo',
    label: 'Professional photo',
    desc: 'Headshot · neutral background · genuine smile · 400×400+',
    weight: 12,
  },
  {
    id: 'banner',
    label: 'Custom banner',
    desc: 'Don’t use the default — banner is prime real estate',
    weight: 6,
  },
  {
    id: 'headline',
    label: 'Keyword-rich headline',
    desc: 'Include role + 2 skills + outcome (e.g. "Frontend Engineer · React, TS · shipped 30+ features")',
    weight: 18,
  },
  {
    id: 'about',
    label: 'About section (3+ paragraphs)',
    desc: 'Hook → proof → call to action. Add a bullet list of skills.',
    weight: 14,
  },
  {
    id: 'experience',
    label: 'Experience with metrics',
    desc: 'Each role has 2–4 bullets, each with a number / outcome',
    weight: 16,
  },
  {
    id: 'skills',
    label: '15+ skills + endorsements',
    desc: 'Pin your top 3 skills. Endorsements drive search ranking.',
    weight: 12,
  },
  {
    id: 'projects',
    label: 'Featured projects / posts',
    desc: 'Pin 3 highlights to your "Featured" section',
    weight: 8,
  },
  {
    id: 'recommendations',
    label: '2+ recommendations',
    desc: 'Recommendations from peers/managers boost trust signals',
    weight: 8,
  },
  {
    id: 'activity',
    label: 'Active in last 30 days',
    desc: 'Like, comment, or post weekly — boosts visibility',
    weight: 6,
  },
]

const HEADLINE_TIPS = [
  'Lead with the role, not the company',
  'Use 2–3 specific skills (React, TypeScript) instead of buzzwords',
  'Include a result or outcome (shipped X, reduced Y by Z%)',
  'Avoid "Aspiring" / "Looking for opportunities" — sound confident',
]

export default function LinkedInOptimizerSection() {
  const addToast = useAppStore((s) => s.addToast)
  const [done, setDone] = useState({})

  const [profileUrl, setProfileUrl] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const uid = auth.currentUser?.uid
      if (!uid) { setLoadingProfile(false); return }
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        if (cancelled) return
        const url = snap.exists() ? (snap.data()?.profile?.preferences?.linkedIn || '') : ''
        setProfileUrl(url)
        setEditing(!url)
        setDraft(url)
      } catch (e) {
        console.error('LinkedIn load:', e)
      }
      if (!cancelled) setLoadingProfile(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleSaveUrl = async () => {
    if (!isValidLinkedInUrl(draft)) {
      addToast?.('error', '⚠️ Enter a valid linkedin.com URL')
      return
    }
    const uid = auth.currentUser?.uid
    if (!uid) { addToast?.('error', '⚠️ You must be signed in'); return }
    const normalized = normalizeLinkedIn(draft)
    setSaving(true)
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      const existing = snap.exists() ? (snap.data()?.profile || {}) : {}
      const merged = {
        ...existing,
        preferences: { ...(existing.preferences || {}), linkedIn: normalized },
      }
      await setDoc(doc(db, 'users', uid), { profile: merged, updatedAt: serverTimestamp() }, { merge: true })
      setProfileUrl(normalized)
      setDraft(normalized)
      setEditing(false)
      addToast?.('success', '✅ LinkedIn URL saved to your profile')
    } catch (e) {
      console.error('LinkedIn save:', e)
      addToast?.('error', '⚠️ Failed to save')
    }
    setSaving(false)
  }

  const score = useMemo(() => {
    const total = CHECKS.reduce((s, c) => s + c.weight, 0)
    const earned = CHECKS.reduce((s, c) => s + (done[c.id] ? c.weight : 0), 0)
    return Math.round((earned / total) * 100)
  }, [done])

  const tone = score >= 80 ? 'great' : score >= 50 ? 'ok' : 'low'

  return (
    <>
      <SectionHeader
        badge="LinkedIn · Audit"
        badgeBg="var(--color-blu3)"
        badgeColor="var(--color-blu2)"
        title="Make recruiters find you first"
        accent="find you first"
        subtitle="A 9-point audit covering everything that drives LinkedIn search ranking and recruiter trust signals — check off as you fix each item."
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="card mb-4"
      >
        <div className="ch">
          <h3>🔗 Your LinkedIn</h3>
          {profileUrl && !editing && (
            <span className="rounded-full bg-[var(--color-grn2)] px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-grn)]">
              ✓ Linked
            </span>
          )}
        </div>
        <div className="cb">
          {loadingProfile ? (
            <Loader variant="block" label="Loading your profile…" size={32} />
          ) : !editing && profileUrl ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-2 truncate rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-3 py-2 text-[0.82rem] font-semibold text-[var(--color-blu2)] transition-colors hover:border-[var(--color-blu)]"
                title={profileUrl}
              >
                <span aria-hidden>🔗</span>
                <span className="truncate">{profileUrl.replace(/^https?:\/\//, '')}</span>
              </a>
              <button
                type="button"
                className="btn btn-gh btn-xs"
                onClick={() => { setDraft(profileUrl); setEditing(true) }}
              >
                ✏️ Edit
              </button>
              <span className="text-[0.72rem] text-[var(--color-muted)]">
                Pulled from your profile
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[0.82rem] leading-relaxed text-[var(--color-txt2)]">
                {profileUrl
                  ? 'Update your LinkedIn URL — we’ll save it back to your profile.'
                  : 'No LinkedIn URL on your profile yet. Add it once and the optimizer will use it everywhere.'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="fi flex-1 min-w-[220px]"
                  type="url"
                  inputMode="url"
                  placeholder="https://linkedin.com/in/yourname"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !saving) handleSaveUrl() }}
                />
                <button
                  type="button"
                  className="btn btn-p btn-sm"
                  disabled={saving || !draft.trim()}
                  onClick={handleSaveUrl}
                >
                  {saving ? 'Saving…' : 'Save to profile'}
                </button>
                {profileUrl && (
                  <button
                    type="button"
                    className="btn btn-gh btn-sm"
                    disabled={saving}
                    onClick={() => { setDraft(profileUrl); setEditing(false) }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="card"
        >
          <div className="ch">
            <h3>✅ Profile Audit</h3>
            <span className="text-[0.66rem] text-[var(--color-muted)]">
              {Object.values(done).filter(Boolean).length}/{CHECKS.length} done
            </span>
          </div>
          <div className="cb flex flex-col gap-2">
            {CHECKS.map((c) => {
              const checked = !!done[c.id]
              return (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                    checked
                      ? 'border-[var(--color-grn)]/40 bg-[var(--color-grn2)]'
                      : 'border-[var(--color-bdr)] bg-[var(--color-bg3)] hover:border-[var(--color-bdr2)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setDone((d) => ({ ...d, [c.id]: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-[var(--color-grn)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.86rem] font-bold text-[var(--color-txt)]">
                        {c.label}
                      </span>
                      <span className="rounded-full bg-[var(--color-bg3)] px-2 py-0.5 text-[0.6rem] font-bold text-[var(--color-blu2)]">
                        +{c.weight} pts
                      </span>
                    </div>
                    <div className="mt-0.5 text-[0.74rem] leading-snug text-[var(--color-txt2)]">
                      {c.desc}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="card sticky top-20 self-start"
          >
            <div className="ch"><h3>📊 LinkedIn Score</h3></div>
            <div className="cb">
              <div className="text-center">
                <div className="relative mx-auto h-28 w-28">
                  <svg className="absolute inset-0" width="112" height="112" viewBox="0 0 112 112" aria-hidden>
                    <circle cx="56" cy="56" r="48" fill="none" stroke="var(--color-bg3)" strokeWidth="8" />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      stroke={tone === 'great' ? 'var(--color-grn)' : tone === 'ok' ? 'var(--color-gold)' : 'var(--color-blu)'}
                      strokeDasharray={302}
                      strokeDashoffset={302 - (302 * score) / 100}
                      transform="rotate(-90 56 56)"
                      className="transition-[stroke-dashoffset] duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-3xl font-black tabular-nums text-[var(--color-txt)]">
                      {score}
                    </span>
                    <span className="text-[0.62rem] uppercase tracking-wider text-[var(--color-muted)]">
                      out of 100
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-[0.78rem] text-[var(--color-txt2)]">
                  {tone === 'great' && '🚀 Recruiters can find you easily'}
                  {tone === 'ok' && '🛠️ Strong base — a few wins away from "great"'}
                  {tone === 'low' && '👀 Big opportunity — start with the headline'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="card"
          >
            <div className="ch"><h3>💡 Headline Tips</h3></div>
            <div className="cb flex flex-col gap-2">
              {HEADLINE_TIPS.map((t) => (
                <div key={t} className="flex items-start gap-2.5 text-[0.82rem] leading-relaxed text-[var(--color-txt2)]">
                  <span className="mt-0.5 text-[var(--color-grn)]" aria-hidden>✓</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
