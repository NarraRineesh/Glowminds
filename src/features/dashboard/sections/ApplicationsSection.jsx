import { useState, useEffect } from 'react'
import useAppStore from '@/store/authStore'
import useIsLg from '@/hooks/useIsLg'
import useTrackerStore from '@/store/trackerStore'
import useEntitlements from '@/hooks/useEntitlements'
import Loader from '@/components/Loader'
import {
  AppIcon,
  AppDialog,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormRow,
  Input,
  PageTitle,
  ScrollArea,
  Select,
  Textarea,
  cn,
} from '@/components/ui'
import {
  APPLICATION_STATUS,
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABEL,
} from '@/constants/schema'

const COLUMN_STYLE = {
  [APPLICATION_STATUS.APPLIED]: { text: 'text-primary', badge: 'bg-primary/20 text-primary' },
  [APPLICATION_STATUS.IN_REVIEW]: { text: 'text-amber-500', badge: 'bg-amber-500/20 text-amber-500' },
  [APPLICATION_STATUS.INTERVIEW]: { text: 'text-purple-500', badge: 'bg-purple-500/20 text-purple-500' },
  [APPLICATION_STATUS.OFFER]: { text: 'text-emerald-500', badge: 'bg-emerald-500/20 text-emerald-500' },
  [APPLICATION_STATUS.REJECTED]: { text: 'text-destructive', badge: 'bg-destructive/20 text-destructive' },
}

const NEXT_STEP = {
  [APPLICATION_STATUS.APPLIED]: 'Follow up in 5–7 days',
  [APPLICATION_STATUS.IN_REVIEW]: 'Prep talking points',
  [APPLICATION_STATUS.INTERVIEW]: 'Practice mock interview',
  [APPLICATION_STATUS.OFFER]: 'Review & negotiate',
  [APPLICATION_STATUS.REJECTED]: 'Note lessons learned',
}


const EMPTY_FORM = {
  company: '',
  role: '',
  status: APPLICATION_STATUS.APPLIED,
  appliedDate: '',
  salary: '',
  notes: '',
}

