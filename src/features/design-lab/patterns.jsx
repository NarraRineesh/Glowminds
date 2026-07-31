/**
 * Shared Career OS layout patterns.
 * Headers stay quiet (Linear/Notion) — not a coaching banner on every page.
 * “What’s next” lives in page content (Focus, action plan), not a permanent Next chip.
 */

export function PageHeader({
  title,
  subtitle,
  primaryLabel,
  primaryAi,
  secondaryLabel,
  /** Optional quiet meta line — avoid uppercase “AI identity” eyebrows */
  meta,
}) {
  const hasActions = primaryLabel || secondaryLabel
  const hasTitle = Boolean(title)
  if (!hasTitle && !hasActions && !meta) return null
  return (
    <header className="ws-header">
      {hasTitle || meta ? (
        <div className="ws-header-main">
          {meta && <p className="ws-meta">{meta}</p>}
          {hasTitle && <h1 className="ws-title">{title}</h1>}
          {subtitle && <p className="ws-sub">{subtitle}</p>}
        </div>
      ) : (
        <div className="ws-header-main" />
      )}
      {hasActions && (
        <div className="ws-header-actions">
          {secondaryLabel && (
            <button type="button" className="dl-btn">{secondaryLabel}</button>
          )}
          {primaryLabel && (
            <button type="button" className={primaryAi ? 'dl-btn dl-btn-ai' : 'dl-btn dl-btn-primary'}>
              {primaryLabel}
            </button>
          )}
        </div>
      )}
    </header>
  )
}

/** Content + insight/AI rail — principle: Workspace > form */
export function SplitRail({ main, rail, ratio = '7-5' }) {
  return (
    <div className={`ws-split ws-split-${ratio}`}>
      <div className="ws-main">{main}</div>
      <aside className="ws-rail">{rail}</aside>
    </div>
  )
}

export function Panel({ title, action, children, ai, className = '' }) {
  return (
    <section className={`dl-card${ai ? ' dl-ai-card' : ''} ${className}`.trim()}>
      {(title || action) && (
        <div className="dl-card-hd">
          {title ? <h2>{title}</h2> : <span />}
          {action || null}
        </div>
      )}
      {children}
    </section>
  )
}

export function QuickActions({ items }) {
  return (
    <div className="ws-quick">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={item.ai ? 'dl-btn dl-btn-ai' : 'dl-btn'}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function HelpHint({ children }) {
  return <p className="ws-help">{children}</p>
}

export function Stepper({ steps, active }) {
  return (
    <ol className="ws-stepper">
      {steps.map((s, i) => (
        <li key={s} className={i === active ? 'is-on' : i < active ? 'is-done' : ''}>
          <span className="ws-step-n">{i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  )
}
