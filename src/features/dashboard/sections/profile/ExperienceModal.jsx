import { useEffect, useState } from 'react'
import {
  createEmptyExperienceEntry,
  finalizeExperienceEntry,
} from '@/utils/experienceEntries'
import {
  AppDialog,
  Button,
  FormField,
  FormRow,
  Input,
  Textarea,
  Label,
} from '@/components/ui'

export default function ExperienceModal({
  open,
  entry,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(createEmptyExperienceEntry())
  const [currentRole, setCurrentRole] = useState(false)

  useEffect(() => {
    if (!open) return
    const base = entry ? { ...createEmptyExperienceEntry(), ...entry } : createEmptyExperienceEntry()
    setForm(base)
    setCurrentRole(!base.endDate)
  }, [open, entry])

  const isEdit = !!(entry?.company || entry?.role)

  const validate = () => {
    if (!form.company?.trim()) return 'Please enter company name'
    if (!form.role?.trim()) return 'Please enter your role / title'
    return null
  }

  const handleSave = () => {
    const err = validate()
    if (err) {
      window.alert(err)
      return
    }
    onSave?.(finalizeExperienceEntry({
      ...form,
      endDate: currentRole ? '' : form.endDate,
    }))
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => !v && onClose?.()}
      title={`${isEdit ? 'Edit Experience' : 'Add Experience'}`}
      size="lg"
      contentClassName="max-h-[min(70vh,520px)] overflow-auto"
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose?.()}>Cancel</Button>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
        Employment
      </div>

      <FormField label="Company *">
        <Input
          placeholder="Google, TCS, Startup…"
          value={form.company || ''}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />
      </FormField>

      <FormField label="Role / Title *">
        <Input
          placeholder="Software Engineer, Product Manager…"
          value={form.role || ''}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        />
      </FormField>

      <FormRow>
        <FormField label="Start date">
          <Input
            type="date"
            value={form.startDate || ''}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </FormField>
        <FormField label="End date">
          <Input
            type="date"
            value={form.endDate || ''}
            disabled={currentRole}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </FormField>
      </FormRow>

      <FormField>
        <Label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentRole}
            onChange={(e) => {
              setCurrentRole(e.target.checked)
              if (e.target.checked) setForm((f) => ({ ...f, endDate: '' }))
            }}
          />
          <span>I currently work here</span>
        </Label>
      </FormField>

      <FormField label="Description">
        <Textarea
          className="min-h-[72px]"
          placeholder="Your role, team, and impact in a few sentences…"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormField>

      <FormField label="Key achievements">
        <Textarea
          className="min-h-[60px]"
          placeholder={'• Built REST APIs\n• Improved performance by 30%'}
          value={form.bullets || ''}
          onChange={(e) => setForm({ ...form, bullets: e.target.value })}
        />
      </FormField>
    </AppDialog>
  )
}
