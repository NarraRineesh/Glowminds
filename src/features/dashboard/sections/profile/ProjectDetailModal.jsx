import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { projectEntrySubtitle } from '@/utils/projectEntries'

export default function ProjectDetailModal({ open, entry, onClose, onEdit }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !entry) return null

  const tech = projectEntrySubtitle(entry)

  return createPortal(
    <div className="mb on" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="mo mo-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <h2>🚀 {entry.title || 'Project'}</h2>
          <div className="mx" onClick={() => onClose?.()} role="button" tabIndex={0}>✕</div>
        </div>

        <div className="mb2 flex flex-col gap-3" style={{ maxHeight: 'min(70vh, 480px)', overflow: 'auto' }}>
          {tech && (
            <div style={{ fontSize: '.78rem', color: 'var(--color-blu2)', fontWeight: 600 }}>{tech}</div>
          )}
          {entry.url?.trim() && (
            <div>
              <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.82rem', color: 'var(--color-blu2)' }}>
                🔗 {entry.url.trim()}
              </a>
            </div>
          )}
          {entry.description?.trim() && (
            <div>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--color-blu2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
                Description
              </div>
              <div style={{ fontSize: '.82rem', color: 'var(--color-txt2)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {entry.description.trim()}
              </div>
            </div>
          )}
        </div>

        <div className="mf">
          <button type="button" className="btn btn-gh" onClick={() => onClose?.()}>Close</button>
          <button
            type="button"
            className="btn btn-p"
            onClick={() => {
              onClose?.()
              onEdit?.(entry)
            }}
          >
            Edit
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
