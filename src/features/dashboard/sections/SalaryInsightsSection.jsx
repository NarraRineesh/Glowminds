import { useMemo, useState } from 'react'
import SectionHeader from '@/components/dashboard/SectionHeader'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import { Button, Card, CardContent, DashboardCard, FormField, Progress, Select, cn } from '@/components/ui'

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
  { ico: 'chart', label: 'Anchor with research', desc: 'Quote a range — never a single number.' },
  { ico: 'target', label: 'Tie ask to outcomes', desc: '"Based on the impact I drove at X, I\'d expect…"' },
  { ico: 'mute', label: 'Stay quiet first', desc: 'Whoever talks first after the offer typically loses.' },
  { ico: 'package', label: 'Total comp matters', desc: 'Stock, bonus, learning budget — not just base.' },
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

  const sidebar = (
    <DashboardCard titleIcon="faders" title="Filters" contentClassName="space-y-4">
      <FormField label="Role">
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
      </FormField>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Experience</p>
        <div className="grid grid-cols-2 gap-2">
          {LEVELS.map((lv) => (
            <Button
              key={lv.id}
              type="button"
              variant={level === lv.id ? 'default' : 'outline'}
              size="sm"
              className="h-auto flex-col items-start px-2 py-2 text-left"
              onClick={() => setLevel(lv.id)}
            >
              <span className="text-sm font-semibold">{lv.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{lv.label}</span>
            </Button>
          ))}
        </div>
      </div>
      <FormField label="City">
        <Select value={city} onChange={(e) => setCity(e.target.value)}>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </FormField>
    </DashboardCard>
  )

  return (
    <ToolPage>
      <SectionHeader
        badge="Comp · India"
        badgeClassName="border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
        title="Know your worth before the offer call"
        accent="your worth"
        subtitle="Indicative annual compensation by role, experience, and city. Use these ranges as anchors when you negotiate — never a single number."
      />

      <ToolSidebarLayout sidebar={sidebar}>
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-emerald-500/10 py-0">
          <CardContent className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {role} · {LEVELS.find((l) => l.id === level)?.name} · {city}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-4xl font-black tabular-nums tracking-tight text-transparent sm:text-5xl">
                ₹{range[0]}–{range[1]}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">LPA</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Median benchmark: <span className="font-semibold text-foreground">₹{median} LPA</span>
            </p>
          </CardContent>
        </Card>

        <DashboardCard titleIcon="trend-up" title={`Trajectory in ${city}`} contentClassName="space-y-4">
          {allLevels.map((lv) => (
            <div key={lv.id} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm font-semibold">{lv.name}</span>
              <Progress
                value={Math.round((lv.high / maxHigh) * 100)}
                className="flex-1 gap-0 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-primary [&_[data-slot=progress-indicator]]:to-emerald-500 [&_[data-slot=progress-track]]:h-2"
              />
              <span className="w-24 shrink-0 text-right text-xs font-semibold tabular-nums">
                ₹{lv.low}–{lv.high}
              </span>
            </div>
          ))}
        </DashboardCard>

        <DashboardCard titleIcon="chat" title="Negotiation playbook" contentClassName="grid gap-3 sm:grid-cols-2">
          {NEGOTIATION_TIPS.map((t) => (
            <div key={t.label} className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-3">
              <AppIcon name={t.ico} className="size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </DashboardCard>
      </ToolSidebarLayout>
    </ToolPage>
  )
}
