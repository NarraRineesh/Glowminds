import { Spinner, cn } from '@/components/ui'

const VARIANTS = {
  /** Full viewport — auth gates, standalone pages */
  page: 'flex min-h-svh w-full items-center justify-center bg-background',
  /** Dashboard route / section bootstrap */
  section: 'flex w-full min-h-[min(420px,55vh)] flex-1 items-center justify-center',
  /** In-card or panel loading */
  block: 'flex w-full min-h-[min(220px,32vh)] items-center justify-center py-6',
  spinner: '',
}

const SPINNER_SIZE = {
  page: 32,
  section: 32,
  block: 28,
}

export default function Loader({
  variant = 'section',
  label,
  size,
  className = '',
  style,
}) {
  if (variant === 'spinner') {
    const px = size || 18
    return (
      <Spinner
        className={cn('text-primary', className)}
        style={{ width: px, height: px, ...style }}
        aria-label={label || 'Loading'}
      />
    )
  }

  const layoutClass = VARIANTS[variant] || VARIANTS.section
  const spinnerSize = size || SPINNER_SIZE[variant] || 32

  return (
    <div
      className={cn(layoutClass, className)}
      role="status"
      aria-live="polite"
      style={style}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Spinner
          className="text-primary"
          style={{ width: spinnerSize, height: spinnerSize }}
        />
        <p className="text-sm text-muted-foreground">{label || 'Loading…'}</p>
      </div>
    </div>
  )
}

/** Lazy route / Suspense fallback inside dashboard shell */
export function PageLoader(props) {
  return <Loader variant="section" {...props} />
}
