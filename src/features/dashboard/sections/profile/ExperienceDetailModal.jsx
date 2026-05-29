import AppIcon from '@/components/icons/AppIcon'
import { formatDateRange } from '@/utils/profileDates'
import { experienceEntrySubtitle } from '@/utils/experienceEntries'
import { AppDialog, Button } from '@/components/ui'

export default function ExperienceDetailModal({
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
      title={entry ? `${entry.company || 'Experience'}` : ''}
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
            {experienceEntrySubtitle(entry) && (
              <div className="text-xs text-muted-foreground mt-1">
                {duration || experienceEntrySubtitle(entry)}
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
                Key achievements
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
