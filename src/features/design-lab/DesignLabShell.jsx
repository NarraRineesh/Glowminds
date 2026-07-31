import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import { DESIGN_SCREENS, NAV_GROUPS, getScreen } from './screens'
import './tokens.css'

function useDesignLabAllowed() {
  const [ok, setOk] = useState(() => {
    if (import.meta.env.DEV) return true
    try {
      return localStorage.getItem('gm_design_lab') === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    if (import.meta.env.DEV) return
    const onStorage = () => setOk(localStorage.getItem('gm_design_lab') === '1')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  return ok
}

/** Isolated Career OS design previews — not DashboardShell */
export default function DesignLabShell() {
  const allowed = useDesignLabAllowed()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isWire = location.pathname.includes('/wireframes')
  const theme = params.get('theme') === 'light' ? 'light' : 'dark'
  const state = params.get('state') || 'default'
  const viewport = ['mobile', 'tablet', 'desktop'].includes(params.get('vp')) ? params.get('vp') : 'desktop'
  const screenId = location.pathname.split('/').pop()
  const screen = getScreen(screenId)

  if (!allowed) {
    return (
      <div className="gm-design-lab" style={{ padding: 40 }}>
        <SEO title="Design Lab" path="/design" noIndex description="Internal design previews." />
        <h1>Design Lab locked</h1>
        <p className="dl-muted">Set <code>localStorage.gm_design_lab = &apos;1&apos;</code> or run in DEV.</p>
      </div>
    )
  }

  const toggleTheme = () => {
    const next = new URLSearchParams(params)
    if (theme === 'light') next.delete('theme')
    else next.set('theme', 'light')
    setParams(next, { replace: true })
  }

  const setState = (s) => {
    const next = new URLSearchParams(params)
    if (!s || s === 'default') next.delete('state')
    else next.set('state', s)
    setParams(next, { replace: true })
  }

  const setVp = (vp) => {
    const next = new URLSearchParams(params)
    if (vp === 'desktop') next.delete('vp')
    else next.set('vp', vp)
    setParams(next, { replace: true })
  }

  const base = isWire ? '/design/wireframes' : '/design/mocks'
  const flip = isWire
    ? location.pathname.replace('/wireframes', '/mocks')
    : location.pathname.replace('/mocks', '/wireframes')
  const isPreview = location.pathname.includes('/mocks/') || location.pathname.includes('/wireframes/')

  return (
    <div className={`gm-design-lab${isWire ? ' is-wireframe' : ''}${isPreview ? ' is-preview' : ''}`} data-dl-theme={theme}>
      <SEO title="Design Lab" path="/design" noIndex description="Internal design previews." />
      <div className="dl-lab-chrome">
        <button type="button" className="dl-btn" onClick={() => navigate('/design')}>Index</button>
        <h1>
          {isWire ? 'Wireframe' : 'Hi-Fi'}
          {screen ? ` · ${screen.title}` : ' · Design Lab'}
        </h1>
        <button type="button" className="dl-chip" onClick={toggleTheme}>Theme: {theme}</button>
        <button type="button" className="dl-chip" onClick={() => setState(state === 'empty' ? 'default' : 'empty')}>
          {state === 'empty' ? 'State: empty' : 'Show empty'}
        </button>
        <button type="button" className="dl-chip" onClick={() => setState(state === 'loading' ? 'default' : 'loading')}>
          {state === 'loading' ? 'State: loading' : 'Show loading'}
        </button>
        <button type="button" className="dl-chip" onClick={() => setVp('desktop')}>
          Desktop{viewport === 'desktop' ? ' ✓' : ''}
        </button>
        <button type="button" className="dl-chip" onClick={() => setVp('tablet')}>
          Tablet{viewport === 'tablet' ? ' ✓' : ''}
        </button>
        <button type="button" className="dl-chip" onClick={() => setVp('mobile')}>
          Mobile{viewport === 'mobile' ? ' ✓' : ''}
        </button>
        {(location.pathname.includes('/mocks/') || location.pathname.includes('/wireframes/')) && (
          <Link className="dl-btn" to={flip}>{isWire ? 'View Hi-Fi' : 'View Wire'}</Link>
        )}
        <Link className="dl-btn dl-btn-primary" to="/design/system">System</Link>
      </div>
      <div className={`dl-lab-body${isPreview ? ' is-preview' : ''}`}>
        {!isPreview && (
        <aside className="dl-lab-nav">
          <div className="dl-lab-nav-brand">Screen index</div>
          <NavLink to="/design" end className={({ isActive }) => (isActive ? 'is-active' : undefined)}>All screens</NavLink>
          <NavLink to="/design/system" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>Design system</NavLink>
          <div className="dl-lab-nav-group">Core</div>
          <NavLink to={`${base}/dashboard`} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>Dashboard</NavLink>
          {NAV_GROUPS.map((g) => (
            <div key={g.label}>
              <div className="dl-lab-nav-group">{g.label}</div>
              {g.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={`${base}/${item.id}`}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="dl-lab-nav-group">More</div>
          {DESIGN_SCREENS.filter((s) => !['dashboard', ...NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id))].includes(s.id)).map((s) => (
            <NavLink
              key={s.id}
              to={`${base}/${s.id}`}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {s.title}
            </NavLink>
          ))}
        </aside>
        )}
        <div className="dl-lab-stage">
          <Outlet context={{ state, theme, isWire, viewport }} />
        </div>
      </div>
    </div>
  )
}
