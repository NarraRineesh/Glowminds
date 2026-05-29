import { AppIcon, cn } from '@/components/ui'

export default function JobMiniRow({ job, onClick, className }) {
  const title = job.title
  const company = job.company || job.co
  const location = job.location || job.loc

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(e)
        }
      }}
      className={cn(
        'mb-1.5 flex min-w-0 max-w-full cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-2.5 py-2 transition-all hover:translate-x-0.5 hover:border-ring/30',
        className,
      )}
    >
      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-muted">
        {job.logo && /^https?:\/\//.test(job.logo) ? (
          <img src={job.logo} alt="" className="h-full w-full rounded-lg object-cover" />
        ) : (
          <AppIcon name={job.logo || 'jobs'} className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[0.78rem] font-bold">{title}</div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.68rem] text-muted-foreground">
          {company && (
            <span className="inline-flex min-w-0 max-w-full items-center gap-0.5">
              <AppIcon name="buildings" className="size-3 shrink-0" />
              <span className="truncate">{company}</span>
            </span>
          )}
          {location && (
            <span className="inline-flex min-w-0 max-w-full items-center gap-0.5">
              <AppIcon name={job.remote ? 'globe' : 'map-pin'} className="size-3 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[0.68rem] font-extrabold text-emerald-500">{job.match}%</div>
        <div className="flex items-center justify-end gap-0.5 text-[0.62rem] text-muted-foreground">
          <AppIcon name="clock" className="size-3 shrink-0" />
          {job.posted}
        </div>
      </div>
    </div>
  )
}
