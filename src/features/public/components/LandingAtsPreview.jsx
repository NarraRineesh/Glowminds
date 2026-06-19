import { cn } from '@/components/ui'

/** Static ATS score preview for landing (real analysis is logged-in only). */
export default function LandingAtsPreview({ className, score = 67 }) {
  const tone = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-orange-500'
  const barTone = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-orange-500'

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ATS Score Preview</p>
      <div className="mt-3 flex items-end gap-3">
        <p className={cn('text-4xl font-bold tabular-nums', tone)}>{score}</p>
        <p className="pb-1 text-sm text-muted-foreground">/ 100</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', barTone)} style={{ width: `${score}%` }} />
      </div>
      <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Add more role-specific keywords
        </li>
        <li className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Clean single-column layout
        </li>
        <li className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Quantify impact in experience bullets
        </li>
      </ul>
      <p className="mt-3 text-[11px] text-muted-foreground/80">
        Sign in to run full AI analysis on your resume.
      </p>
    </div>
  )
}
