import { useEffect, useState } from 'react'
import {
  createEmptyInternshipEntry,
  finalizeInternshipEntry,
} from '@/utils/internshipEntries'
import {
  AppDialog,
  Button,
  FormField,
  FormRow,
  Input,
  Textarea,
  Label,
} from '@/components/ui'

export default function InternshipModal({ open, entry, saving, onClose, onSave }) {
  const [form, setForm] = useState(createEmptyInternshipEntry())
  const [currentRole, setCurrentRole] = useState(false)

  useEffect(() => {
    if (!open) return
    const base = entry ? { ...createEmptyInternshipEntry(), ...entry } : createEmptyInternshipEntry()
    setForm(base)
    setCurrentRole(!base.endDate)
  }, [open, entry])

  const isEdit = !!(entry?.company || entry?.role)

  const validate = () => {
    if (!form.company?.trim()) return 'Please enter company name'
    if (!form.role?.trim()) return 'Please enter your internship role'
    return null
  }

  const handleSave = () => {
    const err = validate()
    if (err) {
      window.alert(err)
      return
    }
    onSave?.(finalizeInternshipEntry({
      ...form,
      endDate: currentRole ? '' : form.endDate,
    }))
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => !v && onClose?.()}
      title={`${isEdit ? 'Edit Internship' : 'Add Internship'}`}
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
        Internship
      </div>

      <FormField label="Company *">
        <Input placeholder="Google, Microsoft, Startup…" value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} />
      </FormField>

      <FormField label="Role *">
        <Input placeholder="Software Intern, Data Analyst Intern…" value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} />
      </FormField>

      <FormRow>
        <FormField label="Start date">
          <Input type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </FormField>
        <FormField label="End date">
          <Input type="date" value={form.endDate || ''} disabled={currentRole} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
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
          <span>I am currently interning here</span>
        </Label>
      </FormField>

      <FormField label="Description">
        <Textarea className="min-h-[72px]" placeholder="What you worked on…" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </FormField>

      <FormField label="Key work">
        <Textarea className="min-h-[60px]" placeholder={'• Built feature X\n• Collaborated with team Y'} value={form.bullets || ''} onChange={(e) => setForm({ ...form, bullets: e.target.value })} />
      </FormField>
    </AppDialog>
  )
}
