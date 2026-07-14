import { useCallback, useEffect, useMemo, useState } from 'react'
import SectionHeader from '@/components/dashboard/SectionHeader'
import ProUpgradeInline from '@/components/ProUpgradeInline'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import AppIcon from '@/components/icons/AppIcon'
import Loader from '@/components/Loader'
import { Button, Card, CardContent, DashboardCard, FormField, Input, Progress, Select, cn } from '@/components/ui'
import useProfileStore from '@/store/profileStore'
import useAppStore from '@/store/authStore'
import useEntitlements from '@/hooks/useEntitlements'
import { apiFetch } from '@/services/apiClient'
import { isProUpgradeRequired } from '@/utils/proErrors'
import {
  compareExpectedToRange,
  mapCareerLevelToSalary,
  matchSalaryCity,
  matchSalaryRole,
  parseExpectedCtcLpa,
} from '@/utils/salaryInsights'

export default function SalaryInsightsSection() {
  const addToast = useAppStore((s) => s.addToast)
  const { isPro, loading: entLoading, credits, creditCosts, refresh } = useEntitlements()
  const loadProfile = useProfileStore((s) => s.load)
  const profile = useProfileStore((s) => s.profile)
  const negotiateCost = creditCosts?.salaryNegotiate ?? 2
  const canNegotiate = typeof credits?.balance !== 'number' || credits.balance >= negotiateCost

  const [data, setData] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [needsPro, setNeedsPro] = useState(false)
  const [negotiateLoading, setNegotiateLoading] = useState(false)
  const [negotiateResult, setNegotiateResult] = useState(null)
  const [companyAsk, setCompanyAsk] = useState('')

  const [role, setRole] = useState('')
  const [level, setLevel] = useState('junior')
  const [city, setCity] = useState('Bangalore')
  const [prefilled, setPrefilled] = useState(false)

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNeedsPro(false)
    try {
      await loadProfile().catch(() => {})
      if (isPro) {
        const payload = await apiFetch('/salary/insights', { method: 'GET' })
        setData(payload)
        setPreview(null)
      } else {
        const payload = await apiFetch('/salary/preview', { method: 'GET' })
        setPreview(payload)
        setData(null)
        setNeedsPro(true)
      }
    } catch (err) {
      if (isProUpgradeRequired(err)) {
        setNeedsPro(true)
        setData(null)
        try {
          const payload = await apiFetch('/salary/preview', { method: 'GET' })
          setPreview(payload)
          setError(null)
        } catch (previewErr) {
          setError(previewErr)
        }
      } else {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [isPro, loadProfile])

  useEffect(() => {
    // Wait for entitlements so we don't fetch /preview for Pro users by mistake.
    if (entLoading) return
    void fetchInsights()
  }, [entLoading, fetchInsights])

  const roles = useMemo(
    () => (data ? Object.keys(data.table || {}) : preview?.roles || []),
    [data, preview],
  )
  const cities = useMemo(
    () => (data ? Object.keys(data.cityMultiplier || {}) : preview?.cities || []),
    [data, preview],
  )
  const levels = data?.levels || preview?.levels || []
  const tips = data?.tips || []
  const lockedPreview = needsPro && !data

  useEffect(() => {
    if (prefilled || !roles.length) return
    // Free preview only shows the teaser combo unlocked — keep that selection.
    if (lockedPreview && preview?.teaser) {
      setRole(preview.teaser.role)
      setLevel(preview.teaser.level)
      setCity(preview.teaser.city)
      setPrefilled(true)
      return
    }
    const prefs = profile?.preferences || {}
    const matchedRole = matchSalaryRole(
      roles,
      profile?.headline,
      prefs.jobType,
      profile?.experience?.[0]?.role,
    )
    const matchedLevel = mapCareerLevelToSalary(profile?.careerLevel) || 'junior'
    const matchedCity = matchSalaryCity(
      cities,
      prefs.preferredLocations?.[0],
      profile?.personal?.location,
    )
    if (matchedRole) setRole(matchedRole)
    else if (!role) setRole(roles[0])
    setLevel(matchedLevel)
    setCity(matchedCity)
    setPrefilled(true)
  }, [roles, cities, profile, prefilled, role, lockedPreview, preview])

  useEffect(() => {
    if (roles.length && role && !roles.includes(role)) setRole(roles[0])
  }, [roles, role])

  const range = useMemo(() => {
    if (data?.table && role && data.table[role]?.[level]) {
      const base = data.table[role][level]
      const mul = data.cityMultiplier?.[city] || 1
      return [Math.round(base[0] * mul * 10) / 10, Math.round(base[1] * mul * 10) / 10]
    }
    if (preview?.teaser && role === preview.teaser.role && level === preview.teaser.level && city === preview.teaser.city) {
      return preview.teaser.range
    }
    return null
  }, [data, preview, role, level, city])

  const median = range ? ((range[0] + range[1]) / 2).toFixed(1) : null

  const expectedRaw = profile?.preferences?.expectedCTC || ''
  const expectedLpa = useMemo(() => parseExpectedCtcLpa(expectedRaw), [expectedRaw])
  const vsExpected = useMemo(
    () => (range && expectedLpa != null ? compareExpectedToRange(expectedLpa, range) : null),
    [range, expectedLpa],
  )

  const allLevels = useMemo(
    () =>
      levels.map((lv) => {
        const b = data?.table?.[role]?.[lv.id]
        if (!b) return { ...lv, low: 0, high: 0, locked: true }
        const mul = data.cityMultiplier?.[city] || 1
        return {
          ...lv,
          low: Math.round(b[0] * mul * 10) / 10,
          high: Math.round(b[1] * mul * 10) / 10,
          locked: false,
        }
      }),
    [data, role, city, levels],
  )
  const maxHigh = Math.max(...allLevels.map((l) => l.high), 1)

  if (loading) {
    return <Loader variant="section" label="Loading salary insights…" />
  }

  if (error && !preview && !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-destructive">{error.message || 'Could not load salary insights.'}</p>
        <Button size="sm" variant="outline" onClick={() => void fetchInsights()}>Retry</Button>
      </div>
    )
  }

  const sidebar = (
    <DashboardCard titleIcon="faders" title="Filters" contentClassName="space-y-4">
      {prefilled && (profile?.headline || profile?.preferences?.expectedCTC) ? (
        <p className="rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-2 text-xs text-muted-foreground">
          Prefilling from your profile
          {profile?.preferences?.expectedCTC
            ? ` · expected ${profile.preferences.expectedCTC}`
            : ''}
        </p>
      ) : null}
      <FormField label="Role">
        <Select value={role} onChange={(e) => setRole(e.target.value)} disabled={!roles.length}>
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
        <Select value={city} onChange={(e) => setCity(e.target.value)} disabled={!cities.length}>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </FormField>
    </DashboardCard>
  )

  const runNegotiate = async () => {
    if (!range || !isPro) return
    setNegotiateLoading(true)
    try {
      const payload = await apiFetch('/ai/salary-negotiate', {
        body: {
          role,
          city,
          level,
          marketRange: range,
          expectedCtc: expectedRaw || '',
          company: companyAsk.trim(),
        },
      })
      setNegotiateResult(payload)
      await refresh({ force: true })
      addToast('success', 'Negotiation script ready')
    } catch (err) {
      addToast('error', err.message || 'Could not generate negotiation script')
    }
    setNegotiateLoading(false)
  }

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
              {role || '—'} · {levels.find((l) => l.id === level)?.name || level} · {city}
            </p>
            {range ? (
              <>
                <p className="mt-2 text-3xl font-black tabular-nums text-foreground sm:text-4xl">
                  ₹{range[0]}–{range[1]} <span className="text-lg font-bold text-muted-foreground">LPA</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Median estimate: ₹{median} LPA</p>
              </>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-2xl font-black text-muted-foreground/40 blur-[2px] select-none">₹??–?? LPA</p>
                <p className="text-sm text-muted-foreground">
                  Full ranges for all role × city combinations unlock with Pro.
                </p>
              </div>
            )}
            {lockedPreview && preview?.teaser && range ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Free preview of {preview.teaser.role} · {preview.teaser.city}. Change filters to see what Pro unlocks.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {vsExpected && range ? (
          <DashboardCard titleIcon="target" title="Your expected CTC vs market" contentClassName="space-y-2">
            <p className="text-sm">
              <span className="font-semibold text-foreground">{expectedRaw}</span>
              <span className="text-muted-foreground">
                {' '}(~₹{expectedLpa} LPA) · {vsExpected.label}
              </span>
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">{vsExpected.hint}</p>
            <div className="relative mt-2 h-2 rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/70"
                style={{ width: '100%' }}
              />
              <div
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow"
                style={{
                  left: `${Math.min(100, Math.max(0, ((expectedLpa - range[0]) / Math.max(range[1] - range[0], 0.1)) * 100))}%`,
                }}
                title={`₹${expectedLpa} LPA`}
              />
            </div>
            <div className="flex justify-between text-[0.65rem] text-muted-foreground">
              <span>₹{range[0]}</span>
              <span>₹{range[1]} LPA</span>
            </div>
          </DashboardCard>
        ) : !expectedRaw ? (
          <p className="text-xs text-muted-foreground">
            Tip: set Expected CTC in your Profile to compare your ask against this band.
          </p>
        ) : null}

        {data ? (
          <>
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

            <DashboardCard
              titleIcon="sparkle"
              title="AI negotiation script"
              action={(
                <Button
                  size="sm"
                  disabled={negotiateLoading || !range || !canNegotiate}
                  onClick={() => void runNegotiate()}
                >
                  {negotiateLoading ? 'Drafting…' : `Generate (${negotiateCost})`}
                </Button>
              )}
              contentClassName="space-y-3"
            >
              <FormField label="Company (optional)">
                <Input
                  value={companyAsk}
                  onChange={(e) => setCompanyAsk(e.target.value)}
                  placeholder="e.g. Flipkart"
                />
              </FormField>
              {negotiateResult ? (
                <div className="space-y-3 text-sm">
                  <p className="font-semibold text-foreground">
                    Ask ₹{negotiateResult.targetAsk} LPA
                    <span className="font-normal text-muted-foreground">
                      {' '}(anchor ₹{negotiateResult.anchorLow}–{negotiateResult.anchorHigh})
                    </span>
                  </p>
                  <pre className="whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-3 font-sans text-sm">
                    {negotiateResult.script}
                  </pre>
                  {negotiateResult.email ? (
                    <pre className="whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-3 font-sans text-sm">
                      {negotiateResult.email}
                    </pre>
                  ) : null}
                  {negotiateResult.tips?.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {negotiateResult.tips.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        [negotiateResult.script, negotiateResult.email].filter(Boolean).join('\n\n'),
                      )
                      addToast('success', 'Copied')
                    }}
                  >
                    Copy script
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Generate a spoken script + email using this band and your expected CTC.
                </p>
              )}
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
          </>
        ) : (
          <ProUpgradeInline
            message="Upgrade to Glowminds Pro for full salary tables across roles and cities, plus negotiation tips."
            className="min-h-[12rem] rounded-2xl border border-border bg-muted/20"
          />
        )}
      </ToolSidebarLayout>
    </ToolPage>
  )
}
