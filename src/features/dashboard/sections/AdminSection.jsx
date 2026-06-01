import AppIcon from '@/components/icons/AppIcon'
import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import {
  Badge,
  Button,
  DashboardCard,
  FormField,
  Input,
  Textarea,
  cn,
} from '@/components/ui'
import useAppStore from '@/store/authStore'
import {
  getAdminOverview,
  searchAdminUsers,
  setUserProSubscription,
  getAdminPricingConfig,
  updateAdminPricingConfig,
} from '@/services/adminApi'
import usePricingStore from '@/store/pricingStore'
import { formatSubscriptionEndDate } from '@/constants/plans'

const BADGE_TONES = {
  gray: 'border-border bg-secondary text-muted-foreground',
  green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  red: 'border-destructive/20 bg-destructive/10 text-destructive',
  blue: 'border-primary/20 bg-primary/10 text-primary',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  purple: 'border-purple-600/20 bg-purple-600/10 text-purple-700 dark:text-purple-300',
}

function AdminBadge({ children, tone = 'gray' }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em]',
        BADGE_TONES[tone] || BADGE_TONES.gray,
      )}
    >
      {children}
    </Badge>
  )
}

function fmtNumber(n) {
  if (n === null || n === undefined) return '—'
  if (typeof n !== 'number') return String(n)
  if (Math.abs(n) >= 1000) return n.toLocaleString()
  return String(n)
}

// ----------------------------------------------------------------------
// Users & Pro management (temporary until Razorpay is live)
// ----------------------------------------------------------------------

