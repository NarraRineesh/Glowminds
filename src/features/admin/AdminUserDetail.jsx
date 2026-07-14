import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminApi } from '@/services/adminApi'
import { Button, Input } from '@/components/ui'
import useAppStore from '@/store/authStore'

export default function AdminUserDetail() {
  const { uid } = useParams()
  const addToast = useAppStore((s) => s.addToast)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creditAmount, setCreditAmount] = useState('10')
  const [creditNote, setCreditNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setUser(await adminApi.user(uid))
    } catch (err) {
      addToast?.('error', err.message || 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [uid])

  async function grantPro(plan) {
    setBusy(true)
    try {
      setUser(await adminApi.grantPro(uid, { plan }))
      addToast?.('success', `Granted Pro (${plan})`)
    } catch (err) {
      addToast?.('error', err.message)
    } finally {
      setBusy(false)
    }
  }

  async function revokePro() {
    if (!window.confirm('Revoke Pro access immediately?')) return
    setBusy(true)
    try {
      setUser(await adminApi.revokePro(uid))
      addToast?.('success', 'Pro revoked')
    } catch (err) {
      addToast?.('error', err.message)
    } finally {
      setBusy(false)
    }
  }

  async function adjustCredits(sign) {
    const n = Math.abs(Number(creditAmount))
    if (!Number.isFinite(n) || n <= 0) {
      addToast?.('error', 'Enter a positive credit amount')
      return
    }
    setBusy(true)
    try {
      const res = await adminApi.adjustCredits(uid, sign * n, creditNote)
      setUser(res.user)
      addToast?.('success', `Credits updated (balance ${res.balanceAfter})`)
    } catch (err) {
      addToast?.('error', err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading && !user) {
    return <p className="text-sm text-muted-foreground">Loading user…</p>
  }
  if (!user) {
    return (
      <div>
        <p className="text-sm text-destructive">User not found.</p>
        <Link to="/admin/users" className="text-sm underline">Back</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/users" className="text-xs text-muted-foreground hover:underline">← Users</Link>
        <h1 className="mt-1 text-xl font-semibold">{user.displayName || user.email || user.uid}</h1>
        <p className="text-sm text-muted-foreground">{user.email} · {user.uid}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-background p-4 text-sm">
          <p className="text-xs uppercase text-muted-foreground">Status</p>
          <p className="mt-1 font-medium">{user.isPro ? 'Pro' : 'Free'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {user.subscription?.plan || '—'} · ends{' '}
            {user.subscription?.endDate
              ? new Date(user.subscription.endDate).toLocaleDateString('en-IN')
              : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-border/70 bg-background p-4 text-sm">
          <p className="text-xs uppercase text-muted-foreground">Credits</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{user.credits?.balance ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Used {user.credits?.lifetimeUsed ?? 0} · Granted {user.credits?.lifetimeGranted ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border/70 bg-background p-4 text-sm">
          <p className="text-xs uppercase text-muted-foreground">Token usage</p>
          <p className="mt-1 font-medium tabular-nums">
            {(user.entitlements?.tokenUsage?.totalTokens ?? 0).toLocaleString('en-IN')} tokens
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ~${Number(user.entitlements?.tokenUsage?.estimatedCostUsd || 0).toFixed(4)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-background p-4 space-y-3">
        <h2 className="text-sm font-semibold">Pro activation</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => grantPro('yearly')}>Grant yearly</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => grantPro('monthly')}>
            Grant monthly
          </Button>
          <Button size="sm" variant="outline" disabled={busy || !user.isPro} onClick={revokePro}>
            Revoke Pro
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-background p-4 space-y-3">
        <h2 className="text-sm font-semibold">Adjust credits</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Amount</label>
            <Input
              className="w-28"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Note</label>
            <Input value={creditNote} onChange={(e) => setCreditNote(e.target.value)} placeholder="Optional" />
          </div>
          <Button size="sm" disabled={busy} onClick={() => adjustCredits(1)}>Grant</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => adjustCredits(-1)}>
            Debit
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-background overflow-hidden">
        <div className="border-b border-border/60 px-4 py-2 text-sm font-semibold">Credit ledger</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Feature</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {(user.ledger || []).map((e) => (
                <tr key={e.id} className="border-t border-border/40">
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {e.createdAt?.toDate
                      ? e.createdAt.toDate().toLocaleString('en-IN')
                      : e.createdAt?._seconds
                        ? new Date(e.createdAt._seconds * 1000).toLocaleString('en-IN')
                        : '—'}
                  </td>
                  <td className="px-3 py-2">{e.featureKey}</td>
                  <td className="px-3 py-2 tabular-nums">{e.amount}</td>
                  <td className="px-3 py-2 tabular-nums">{e.balanceAfter}</td>
                </tr>
              ))}
              {(user.ledger || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No ledger entries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
