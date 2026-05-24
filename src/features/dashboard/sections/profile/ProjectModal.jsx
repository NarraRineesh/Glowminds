import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  createEmptyProjectEntry,
  finalizeProjectEntry,
} from '@/utils/projectEntries'

export default function ProjectModal({ open, entry, saving, onClose, onSave }) {
  const [form, setForm] = useState(createEmptyProjectEntry())

  useEffect(() => {
    if (!open) return
    const base = entry ? { ...createEmptyProjectEntry(), ...entry } : createEmptyProjectEntry()
    setForm(base)
  }, [open, entry])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

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

  return createPortal(
    <div className="mb on" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="mo mo-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <h2>🚀 {isEdit ? 'Edit Project' : 'Add Project'}</h2>
          <div className="mx" onClick={() => onClose?.()} role="button" tabIndex={0}>✕</div>
        </div>

        <div className="mb2 flex flex-col gap-3" style={{ maxHeight: 'min(70vh, 520px)', overflow: 'auto' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-blu2)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Project
          </div>

          <div className="fg">
            <label className="fl">Project title *</label>
            <input className="fi" placeholder="E-Commerce Platform" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="fg2">
            <div className="fg">
              <label className="fl">Tech stack</label>
              <input className="fi" placeholder="React, Node.js, MongoDB" value={form.tech || ''} onChange={(e) => setForm({ ...form, tech: e.target.value })} />
            </div>
            <div className="fg">
              <label className="fl">Live URL / GitHub</label>
              <input className="fi" placeholder="https://github.com/…" value={form.url || ''} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
          </div>

          <div className="fg">
            <label className="fl">Description</label>
            <textarea
              className="fta min-h-[80px]"
              placeholder={'• Built REST APIs with 150+ endpoints\n• Deployed on AWS with CI/CD'}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
