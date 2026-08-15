import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminApi } from '@/services/adminApi'
import { Button, Input } from '@/components/ui'
import useAppStore from '@/store/authStore'
import { AdminKpi, AdminPageHeader, AdminPanel, AdminTableWrap, adminTableClass, adminTdClass, adminThClass } from './adminUi'

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
    <div className="space-y-5">
      <div>
        <Link to="/admin/users" className="text-xs text-muted-foreground no-underline hover:underline">← Users</Link>
        <AdminPageHeader
          title={user.displayName || user.email || user.uid}
          description={`${user.email || ''} · ${user.uid}`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminKpi
          label="Status"
          value={user.isPro ? 'Pro' : 'Free'}
          hint={`${user.subscription?.plan || '—'} · ends ${
            user.subscription?.endDate
              ? new Date(user.subscription.endDate).toLocaleDateString('en-IN')
              : '—'
          }`}
        />
        <AdminKpi
          label="Credits"
          value={user.credits?.balance ?? '—'}
          hint={`Used ${user.credits?.lifetimeUsed ?? 0} · Granted ${user.credits?.lifetimeGranted ?? 0}`}
        />
        <AdminKpi
          label="Token usage"
          value={(user.entitlements?.tokenUsage?.totalTokens ?? 0).toLocaleString('en-IN')}
          hint={`~$${Number(user.entitlements?.tokenUsage?.estimatedCostUsd || 0).toFixed(4)}`}
        />
      </div>

      <AdminPanel title="Pro activation">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => grantPro('yearly')}>Grant yearly</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => grantPro('monthly')}>
            Grant monthly
          </Button>
          <Button size="sm" variant="outline" disabled={busy || !user.isPro} onClick={revokePro}>
            Revoke Pro / Downgrade
          </Button>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Account"
        subtitle={`Auth status: ${user.auth?.disabled ? 'Disabled' : 'Active'}${user.isAdmin ? ' · Admin' : ''}`}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy || user.isAdmin}
            onClick={async () => {
              setBusy(true)
              try {
                setUser(await adminApi.setUserDisabled(uid, !user.auth?.disabled))
                addToast?.('success', user.auth?.disabled ? 'User enabled' : 'User disabled')
              } catch (err) {
                addToast?.('error', err.message)
              } finally {
                setBusy(false)
              }
            }}
          >
            {user.auth?.disabled ? 'Enable login' : 'Disable login'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || user.isAdmin}
            onClick={async () => {
              if (!window.confirm('Permanently delete this user?')) return
              setBusy(true)
              try {
                await adminApi.deleteUser(uid)
                addToast?.('success', 'User deleted')
                window.location.href = '/admin/users'
              } catch (err) {
                addToast?.('error', err.message)
                setBusy(false)
              }
            }}
          >
            Delete user
          </Button>
        </div>
      </AdminPanel>

      <AdminPanel title="Adjust credits">
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
      </AdminPanel>

      <AdminPanel title="Credit ledger">
        <AdminTableWrap className="-mx-4 -mb-4 rounded-none border-0 border-t">
          <table className={adminTableClass}>
            <thead>
              <tr>
                <th className={adminThClass}>When</th>
                <th className={adminThClass}>Feature</th>
                <th className={adminThClass}>Amount</th>
                <th className={adminThClass}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {(user.ledger || []).map((e) => (
                <tr key={e.id} className="hover:bg-muted/40">
                  <td className={`${adminTdClass} text-xs text-muted-foreground`}>
                    {e.createdAt?.toDate
                      ? e.createdAt.toDate().toLocaleString('en-IN')
                      : e.createdAt?._seconds
                        ? new Date(e.createdAt._seconds * 1000).toLocaleString('en-IN')
                        : '—'}
                  </td>
                  <td className={adminTdClass}>{e.featureKey}</td>
                  <td className={`${adminTdClass} tabular-nums`}>{e.amount}</td>
                  <td className={`${adminTdClass} tabular-nums`}>{e.balanceAfter}</td>
                </tr>
              ))}
              {(user.ledger || []).length === 0 && (
                <tr>
                  <td colSpan={4} className={`${adminTdClass} py-6 text-center text-muted-foreground`}>No ledger entries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </AdminTableWrap>
      </AdminPanel>
    </div>
  )
}
