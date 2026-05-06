import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import '@/styles/cards.css'
import '@/styles/dashboard.css'
import '@/styles/forms.css'

// Indicative INR LPA ranges (annual). Replace with backend feed later.
const SALARY_TABLE = {
  'Frontend Engineer': { fresher: [4, 7], junior: [7, 14], mid: [14, 26], senior: [26, 48] },
  'Backend Engineer': { fresher: [5, 8], junior: [8, 16], mid: [16, 30], senior: [30, 55] },
  'Full Stack Engineer': { fresher: [4.5, 8], junior: [8, 18], mid: [18, 32], senior: [32, 58] },
  'Data Analyst': { fresher: [3.5, 6], junior: [6, 12], mid: [12, 22], senior: [22, 38] },
  'Data Scientist': { fresher: [6, 10], junior: [10, 20], mid: [20, 38], senior: [38, 65] },
  'Product Manager': { fresher: [8, 14], junior: [14, 24], mid: [24, 42], senior: [42, 75] },
  'UI/UX Designer': { fresher: [3.5, 6], junior: [6, 12], mid: [12, 22], senior: [22, 36] },
  'DevOps Engineer': { fresher: [5, 9], junior: [9, 18], mid: [18, 32], senior: [32, 55] },
}

const CITY_MULTIPLIER = {
  Bangalore: 1.0,
  Hyderabad: 0.95,
  Mumbai: 1.05,
  'Delhi NCR': 0.98,
  Pune: 0.92,
  Chennai: 0.9,
  Remote: 0.95,
}

const LEVELS = [
  { id: 'fresher', label: '0–1 yrs', name: 'Fresher' },
  { id: 'junior', label: '1–3 yrs', name: 'Junior' },
  { id: 'mid', label: '3–6 yrs', name: 'Mid' },
  { id: 'senior', label: '6+ yrs', name: 'Senior' },
]

const NEGOTIATION_TIPS = [
  { ico: '📊', label: 'Anchor with research', desc: 'Quote a range — never a single number.' },
  { ico: '🎯', label: 'Tie ask to outcomes', desc: '"Based on the impact I drove at X, I’d expect…"' },
  { ico: '🤐', label: 'Stay quiet first', desc: 'Whoever talks first after the offer typically loses.' },
  { ico: '📦', label: 'Total comp matters', desc: 'Stock, bonus, learning budget — not just base.' },
]

export default function SalaryInsightsSection() {
  const roles = Object.keys(SALARY_TABLE)
  const cities = Object.keys(CITY_MULTIPLIER)
  const [role, setRole] = useState(roles[0])
  const [level, setLevel] = useState('junior')
  const [city, setCity] = useState('Bangalore')

  const range = useMemo(() => {
    const base = SALARY_TABLE[role][level]
    const mul = CITY_MULTIPLIER[city] || 1
    return [Math.round(base[0] * mul * 10) / 10, Math.round(base[1] * mul * 10) / 10]
  }, [role, level, city])

  const median = ((range[0] + range[1]) / 2).toFixed(1)

  const allLevels = useMemo(
    () =>
      LEVELS.map((lv) => {
        const b = SALARY_TABLE[role][lv.id]
        const mul = CITY_MULTIPLIER[city] || 1
        return { ...lv, low: Math.round(b[0] * mul * 10) / 10, high: Math.round(b[1] * mul * 10) / 10 }
      }),
    [role, city],
  )
  const maxHigh = Math.max(...allLevels.map((l) => l.high))

  return (
    <>
      <SectionHeader
        badge="Comp · India"
        badgeBg="var(--color-grn2)"
        badgeColor="var(--color-grn)"
        title="Know your worth before the offer call"
        accent="your worth"
        subtitle="Indicative annual compensation by role, experience, and city. Use these ranges as anchors when you negotiate — never a single number."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="card"
        >
          <div className="ch"><h3>🎚️ Filters</h3></div>
          <div className="cb flex flex-col gap-3">
            <label className="block">
              <span className="mb-1 block text-[0.66rem] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Role
              </span>
              <select className="fsl" value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[0.66rem] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Experience
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {LEVELS.map((lv) => (
                  <button
                    key={lv.id}
                    type="button"
                    onClick={() => setLevel(lv.id)}
                    className={`rounded-lg border px-2 py-2 text-[0.74rem] font-semibold transition-colors ${
                      level === lv.id
                        ? 'border-[var(--color-blu)] bg-[var(--color-blu3)] text-[var(--color-blu2)]'
                        : 'border-[var(--color-bdr)] bg-[var(--color-bg3)] text-[var(--color-txt2)] hover:border-[var(--color-bdr2)]'
                    }`}
                  >
                    <div className="font-bold">{lv.name}</div>
                    <div className="text-[0.64rem] font-normal text-[var(--color-muted)]">{lv.label}</div>
                  </button>
                ))}
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-[0.66rem] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                City
              </span>
              <select className="fsl" value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] p-5 shadow-sm sm:p-6"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 80% at 0% 0%, var(--color-glow2), transparent 60%), radial-gradient(ellipse 50% 60% at 100% 100%, var(--color-glow), transparent 60%)',
              }}
            />
            <div className="relative">
              <div className="text-[0.66rem] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                {role} · {LEVELS.find((l) => l.id === level)?.name} · {city}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="bg-gradient-to-r from-[var(--color-blu2)] to-[var(--color-grn)] bg-clip-text font-mono text-[clamp(2.2rem,5vw,3.4rem)] font-black tracking-tight text-transparent">
                  ₹{range[0]}–{range[1]}
                </span>
                <span className="text-[0.85rem] font-bold text-[var(--color-txt2)]">LPA</span>
              </div>
              <div className="mt-1 text-[0.78rem] text-[var(--color-txt2)]">
                Median benchmark: <strong className="text-[var(--color-txt)]">₹{median} LPA</strong>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="card"
          >
            <div className="ch"><h3>📈 Trajectory in {city}</h3></div>
            <div className="cb flex flex-col gap-3">
              {allLevels.map((lv) => {
                const pct = (lv.high / maxHigh) * 100
                const lowPct = (lv.low / maxHigh) * 100
                return (
                  <div key={lv.id} className="flex items-center gap-3">
                    <div className="w-20 shrink-0 text-[0.74rem] font-bold text-[var(--color-txt)]">
                      {lv.name}
                    </div>
                    <div className="relative flex-1">
                      <div className="h-3 overflow-hidden rounded-full bg-[var(--color-bg3)]">
                        <div
                          className="absolute top-0 h-3 rounded-full bg-gradient-to-r from-[var(--color-blu)] to-[var(--color-grn)]"
                          style={{ left: `${lowPct}%`, width: `${pct - lowPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-28 shrink-0 text-right font-mono text-[0.74rem] font-bold text-[var(--color-txt)]">
                      ₹{lv.low}–{lv.high}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="card"
          >
            <div className="ch"><h3>💬 Negotiation Playbook</h3></div>
            <div className="cb grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {NEGOTIATION_TIPS.map((t) => (
                <div
                  key={t.label}
                  className="flex items-start gap-3 rounded-xl border border-[var(--color-bdr)] bg-[var(--color-bg3)] px-3 py-2.5"
                >
                  <span className="text-xl leading-none" aria-hidden>{t.ico}</span>
                  <div className="min-w-0">
                    <div className="text-[0.78rem] font-bold text-[var(--color-txt)]">{t.label}</div>
                    <div className="text-[0.7rem] text-[var(--color-txt2)]">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
