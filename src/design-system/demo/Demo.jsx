import { useState } from 'react'
import useTheme from '@/hooks/useTheme'
import { FREE_LIMITS, PLANS } from '@/constants/plans'
import {
  Button,
  Card,
  CreditIndicator,
  Dialog,
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  PageLayout,
  PlanIndicator,
  SelectField,
  SkeletonLines,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextAreaField,
  TextField,
  notify,
} from '@/design-system'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
]

export default function Demo() {
  const { theme, toggleTheme } = useTheme()
  const [filter, setFilter] = useState('all')
  const [role, setRole] = useState('')
  const [roleError, setRoleError] = useState('')
  const [tone, setTone] = useState('direct')
  const [notes, setNotes] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showError, setShowError] = useState(true)

  function saveRole(event) {
    event.preventDefault()
    if (!role.trim()) {
      setRoleError('Role is required')
      return
    }
    setRoleError('')
    notify({ type: 'success', title: 'Role saved', description: role.trim() })
  }

  return (
    <PageLayout width="md">
      <div className="flex flex-col gap-[var(--space-6)]">
        <PageHeader
          title="Design system"
          description="Shared tokens and components. Product routes are unchanged. Plan figures below are the current Free and Pro constants."
          actions={
            <Button type="button" variant="outline" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </Button>
          }
        />

        <div className="flex flex-wrap gap-[var(--space-2)]">
          <PlanIndicator name="Free" detail={`${FREE_LIMITS.aiCredits} credits / month`} />
          <PlanIndicator
            name={PLANS.monthly.label}
            detail={`${PLANS.monthly.displayPrice}${PLANS.monthly.period}`}
          />
          <CreditIndicator balance={FREE_LIMITS.aiCredits} label="Free credits" />
        </div>

        <section className="flex flex-col gap-[var(--space-3)]">
          <h2 className="m-0 text-[length:var(--font-size-sm)] font-semibold">Actions</h2>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            <Button type="button" onClick={() => notify({ title: 'Noted' })}>
              Primary
            </Button>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(true)}>
              Open dialog
            </Button>
            <Button type="button" variant="ghost" onClick={() => notify({ type: 'error', title: 'Could not save' })}>
              Ghost
            </Button>
          </div>
        </section>

        <FilterBar label="Status" options={FILTERS} value={filter} onChange={setFilter} />

        <Tabs defaultValue="write">
          <TabsList>
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="pt-[var(--space-4)]">
            <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--leading-body)] text-muted-foreground">
              Underline tabs. Arrow keys move between them.
            </p>
          </TabsContent>
          <TabsContent value="review" className="pt-[var(--space-4)]">
            <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--leading-body)] text-muted-foreground">
              Second panel. No card grid.
            </p>
          </TabsContent>
        </Tabs>

        <Card title="Profile fields" description="Labels, hints, and errors are wired to the controls.">
          <form className="flex flex-col gap-[var(--space-4)]" onSubmit={saveRole} noValidate>
            <TextField
              label="Target role"
              name="role"
              value={role}
              hint="Used by job search and the coach."
              error={roleError}
              onChange={(event) => {
                setRole(event.target.value)
                if (roleError) setRoleError('')
              }}
              autoComplete="organization-title"
            />
            <SelectField label="Tone" name="tone" value={tone} onChange={(event) => setTone(event.target.value)}>
              <option value="direct">Direct</option>
              <option value="formal">Formal</option>
              <option value="warm">Warm</option>
            </SelectField>
            <TextAreaField
              label="Notes"
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <div>
              <Button type="submit">Save role</Button>
            </div>
          </form>
        </Card>

        <EmptyState
          icon="folder"
          title="Nothing filed yet"
          description="Empty states stay left-aligned and use one Phosphor icon."
          action={
            <Button type="button" variant="outline" onClick={() => notify({ title: 'Add is not wired on this page' })}>
              Add item
            </Button>
          }
        />

        {showError ? (
          <ErrorState
            title="Could not load this section"
            message="The retry button clears the alert. No request is sent."
            action={
              <Button type="button" variant="outline" onClick={() => setShowError(false)}>
                Retry
              </Button>
            }
          />
        ) : (
          <p className="m-0 text-[length:var(--font-size-sm)] text-muted-foreground">Error dismissed.</p>
        )}

        <section className="flex flex-col gap-[var(--space-3)]" aria-labelledby="skeleton-heading">
          <h2 id="skeleton-heading" className="m-0 text-[length:var(--font-size-sm)] font-semibold">
            Loading
          </h2>
          <SkeletonLines lines={3} label="Loading section" />
        </section>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Confirm"
        description="Dialogs keep a title, a description, and the shared focus trap."
        footer={
          <Button type="button" onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="m-0 text-[length:var(--font-size-sm)] text-muted-foreground">
          Overlay shadow uses the overlay token. The panel itself is a flat border.
        </p>
      </Dialog>
    </PageLayout>
  )
}
