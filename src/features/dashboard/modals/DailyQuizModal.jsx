import { AppDialog, Button } from '@/components/ui'
import DailyQuizCard from '@/features/dashboard/components/DailyQuizCard'

export default function DailyQuizModal({ open, onClose }) {
  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose?.() }}
      size="default"
      title="Daily quiz"
      description="Answer right to earn XP and level up. Open the app daily to grow your streak."
      footer={(
        <Button variant="outline" size="sm" onClick={onClose}>
          Done — see you tomorrow
        </Button>
      )}
    >
      <DailyQuizCard compact onComplete={() => { /* keep modal open so user can read explanation */ }} />
    </AppDialog>
  )
}
