import '@/styles/loader.css'

/**
 * Glowminds shared loader.
 *
 * Variants:
 *  - "page"    : Full-screen centered loader (auth boot, route gates, suspense fallback)
 *  - "section" : Centered loader within a routed section (~60vh)
 *  - "block"   : Inline padded block (use inside cards / lists)
 *  - "spinner" : Bare spinner ring (size-able), no wrapper layout
 *  - "dots"    : Three-dot bouncing indicator (chat / typing)
 *
 * Props:
 *  - variant: see above (default "section")
 *  - label:   optional label shown under the indicator
 *  - size:    pixel size for the visual indicator (default per variant)
 *  - className / style: appended to the outer container
 */
export default function Loader({
  variant = 'section',
  label,
  size,
  className = '',
  style,
}) {
  const layoutClass = {
    page: 'gm-loader gm-loader--page',
    section: 'gm-loader gm-loader--section',
    block: 'gm-loader gm-loader--block',
    spinner: 'gm-loader',
    dots: 'gm-loader',
  }[variant] || 'gm-loader gm-loader--section'

  if (variant === 'spinner') {
    const px = size || 18
    return (
      <span
        className={`gm-loader__ring ${className}`}
        role="status"
        aria-label={label || 'Loading'}
        style={{ width: px, height: px, borderWidth: Math.max(2, Math.round(px / 9)), ...style }}
      />
    )
  }

  if (variant === 'dots') {
    return (
      <span className={`gm-loader__dots ${className}`} role="status" aria-label={label || 'Loading'} style={style}>
        <span /><span /><span />
      </span>
    )
  }

  // page / section / block — gradient logo + label
  const logoSize = size || (variant === 'page' ? 48 : 44)
  const svgSize = Math.round(logoSize * 0.5)

  return (
    <div className={`${layoutClass} ${className}`} role="status" aria-live="polite" style={style}>
      <div className="gm-loader__wrap">
        <div className="gm-loader__logo" style={{ width: logoSize, height: logoSize }}>
          <svg width={svgSize} height={svgSize} viewBox="0 0 48 48" fill="none" aria-hidden>
            <path
              d="M36 17 A 14 14 0 1 0 36 31 L 36 24 L 27 24"
              stroke="#fff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <p className="gm-loader__label">{label || 'Loading...'}</p>
      </div>
    </div>
  )
}
