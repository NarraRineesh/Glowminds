import { Link } from 'react-router-dom'
import { DESIGN_SCREENS } from './screens'

export default function DesignIndex() {
  const groups = [...new Set(DESIGN_SCREENS.map((s) => s.group))]
  return (
    <div className="os-canvas" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="dl-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>UX Revamp · Phase 9</div>
        <h2 style={{ margin: '4px 0 8px', fontSize: 26, letterSpacing: '-0.04em' }}>Design Lab</h2>
        <p className="dl-muted" style={{ margin: 0, maxWidth: 640, lineHeight: 1.55 }}>
          Hi-fi mocks include the proposed Career OS shell (sidebar, topbar, ⌘K).
          Product dashboard code is still untouched — approve these before Phase 10.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <Link className="dl-btn dl-btn-primary" to="/design/mocks/dashboard">Open Dashboard Hi-Fi</Link>
          <Link className="dl-btn" to="/design/wireframes/dashboard">Dashboard Wire</Link>
          <Link className="dl-btn" to="/design/system">Design System</Link>
        </div>
      </div>
      {groups.map((group) => (
        <section key={group} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--dl-muted)', marginBottom: 10 }}>{group}</h3>
          <div className="dl-index-grid">
            {DESIGN_SCREENS.filter((s) => s.group === group).map((s) => (
              <div key={s.id} className="dl-index-card">
                <div style={{ fontWeight: 650, fontSize: 14, letterSpacing: '-0.02em' }}>{s.title}</div>
                <div className="dl-muted" style={{ marginTop: 2 }}>{s.id}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link className="dl-btn" to={`/design/wireframes/${s.id}`}>Wire</Link>
                  <Link className="dl-btn dl-btn-primary" to={`/design/mocks/${s.id}`}>Hi-Fi</Link>
                </div>
                <span className="dl-status">Revised · ready for review</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
