import { useEffect, useMemo, useState } from 'react'
import SectionHeader from '@/components/dashboard/SectionHeader'
import ProUpgradeInline from '@/components/ProUpgradeInline'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import Loader from '@/components/Loader'
import { Button, Card, CardContent, DashboardCard, FormField, Progress, Select, cn } from '@/components/ui'
import { apiFetch } from '@/services/apiClient'
import { isProUpgradeRequired } from '@/utils/proErrors'

export default function SalaryInsightsSection() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiFetch('/salary/insights', { method: 'GET' })
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const roles = useMemo(() => Object.keys(data?.table || {}), [data?.table])
  const cities = useMemo(() => Object.keys(data?.cityMultiplier || {}), [data?.cityMultiplier])
  const levels = data?.levels || []
  const tips = data?.tips || []

  const [role, setRole] = useState('')
  const [level, setLevel] = useState('junior')
  const [city, setCity] = useState('Bangalore')

  useEffect(() => {
    if (roles.length && !role) setRole(roles[0])
  }, [roles, role])

  const range = useMemo(() => {
    if (!data?.table || !role || !data.table[role]?.[level]) return [0, 0]
    const base = data.table[role][level]
    const mul = data.cityMultiplier?.[city] || 1
    return [Math.round(base[0] * mul * 10) / 10, Math.round(base[1] * mul * 10) / 10]
  }, [data, role, level, city])

  const median = ((range[0] + range[1]) / 2).toFixed(1)

  const allLevels = useMemo(
    () =>
      levels.map((lv) => {
        const b = data?.table?.[role]?.[lv.id]
        if (!b) return { ...lv, low: 0, high: 0 }
        const mul = data.cityMultiplier?.[city] || 1
        return { ...lv, low: Math.round(b[0] * mul * 10) / 10, high: Math.round(b[1] * mul * 10) / 10 }
      }),
    [data, role, city, levels],
  )
  const maxHigh = Math.max(...allLevels.map((l) => l.high), 1)

  if (loading) {
    return <Loader variant="section" label="Loading salary insights…" />
  }

  if (error) {
    if (isProUpgradeRequired(error)) {
      return <ProUpgradeInline message={error.message} className="min-h-[min(28rem,70vh)]" />
    }
    return (
      <div className="py-12 text-center text-sm text-destructive">
        {error.message || 'Could not load salary insights.'}
      </div>
    )
  }

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
          {levels.map((lv) => (
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
              {role} · {levels.find((l) => l.id === level)?.name} · {city}
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-foreground sm:text-4xl">
              ₹{range[0]}–{range[1]} <span className="text-lg font-bold text-muted-foreground">LPA</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Median estimate: ₹{median} LPA</p>
          </CardContent>
        </Card>

        <DashboardCard titleIcon="chart" title="By experience level" contentClassName="space-y-3">
          {allLevels.map((lv) => (
            <div key={lv.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={cn('font-semibold', level === lv.id && 'text-primary')}>{lv.name}</span>
                <span className="tabular-nums text-muted-foreground">₹{lv.low}–{lv.high} LPA</span>
              </div>
              <Progress value={(lv.high / maxHigh) * 100} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
            </div>
          ))}
        </DashboardCard>

        <DashboardCard titleIcon="lightbulb" title="Negotiation tips">
          <ul className="grid gap-3 sm:grid-cols-2">
            {tips.map((tip) => (
              <li key={tip.label} className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <AppIcon name={tip.ico} className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{tip.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{tip.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </ToolSidebarLayout>
    </ToolPage>
  )
}
