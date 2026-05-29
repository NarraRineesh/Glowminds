export default function JobCardSkeleton() {
  return (
    <div className="jc jc-skeleton" aria-hidden>
      <div className="jch">
        <div className="sk sk-logo" />
        <div className="jch-body">
          <div className="sk sk-title" />
          <div className="jc-meta">
            <div className="sk sk-meta-chip" />
            <div className="sk sk-meta-chip" />
            <div className="sk sk-meta-chip sk-meta-chip-sm" />
          </div>
        </div>
      </div>
      <div className="sk sk-match-label" />
      <div className="sk sk-bar" />
      <div className="jc-tags">
        <div className="sk sk-tag" />
        <div className="sk sk-tag" />
        <div className="sk sk-tag sk-tag-sm" />
      </div>
      <div className="jc-footer">
        <div className="sk sk-salary" />
        <div className="jc-footer-actions">
          <div className="sk sk-btn" />
          <div className="sk sk-btn sk-btn-primary" />
        </div>
      </div>
    </div>
  )
}

export function JobGridSkeleton({ count = 6 }) {
  return (
    <div className="rg-j" aria-busy="true" aria-label="Loading jobs">
      {Array.from({ length: count }, (_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  )
}