function UsersProPanel({ addToast }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionUid, setActionUid] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (!debouncedQuery) {
      setUsers([])
      return undefined
    }

    let cancelled = false
    setLoading(true)
    searchAdminUsers({ q: debouncedQuery, limit: 20 })
      .then((r) => {
        if (!cancelled) setUsers(r.users || [])
      })
      .catch((e) => {
        if (!cancelled) {
          setUsers([])
          addToast?.('error', e?.message || 'User search failed')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, addToast])

  const onGrant = async (uid) => {
    setActionUid(uid)
    try {
      const r = await setUserProSubscription(uid, { action: 'grant', plan: 'yearly' })
      setUsers((list) => list.map((u) => (u.uid === uid ? r.user : u)))
      addToast?.('success', 'Pro granted (yearly)')
    } catch (e) {
      addToast?.('error', e?.message || 'Grant failed')
    } finally {
      setActionUid(null)
    }
  }

  const onRevoke = async (uid) => {
    if (!window.confirm('Revoke Pro for this user?')) return
    setActionUid(uid)
    try {
      const r = await setUserProSubscription(uid, { action: 'revoke' })
      setUsers((list) => list.map((u) => (u.uid === uid ? r.user : u)))
      addToast?.('success', 'Pro revoked')
    } catch (e) {
      addToast?.('error', e?.message || 'Revoke failed')
    } finally {
      setActionUid(null)
    }
  }

  const displayName = (u) =>
    u.displayName || [u.firstName, u.lastName].filter(Boolean).join(' ') || '—'

  return (
    <DashboardCard
      className="mb-6"
      title="Users & Pro"
      action={
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, name, or UID…"
          className="h-8 w-56 text-xs"
        />
      }
      contentClassName="p-0"
    >
      <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-[0.78rem] text-amber-800 dark:text-amber-200 sm:px-5">
        Temporary admin tool until Razorpay billing is fully live. Admins always have Pro access automatically.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[0.82rem]">
          <thead>
            <tr className="border-b border-border text-[0.66rem] uppercase tracking-[0.08em] text-muted-foreground">
              <th className="px-4 py-2 font-bold">User</th>
              <th className="px-2 py-2 font-bold">Plan</th>
              <th className="px-2 py-2 font-bold">Status</th>
              <th className="px-2 py-2 font-bold">Renews / ends</th>
              <th className="px-4 py-2 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!debouncedQuery && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Search by email, display name, or Firebase UID.
                </td>
              </tr>
            )}
            {debouncedQuery && loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Searching…
                </td>
              </tr>
            )}
            {debouncedQuery && !loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u) => {
              const sub = u.subscription || {}
              const busy = actionUid === u.uid
              return (
                <tr key={u.uid} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-foreground">{displayName(u)}</div>
                    <div className="text-[0.72rem] text-muted-foreground">{u.email || u.uid}</div>
                  </td>
                  <td className="px-2 py-2.5">
                    {u.isPro ? (
                      <AdminBadge tone="blue">{sub.plan || 'pro'}</AdminBadge>
                    ) : (
                      <AdminBadge tone="gray">free</AdminBadge>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    {u.isPro ? (
                      <AdminBadge tone="green">{sub.status || 'active'}</AdminBadge>
                    ) : (
                      <AdminBadge tone="gray">—</AdminBadge>
                    )}
                    {sub.source === 'admin_grant' && (
                      <span className="ml-1"><AdminBadge tone="amber">admin grant</AdminBadge></span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground">
                    {formatSubscriptionEndDate(sub) || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {u.isAdmin ? (
                        <AdminBadge tone="purple">admin · always Pro</AdminBadge>
                      ) : !u.isPro ? (
                        <Button
                          size="xs"
                          onClick={() => onGrant(u.uid)}
                          disabled={busy}
                        >
                          Grant Pro
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => onRevoke(u.uid)}
                          disabled={busy}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  )
}

// ----------------------------------------------------------------------
// Pricing config
// ----------------------------------------------------------------------

function paiseFromInr(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

function inrFromPaise(paise) {
  if (!Number.isFinite(paise)) return ''
  return String(Math.round(paise / 100))
}

function PricingPanel({ addToast }) {
  const pricingLoaded = usePricingStore((s) => s.loaded)
  const pricingConfig = usePricingStore((s) => s.config)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [yearlyInr, setYearlyInr] = useState('399')
  const [monthlyInr, setMonthlyInr] = useState('49')
  const [freeApplications, setFreeApplications] = useState('5')
  const [freeResumes, setFreeResumes] = useState('3')
  const [freeTemplate, setFreeTemplate] = useState('onyx')
  const [proTagline, setProTagline] = useState('')
  const [heroDescription, setHeroDescription] = useState('')
  const [billingBlurb, setBillingBlurb] = useState('')
  const [listsJson, setListsJson] = useState('')

  const hydrateForm = useCallback((config) => {
    setYearlyInr(inrFromPaise(config?.plans?.yearly?.amountPaise))
    setMonthlyInr(inrFromPaise(config?.plans?.monthly?.amountPaise))
    setFreeApplications(String(config?.freeLimits?.applications ?? 5))
    setFreeResumes(String(config?.freeLimits?.resumes ?? 3))
    setFreeTemplate(config?.freeLimits?.template || 'onyx')
    setProTagline(config?.marketing?.proTagline || '')
    setHeroDescription(config?.marketing?.heroDescription || '')
    setBillingBlurb(config?.marketing?.billingBlurb || '')
    setListsJson(JSON.stringify({
      freeFeatures: config?.freeFeatures || [],
      proFeatures: config?.proFeatures || [],
      pricingComparison: config?.pricingComparison || [],
      pricingFaqs: config?.pricingFaqs || [],
    }, null, 2))
  }, [])

  useEffect(() => {
    if (pricingLoaded) {
      hydrateForm(pricingConfig)
      setLoading(false)
    }
  }, [pricingLoaded, pricingConfig, hydrateForm])

  useEffect(() => {
    let cancelled = false
    if (!pricingLoaded) setLoading(true)
    getAdminPricingConfig()
      .then((r) => {
        if (!cancelled) {
          hydrateForm(r.config)
          setErr('')
        }
      })
      .catch((e) => {
        if (!cancelled) setErr(e?.message || 'Failed to load pricing config')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [hydrateForm, pricingLoaded])

  const onSave = async () => {
    setSaving(true)
    setErr('')
    try {
      const yearlyPaise = paiseFromInr(yearlyInr)
      const monthlyPaise = paiseFromInr(monthlyInr)
      if (!yearlyPaise || !monthlyPaise) {
        throw new Error('Yearly and monthly prices must be positive numbers (INR)')
      }

      let lists
      try {
        lists = JSON.parse(listsJson)
      } catch {
        throw new Error('Feature/comparison JSON is invalid')
      }

      const patch = {
        plans: {
          yearly: { amountPaise: yearlyPaise },
          monthly: { amountPaise: monthlyPaise },
        },
        freeLimits: {
          applications: Number(freeApplications),
          resumes: Number(freeResumes),
          template: freeTemplate.trim() || 'onyx',
        },
        marketing: {
          proTagline: proTagline.trim(),
          heroDescription: heroDescription.trim(),
          billingBlurb: billingBlurb.trim(),
        },
        freeFeatures: lists.freeFeatures,
        proFeatures: lists.proFeatures,
        pricingComparison: lists.pricingComparison,
        pricingFaqs: lists.pricingFaqs,
      }

      const r = await updateAdminPricingConfig(patch)
      usePricingStore.getState().setConfig(r.config)
      hydrateForm(r.config)
      addToast?.('success', 'Pricing updated')
    } catch (e) {
      setErr(e?.message || 'Save failed')
      addToast?.('error', e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardCard
      className="mb-6"
      title="Pricing"
      action={
        <Button size="sm" onClick={onSave} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save pricing'}
        </Button>
      }
      contentClassName="flex flex-col gap-4"
    >
      <p className="text-sm text-muted-foreground">
        Central pricing stored in Firestore <code className="rounded bg-muted px-1 text-xs">config/pricing</code>.
        Changes apply to marketing pages, billing UI, and Razorpay order amounts.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading pricing config…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Yearly price (INR)">
              <Input value={yearlyInr} onChange={(e) => setYearlyInr(e.target.value)} inputMode="numeric" />
            </FormField>
            <FormField label="Monthly price (INR)">
              <Input value={monthlyInr} onChange={(e) => setMonthlyInr(e.target.value)} inputMode="numeric" />
            </FormField>
            <FormField label="Free application slots">
              <Input value={freeApplications} onChange={(e) => setFreeApplications(e.target.value)} inputMode="numeric" />
            </FormField>
            <FormField label="Free resume limit">
              <Input value={freeResumes} onChange={(e) => setFreeResumes(e.target.value)} inputMode="numeric" />
            </FormField>
          </div>

          <FormField label="Free resume template id">
            <Input value={freeTemplate} onChange={(e) => setFreeTemplate(e.target.value)} placeholder="onyx" />
          </FormField>

          <FormField label="Pro card tagline">
            <Input value={proTagline} onChange={(e) => setProTagline(e.target.value)} />
          </FormField>
          <FormField label="Pricing hero description">
            <Textarea value={heroDescription} onChange={(e) => setHeroDescription(e.target.value)} rows={2} />
          </FormField>
          <FormField label="Billing blurb (settings page)">
            <Textarea value={billingBlurb} onChange={(e) => setBillingBlurb(e.target.value)} rows={2} />
          </FormField>

          <FormField
            label="Feature lists & comparison (JSON)"
            hint="Keys: freeFeatures, proFeatures, pricingComparison, pricingFaqs"
          >
            <Textarea
              value={listsJson}
              onChange={(e) => setListsJson(e.target.value)}
              rows={14}
              className="font-mono text-xs"
            />
          </FormField>
        </>
      )}

      {err && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}
    </DashboardCard>
  )
}

// ----------------------------------------------------------------------
// Main page
// ----------------------------------------------------------------------

export default function AdminSection() {
  const { user, addToast } = useAppStore()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.isAdmin) return
    setLoading(true)
    getAdminOverview()
      .then(setOverview)
      .catch((e) => console.warn('admin overview:', e))
      .finally(() => setLoading(false))
  }, [user?.isAdmin])

  if (!user) return null
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div>
      <SectionHeader
        badge="ADMIN"
        badgeClassName="border-purple-600/30 bg-purple-600 text-white"
        title="Admin Console"
        subtitle="Manage users, Pro access, and platform pricing."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 @sm/dashboard:grid-cols-2 @3xl/dashboard:grid-cols-2">
        {[
          { ic: 'users', lbl: 'Users', val: overview?.users?.total, sub: 'Signed up' },
          { ic: 'jobs', lbl: 'Active Jobs', val: overview?.jobs?.active, sub: 'On the job board' },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.lbl}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.04 }}
            className="rounded-2xl border border-border bg-background px-4 py-3"
          >
            <div className="mb-1"><AppIcon name={kpi.ic} className="size-5 text-primary" /></div>
            <div className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {kpi.lbl}
            </div>
            <div className="mt-0.5 text-[1.4rem] font-extrabold leading-tight text-foreground">
              {loading ? '…' : fmtNumber(kpi.val)}
            </div>
            <div className="mt-0.5 text-[0.72rem] text-muted-foreground">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      <UsersProPanel addToast={addToast} />
      <PricingPanel addToast={addToast} />
    </div>
  )
}
