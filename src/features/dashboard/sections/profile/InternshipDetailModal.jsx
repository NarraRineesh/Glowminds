import AppIcon from '@/components/icons/AppIcon'
import { formatDateRange } from '@/utils/profileDates'
import { internshipEntrySubtitle } from '@/utils/internshipEntries'
import { AppDialog, Button } from '@/components/ui'

export default function InternshipDetailModal({
  open,
  entry,
  onClose,
  onEdit,
}) {
  const duration = entry ? formatDateRange(entry.startDate, entry.endDate, entry.duration || '') : ''

  return (
    <AppDialog
      open={open && !!entry}
      onOpenChange={(v) => !v && onClose?.()}
      title={entry ? `${entry.company || 'Internship'}` : ''}
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
          <div>
            <div className="text-sm font-extrabold">{entry.role || '—'}</div>
            {internshipEntrySubtitle(entry) && (
              <div className="text-xs text-muted-foreground mt-1">
                {duration || internshipEntrySubtitle(entry)}
              </div>
            )}
          </div>

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

          {entry.bullets?.trim() && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                Key work
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {entry.bullets.trim()}
              </div>
            </div>
          )}
        </>
      )}
    </AppDialog>
  )
}
