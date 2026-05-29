import { projectEntrySubtitle } from '@/utils/projectEntries'
import { AppDialog, Button } from '@/components/ui'

export default function ProjectDetailModal({ open, entry, onClose, onEdit }) {
  const tech = entry ? projectEntrySubtitle(entry) : ''

  return (
    <AppDialog
      open={open && !!entry}
      onOpenChange={(v) => !v && onClose?.()}
      title={entry ? `${entry.title || 'Project'}` : ''}
      size="lg"
      contentClassName="max-h-[min(70vh,480px)] overflow-auto"
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose?.()}>Close</Button>
          <Button
            onClick={() => {
              onClose?.()
              onEdit?.(entry)
            }}
          >
            Edit
          </Button>
        </>
      }
    >
      {entry && (
        <>
          {tech && (
            <div className="text-xs text-muted-foreground font-semibold">{tech}</div>
          )}
          {entry.url?.trim() && (
            <div>
              <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary">
                <AppIcon name="link" className="inline size-3" /> {entry.url.trim()}
              </a>
            </div>
          )}
          {entry.description?.trim() && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                Description
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {entry.description.trim()}
              </div>
            </div>
          )}
        </>
      )}
    </AppDialog>
  )
}
