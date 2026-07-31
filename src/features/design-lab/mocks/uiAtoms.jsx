/**
 * Dense UI atoms for Design Lab mocks — product chrome, not coaching templates.
 */
export function CoMark({ name, tone = 0 }) {
  const hues = [210, 190, 250, 30, 160, 340]
  const h = hues[tone % hues.length]
  const letter = (name || '?').slice(0, 1).toUpperCase()
  return (
    <span
      className="ui-comark"
      style={{ background: `hsl(${h} 35% 18%)`, color: `hsl(${h} 70% 72%)` }}
      aria-hidden
    >
      {letter}
    </span>
  )
}

export function Toolbar({ left, right }) {
  return (
    <div className="ui-toolbar">
      <div className="ui-toolbar-left">{left}</div>
      {right && <div className="ui-toolbar-right">{right}</div>}
    </div>
  )
}

export function MetaRow({ items }) {
  return (
    <div className="ui-meta">
      {items.map((item, i) => (
        <span key={i} className="ui-meta-item">
          {i > 0 && <span className="ui-meta-dot" aria-hidden />}
          {item}
        </span>
      ))}
    </div>
  )
}

export function StatStrip({ stats }) {
  return (
    <div className="ui-statstrip">
      {stats.map(([label, value, hint]) => (
        <div key={label} className="ui-stat">
          <div className="ui-stat-value">{value}</div>
          <div className="ui-stat-label">{label}</div>
          {hint && <div className="ui-stat-hint">{hint}</div>}
        </div>
      ))}
    </div>
  )
}

export function FilterBar({ filters, active = 0 }) {
  return (
    <div className="ui-filters">
      {filters.map((f, i) => (
        <button key={f} type="button" className={`ui-filter${i === active ? ' is-on' : ''}`}>
          {f}
        </button>
      ))}
    </div>
  )
}

export function JobCard({
  company,
  role,
  loc,
  match,
  tags,
  salary,
  posted,
  tone = 0,
}) {
  return (
    <article className="ui-job">
      <CoMark name={company} tone={tone} />
      <div className="ui-job-body">
        <div className="ui-job-top">
          <h3>{role}</h3>
          <span className="dl-badge">{match}%</span>
        </div>
        <MetaRow items={[company, loc, salary, posted].filter(Boolean)} />
        {tags?.length > 0 && (
          <div className="ui-tags">
            {tags.map((t) => (
              <span key={t} className="ui-tag">{t}</span>
            ))}
          </div>
        )}
        <div className="ui-job-actions">
          <button type="button" className="dl-btn dl-btn-primary">View</button>
          <button type="button" className="dl-btn">Save</button>
          <button type="button" className="dl-btn-ghost dl-btn">Hide</button>
        </div>
      </div>
    </article>
  )
}

export function AppCard({ company, role, match, next, status, tone = 0 }) {
  return (
    <div className="ui-app">
      <div className="ui-app-top">
        <CoMark name={company} tone={tone} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="ui-app-role">{role}</div>
          <div className="dl-muted">{company}</div>
        </div>
        <span className="dl-badge">{match}</span>
      </div>
      <div className="ui-app-next">
        <span className="dl-muted">Next</span>
        <span>{next}</span>
      </div>
      {status && <span className="ui-tag">{status}</span>}
    </div>
  )
}

export function Spark({ values = [20, 40, 30, 55, 48, 70, 62] }) {
  const max = Math.max(...values, 1)
  return (
    <div className="ui-spark" aria-hidden>
      {values.map((v, i) => (
        <i key={i} style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  )
}

export function DenseTable({ columns, rows }) {
  return (
    <div className="ui-table-wrap">
      <table className="dl-table ui-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Field({ label, value, hint }) {
  return (
    <label className="ui-field">
      <span className="ui-field-label">{label}</span>
      <span className="ui-field-value">{value}</span>
      {hint && <span className="dl-muted">{hint}</span>}
    </label>
  )
}
