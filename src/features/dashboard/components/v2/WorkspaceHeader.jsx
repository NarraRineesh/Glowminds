import { Button } from '@/components/ui'

/**
 * Page action row. Title/subtitle live in DashboardTopbar — pass title only
 * when you need an in-page heading (rare); otherwise actions-only.
 */
export default function WorkspaceHeader({
  title,
  subtitle,
  primaryLabel,
  primaryAi,
  onPrimary,
  secondaryLabel,
  onSecondary,
  children,
}) {
  const hasTitle = Boolean(title)
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      {hasTitle ? (
        <div className="min-w-0">
          <h2 className="m-0 text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 mb-0 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {secondaryLabel && (
          <Button type="button" variant="outline" size="sm" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
        {primaryLabel && (
          <Button
            type="button"
            size="sm"
            className={primaryAi ? 'bg-ai text-background hover:bg-ai/90' : ''}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