export default function ApplicationsSection() {
  const { addToast } = useAppStore()
  const { apps, loading, addApp, updateStatus, deleteApp, loadApps } = useTrackerStore()
  const { isPro, freeLimits, loading: entitlementsLoading } = useEntitlements()
  const appLimit = isPro ? -1 : (freeLimits?.applications ?? 10)
  const atAppLimit = !isPro && appLimit >= 0 && apps.length >= appLimit
  const isLg = useIsLg()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { loadApps() }, [loadApps])

  const handleAdd = async () => {
    if (!form.company || !form.role) { addToast('error', 'Company and role required'); return }
    if (atAppLimit) {
      addToast('error', `Free plan allows up to ${appLimit} applications. Upgrade to Pro for unlimited tracking.`)
      return
    }
    try {
      const application = await addApp({
        company: form.company,
        role: form.role,
        status: form.status,
        appliedDate: form.appliedDate || new Date().toISOString().split('T')[0],
        salary: form.salary,
        notes: form.notes,
        logo: 'jobs',
      })
      if (application) addToast('success', `${form.role} at ${form.company} tracked!`)
      setModal(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      addToast('error', err?.message || 'Could not add application. Please try again.')
    }
  }

  const handleStatusChange = async (appId, newStatus) => {
    await updateStatus(appId, newStatus)
    addToast('info', `Status updated to ${APPLICATION_STATUS_LABEL[newStatus] || newStatus}`)
  }

  const handleDelete = async (appId, company) => {
    await deleteApp(appId)
    addToast('info', `${company} removed from tracker`)
  }

  return (
    <>
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <PageTitle
            className="mb-0"
            title="Application Tracker"
            subtitle={`Track every application · Kanban board · ${apps.length}${!isPro && appLimit >= 0 ? ` / ${appLimit}` : ''} total`}
          />
          <Button size="sm" onClick={() => setModal(true)} disabled={atAppLimit}>+ Add application</Button>
        </div>

        {!entitlementsLoading && atAppLimit && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground">
            You&apos;ve reached the free plan limit of {appLimit} tracked applications.{' '}
            <button type="button" className="font-semibold text-primary underline-offset-2 hover:underline" onClick={() => { window.location.href = '/pricing' }}>
              Upgrade to Pro
            </button>
            {' '}for unlimited tracking.
          </div>
        )}

        {loading ? (
          <Loader variant="section" label="Loading your applications…" />
        ) : (
          <div
            className={cn(
              'grid gap-4 [&>*]:min-h-0 [&>*]:min-w-0',
              isLg ? 'grid-cols-5' : 'grid-cols-1',
            )}
          >
            {APPLICATION_STATUSES.map(col => {
              const items = apps.filter(a => a.status === col)
              const colStyle = COLUMN_STYLE[col]
              return (
                <Card key={col} className={cn('flex flex-col gap-0 py-0', isLg && 'min-h-[12rem]')}>
                  <CardHeader className="flex-row items-center justify-between space-y-0 border-b px-3 py-2.5">
                    <CardTitle className={cn('text-sm font-bold', colStyle.text)}>
                      {APPLICATION_STATUS_LABEL[col]}
                    </CardTitle>
                    <Badge variant="secondary" className={cn('text-xs tabular-nums', colStyle.badge)}>
                      {items.length}
                    </Badge>
                  </CardHeader>
                  <ScrollArea className={cn(isLg && 'max-h-[min(420px,calc(100svh-16rem))] flex-1')}>
                    <CardContent className="space-y-2 p-2">
                      {items.map((a) => (
                        <div
                          key={a.id}
                          className="relative rounded-lg border border-border bg-muted/50 p-2.5 transition-colors hover:border-primary/30"
                        >
                          <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                            <AppIcon name={a.logo || 'jobs'} className="size-3.5 shrink-0" />
                            <span className="truncate">{a.company}</span>
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">{a.role}</div>
                          {a.salary && <div className="text-xs font-semibold text-emerald-500">{a.salary}</div>}
                          <div className="text-xs text-muted-foreground">
                            {a.appliedDate}{a.notes ? ` · ${a.notes}` : ''}
                          </div>
                          <div className="mt-1 text-[0.7rem] font-medium text-primary/80">
                            Next: {NEXT_STEP[a.status] || 'Update status'}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Select
                              className="flex-1 px-1.5 py-0.5 text-xs"
                              value={a.status}
                              onChange={(e) => handleStatusChange(a.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {APPLICATION_STATUSES.map(c => <option key={c} value={c}>{APPLICATION_STATUS_LABEL[c]}</option>)}
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(a.id, a.company)}
                              aria-label={`Remove ${a.company}`}
                            >
                              <AppIcon name="x" className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {col === APPLICATION_STATUS.APPLIED && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed"
                          onClick={() => setModal(true)}
                        >
                          + Add manually
                        </Button>
                      )}
                    </CardContent>
                  </ScrollArea>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <AppDialog
        open={modal}
        onOpenChange={setModal}
        title="Track Application"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Application</Button>
          </>
        }
      >
        <FormField label="Company Name">
          <Input placeholder="Google, TCS, Infosys…" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
        </FormField>
        <FormRow>
          <FormField label="Job Role">
            <Input placeholder="Software Engineer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {APPLICATION_STATUSES.map(c => <option key={c} value={c}>{APPLICATION_STATUS_LABEL[c]}</option>)}
            </Select>
          </FormField>
        </FormRow>
        <FormRow>
          <FormField label="Date">
            <Input type="date" value={form.appliedDate} onChange={e => setForm({ ...form, appliedDate: e.target.value })} />
          </FormField>
          <FormField label="Salary">
            <Input placeholder="5–8 LPA" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
          </FormField>
        </FormRow>
        <FormField label="Notes">
          <Textarea className="min-h-[56px]" placeholder="Recruiter name, next steps…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </FormField>
      </AppDialog>
    </>
  )
}
