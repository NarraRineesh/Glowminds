import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  createEmptyExperienceEntry,
  finalizeExperienceEntry,
} from '@/utils/experienceEntries'

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

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

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

  return createPortal(
    <div className="mb on" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="mo mo-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <h2>💼 {isEdit ? 'Edit Experience' : 'Add Experience'}</h2>
          <div className="mx" onClick={() => onClose?.()} role="button" tabIndex={0}>✕</div>
        </div>

        <div className="mb2 flex flex-col gap-3" style={{ maxHeight: 'min(70vh, 520px)', overflow: 'auto' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-blu2)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Employment
          </div>

          <div className="fg">
            <label className="fl">Company *</label>
            <input
              className="fi"
              placeholder="Google, TCS, Startup…"
              value={form.company || ''}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>

          <div className="fg">
            <label className="fl">Role / Title *</label>
            <input
              className="fi"
              placeholder="Software Engineer, Product Manager…"
              value={form.role || ''}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </div>

          <div className="fg2">
            <div className="fg">
              <label className="fl">Start date</label>
              <input
                className="fi"
                type="date"
                value={form.startDate || ''}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="fg">
              <label className="fl">End date</label>
              <input
                className="fi"
                type="date"
                value={form.endDate || ''}
                disabled={currentRole}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="fg">
            <label className="fl flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentRole}
                onChange={(e) => {
                  setCurrentRole(e.target.checked)
                  if (e.target.checked) setForm((f) => ({ ...f, endDate: '' }))
                }}
              />
              <span>I currently work here</span>
            </label>
          </div>

          <div className="fg">
            <label className="fl">Description</label>
            <textarea
              className="fta min-h-[72px]"
              placeholder="Your role, team, and impact in a few sentences…"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="fg">
            <label className="fl">Key achievements</label>
            <textarea
              className="fta min-h-[60px]"
              placeholder={'• Built REST APIs\n• Improved performance by 30%'}
              value={form.bullets || ''}
              onChange={(e) => setForm({ ...form, bullets: e.target.value })}
            />
          </div>
        </div>

        <div className="mf">
          <button type="button" className="btn btn-gh" onClick={() => onClose?.()}>Cancel</button>
          <button type="button" className="btn btn-p" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
