export function JobMetaItem({ icon, children, className = '', title }) {
  if (!children) return null
  return (
    <span className={`jc-meta-item ${className}`.trim()} title={title}>
      <span className="jc-meta-ico" aria-hidden>{icon}</span>
      <span className="jc-meta-text">{children}</span>
    </span>
  )
}

export function JobMetaRow({ children, className = '' }) {
  return (
    <div className={`jc-meta ${className}`.trim()}>
      {children}
    </div>
  )
}
