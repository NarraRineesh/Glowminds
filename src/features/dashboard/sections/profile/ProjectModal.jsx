import { useEffect, useState } from 'react'
import {
  createEmptyProjectEntry,
  finalizeProjectEntry,
} from '@/utils/projectEntries'
import {
  AppDialog,
  Button,
  FormField,
  FormRow,
  Input,
  Textarea,
} from '@/components/ui'

export default function ProjectModal({ open, entry, saving, onClose, onSave }) {
  const [form, setForm] = useState(createEmptyProjectEntry())

  useEffect(() => {
    if (!open) return
    const base = entry ? { ...createEmptyProjectEntry(), ...entry } : createEmptyProjectEntry()
    setForm(base)
  }, [open, entry])

  const isEdit = !!entry?.title?.trim()

  const validate = () => {
    if (!form.title?.trim()) return 'Please enter project title'
    return null
  }

  const handleSave = () => {
    const err = validate()
    if (err) {
      window.alert(err)
      return
    }
    onSave?.(finalizeProjectEntry(form))
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => !v && onClose?.()}
      title={`${isEdit ? 'Edit Project' : 'Add Project'}`}
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
        Project
      </div>

      <FormField label="Project title *">
        <Input placeholder="E-Commerce Platform" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </FormField>

      <FormRow>
        <FormField label="Tech stack">
          <Input placeholder="React, Node.js, MongoDB" value={form.tech || ''} onChange={(e) => setForm({ ...form, tech: e.target.value })} />
        </FormField>
        <FormField label="Live URL / GitHub">
          <Input placeholder="https://github.com/…" value={form.url || ''} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </FormField>
      </FormRow>

      <FormField label="Description">
        <Textarea
          className="min-h-[80px]"
          placeholder={'• Built REST APIs with 150+ endpoints\n• Deployed on AWS with CI/CD'}
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormField>
    </AppDialog>
  )
}
