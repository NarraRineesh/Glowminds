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

function ApplicationCard({ app, onStatusChange, onDelete }) {
  return (
    <div className="relative rounded-lg border border-border bg-muted/50 p-3 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <AppIcon name={app.logo || 'jobs'} className="size-3.5 shrink-0" />
            <span className="truncate">{app.company}</span>
          </div>
          <div className="text-sm font-medium text-muted-foreground">{app.role}</div>
          {app.salary && <div className="text-xs font-semibold text-emerald-500">{app.salary}</div>}
          <div className="text-xs text-muted-foreground">
            {app.appliedDate}{app.notes ? ` · ${app.notes}` : ''}
          </div>
          <div className="mt-1 text-[0.7rem] font-medium text-primary/80">
            Next: {NEXT_STEP[app.status] || 'Update status'}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(app.id, app.company)}
          aria-label={`Remove ${app.company}`}
        >
          <AppIcon name="x" className="size-4" />
        </Button>
      </div>
      <Select
        className="mt-2 w-full px-2 py-2 text-sm"
        value={app.status}
        onChange={(e) => onStatusChange(app.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Status for ${app.company}`}
      >
        {APPLICATION_STATUSES.map((c) => (
          <option key={c} value={c}>{APPLICATION_STATUS_LABEL[c]}</option>
        ))}
      </Select>
    </div>
  )
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
  const [activeStatus, setActiveStatus] = useState(APPLICATION_STATUS.APPLIED)

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
      setActiveStatus(form.status || APPLICATION_STATUS.APPLIED)
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

  const mobileItems = apps.filter((a) => a.status === activeStatus)

  return (
    <>
      <div className="min-w-0 space-y-4 sm:space-y-6">
        <div className="sticky top-14 z-20 -mx-1 flex flex-wrap items-center justify-between gap-2 bg-background/95 px-1 py-2 backdrop-blur sm:static sm:top-auto sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
          <PageTitle
            className="mb-0 max-sm:hidden"
            title="Application Tracker"
            subtitle={`Track every application · ${apps.length}${!isPro && appLimit >= 0 ? ` / ${appLimit}` : ''} total`}
          />
          <p className="m-0 text-sm font-semibold sm:hidden">
            {apps.length} application{apps.length === 1 ? '' : 's'}
          </p>
          <Button size="sm" className="min-h-10 sm:min-h-8" onClick={() => setModal(true)} disabled={atAppLimit}>
            + Add application
          </Button>
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
        ) : isLg ? (
          <div className="grid grid-cols-5 gap-4 [&>*]:min-h-0 [&>*]:min-w-0">
            {APPLICATION_STATUSES.map((col) => {
              const items = apps.filter((a) => a.status === col)
              const colStyle = COLUMN_STYLE[col]
              return (
                <Card key={col} className="flex min-h-[12rem] flex-col gap-0 py-0">
                  <CardHeader className="flex-row items-center justify-between space-y-0 border-b px-3 py-2.5">
                    <CardTitle className={cn('text-sm font-bold', colStyle.text)}>
                      {APPLICATION_STATUS_LABEL[col]}
                    </CardTitle>
                    <Badge variant="secondary" className={cn('text-xs tabular-nums', colStyle.badge)}>
                      {items.length}
                    </Badge>
                  </CardHeader>
                  <ScrollArea className="max-h-[min(420px,calc(100svh-16rem))] flex-1">
                    <CardContent className="space-y-2 p-2">
                      {items.map((a) => (
                        <ApplicationCard
                          key={a.id}
                          app={a}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                        />
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
        ) : (
          <div className="space-y-3">
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Application status">
              {APPLICATION_STATUSES.map((col) => {
                const count = apps.filter((a) => a.status === col).length
                const active = activeStatus === col
                const colStyle = COLUMN_STYLE[col]
                return (
                  <button
                    key={col}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveStatus(col)}
                    className={cn(
                      'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    <span className={active ? undefined : colStyle.text}>{APPLICATION_STATUS_LABEL[col]}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'h-5 min-w-5 justify-center px-1 text-[0.65rem] tabular-nums',
                        active ? 'bg-primary-foreground/20 text-primary-foreground' : colStyle.badge,
                      )}
                    >
                      {count}
                    </Badge>
                  </button>
                )
              })}
            </div>

            <div className="space-y-2">
              {mobileItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No applications in {APPLICATION_STATUS_LABEL[activeStatus]}.
                </div>
              ) : (
                mobileItems.map((a) => (
                  <ApplicationCard
                    key={a.id}
                    app={a}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))
              )}
              {activeStatus === APPLICATION_STATUS.APPLIED && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11 w-full border-dashed"
                  onClick={() => setModal(true)}
                >
                  + Add manually
                </Button>
              )}
            </div>
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
          <Input placeholder="Google, TCS, Infosys…" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </FormField>
        <FormRow>
          <FormField label="Job Role">
            <Input placeholder="Software Engineer" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {APPLICATION_STATUSES.map((c) => <option key={c} value={c}>{APPLICATION_STATUS_LABEL[c]}</option>)}
            </Select>
          </FormField>
        </FormRow>
        <FormRow>
          <FormField label="Date">
            <Input type="date" value={form.appliedDate} onChange={(e) => setForm({ ...form, appliedDate: e.target.value })} />
          </FormField>
          <FormField label="Salary">
            <Input placeholder="5–8 LPA" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          </FormField>
        </FormRow>
        <FormField label="Notes">
          <Textarea className="min-h-[56px]" placeholder="Recruiter name, next steps…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </FormField>
      </AppDialog>
    </>
  )
}
