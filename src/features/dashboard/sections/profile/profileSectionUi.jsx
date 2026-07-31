import AppIcon from '@/components/icons/AppIcon'
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, cn } from '@/components/ui'

export function ProfileEmptyState({ icon, message, actionLabel, onAction, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 py-0.5">
        <p className="min-w-0 flex-1 text-sm leading-snug text-muted-foreground">{message}</p>
        <Button size="sm" className="shrink-0" onClick={onAction}>{actionLabel}</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <AppIcon name={icon} className="size-8 text-muted-foreground/60" />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button size="sm" onClick={onAction}>{actionLabel}</Button>
    </div>
  )
}

export function ProfileFieldRow({ label, children, className }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-1.5 text-sm', className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-foreground">{children}</span>
    </div>
  )
}

export function ProfileEntryBlock({ isLast, children, actions }) {
  return (
    <div className={cn('mb-3 pb-3 last:mb-0 last:pb-0', !isLast && 'border-b border-border')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        {actions ? <div className="flex shrink-0 items-start gap-1">{actions}</div> : null}
      </div>
    </div>
  )
}

export function ProfileSectionGrid({ isWide, children, className }) {
  return (
    <div className={cn('grid gap-2.5 sm:gap-4', isWide ? 'grid-cols-2' : 'grid-cols-1', className)}>
      {children}
    </div>
  )
}

export function ProfilePreviewText({ children }) {
  return (
    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  )
}

export function ProfileAvatarBlock({
  name,
  photoURL,
  profileScore,
  uploadingPhoto,
  onPickPhoto,
  onRemovePhoto,
  photoRef,
  onPhotoChange,
  compact = false,
  hideScore = false,
}) {
  return (
    <div className={cn('flex shrink-0 flex-col items-center', compact ? 'gap-1' : 'gap-2')}>
      <button
        type="button"
        className="group relative"
        onClick={onPickPhoto}
        title="Change photo"
      >
        <Avatar
          className={cn(
            'ring-muted transition-shadow group-hover:ring-primary/30',
            compact ? 'size-16 ring-2' : 'size-28 ring-4',
          )}
        >
          {photoURL && !uploadingPhoto ? <AvatarImage src={photoURL} alt="" /> : null}
          <AvatarFallback
            className={cn(
              'bg-gradient-to-br from-primary to-emerald-500 font-bold text-primary-foreground',
              compact ? 'text-xl' : 'text-3xl',
            )}
          >
            {uploadingPhoto ? <AppIcon name="hourglass" className="size-5 animate-pulse" /> : name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground',
            compact ? 'size-6' : 'size-7',
          )}
        >
          <AppIcon name="camera" className={compact ? 'size-3' : 'size-3.5'} />
        </span>
        {photoURL && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onRemovePhoto?.() }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onRemovePhoto?.() } }}
            className={cn(
              'absolute right-0 top-0 flex items-center justify-center rounded-full border-2 border-card bg-destructive text-xs text-white',
              compact ? 'size-6' : 'size-7',
            )}
            title="Remove photo"
            aria-label="Remove profile photo"
          >
            <AppIcon name="x" className={compact ? 'size-3' : 'size-3.5'} />
          </span>
        )}
      </button>
      <input ref={photoRef} type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
      {!hideScore ? (
        <span className={cn('font-bold tabular-nums', compact ? 'text-xs' : 'text-sm', profileScore >= 80 ? 'text-emerald-500' : 'text-primary')}>
          {profileScore}%
        </span>
      ) : null}
    </div>
  )
}

export function AiScoreBadge({ score }) {
  const tone = score >= 70 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : score >= 50 ? 'border-primary/30 bg-primary/10 text-primary' : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
  return (
    <div className={cn('flex size-16 shrink-0 items-center justify-center rounded-full border-[3px] text-lg font-bold tabular-nums', tone)}>
      {score}
    </div>
  )
}

export function SkillGroup({ label, children, tone = 'primary' }) {
  const labelClass = tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
  return (
    <div className="space-y-2">
      <p className={cn('text-xs font-semibold uppercase tracking-wide', labelClass)}>{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

export function FresherToggle({ isFresher, saving, onToggle }) {
  return (
    <button
      type="button"
      disabled={saving}
      onClick={() => !saving && onToggle(!isFresher)}
      className={cn(
        'mb-3 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
        isFresher ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-border bg-muted/50',
        saving && 'cursor-wait opacity-70',
      )}
    >
      <span
        className={cn(
          'flex size-[18px] shrink-0 items-center justify-center rounded border-2 text-[0.65rem]',
          isFresher ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-transparent',
        )}
      >
        {isFresher ? '✓' : ''}
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">I&apos;m a fresher / recent graduate</span>
        <span className="block text-xs text-muted-foreground">No full-time work experience yet</span>
      </span>
    </button>
  )
}
