import { useOutletContext, useParams } from 'react-router-dom'
import { getScreen } from './screens'
import {
  PageHeader,
  Panel,
} from './patterns'
import { workspaceBody } from './mocks/workspaceBodies'
import { CoMark, MetaRow } from './mocks/uiAtoms'
import { DonutChart, FUNNEL_DONUT, SkillDemandChart } from './mocks/Charts'

const NAV = [
  { group: null, items: [
    { id: 'dashboard', label: 'Dashboard' },
  ] },
  {
    group: 'Job search',
    items: [
      { id: 'job-explorer', label: 'Jobs' },
      { id: 'ats-report', label: 'Resume' },
      { id: 'applications', label: 'Applications' },
      { id: 'salary', label: 'Salary' },
    ],
  },
  {
    group: 'Grow',
    items: [
      { id: 'skills', label: 'Skills' },
      { id: 'learning', label: 'Learning' },
      { id: 'interview', label: 'Interview' },
      { id: 'linkedin-hub', label: 'LinkedIn Hub' },
      { id: 'ai-coach', label: 'Glow (Bot)' },
    ],
  },
  {
    group: 'Write',
    items: [
      { id: 'cover-letter', label: 'Cover Letters' },
      { id: 'grammar', label: 'Grammar' },
      { id: 'paraphrase', label: 'Rewrite' },
    ],
  },
  {
    group: 'Files',
    items: [{ id: 'vault', label: 'Vault' }],
  },
  {
    group: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics' },
      { id: 'career-timeline', label: 'Timeline' },
    ],
  },
]

const META = {
  dashboard: {
    title: 'Dashboard',
    subtitle: null,
    primary: null,
    secondary: null,
  },
  'ats-report': {
    title: 'ATS score',
    subtitle: 'Product FE',
    primary: 'Re-run',
    secondary: null,
  },
  'linkedin-hub': {
    title: 'LinkedIn',
    subtitle: 'Install Assist, capture profile, then import here',
    primary: null,
    secondary: null,
  },
  'linkedin-audit': {
    title: 'LinkedIn audit',
    subtitle: 'AI findings on headline, About, and experience',
    primary: 'Continue to rewrites',
    secondary: 'Back to import',
  },
  'linkedin-rewrite': {
    title: 'LinkedIn rewrites',
    subtitle: 'AI fills and copy-ready rewrites for LinkedIn',
    primary: 'Copy all',
    secondary: 'Back to audit',
  },
  vault: {
    title: 'Vault',
    subtitle: '120 MB of 500 MB used',
    primary: 'Upload',
    secondary: null,
  },
  'job-explorer': {
    title: 'Jobs',
    subtitle: '24 roles match your profile',
    primary: null,
    secondary: 'Filters',
  },
  'job-details': {
    title: 'Staff Frontend Engineer',
    subtitle: 'Vercel · Remote',
    primary: 'Apply & track',
    secondary: 'Save',
  },
  applications: {
    title: 'Applications',
    subtitle: '10 in pipeline',
    primary: 'Add',
    secondary: null,
  },
  salary: {
    title: 'Salary',
    subtitle: 'Senior Frontend · Hyderabad',
    primary: null,
    secondary: null,
  },
  skills: {
    title: 'Skills',
    subtitle: 'Gap analysis for Staff Frontend',
    primary: null,
    secondary: 'Edit skills',
  },
  learning: {
    title: 'Learning',
    subtitle: 'Streak 4 days · System Design in progress',
    primary: 'Continue',
    secondary: null,
  },
  interview: {
    title: 'Interview prep',
    subtitle: 'Mocks and company prep',
    primary: 'Start mock',
    secondary: null,
    primaryAi: true,
  },
  'ai-coach': {
    title: 'Glow (Bot)',
    subtitle: null,
    primary: null,
    secondary: 'New chat',
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Last 30 days',
    primary: 'Export',
    secondary: null,
  },
  'cover-letter': {
    title: 'Cover letter',
    subtitle: null,
    primary: 'Generate',
    secondary: null,
    primaryAi: true,
  },
  grammar: {
    title: 'Grammar',
    subtitle: null,
    primary: 'Check',
    secondary: null,
    primaryAi: true,
  },
  paraphrase: {
    title: 'Rewrite',
    subtitle: 'Tone-controlled rewrites for About, bullets, and letters',
    primary: 'Rewrite',
    secondary: null,
    primaryAi: true,
  },
  settings: {
    title: 'Settings',
    subtitle: null,
    primary: null,
    secondary: null,
  },
  notifications: {
    title: 'Notifications',
    subtitle: '3 unread',
    primary: null,
    secondary: 'Mark all read',
  },
  'career-timeline': {
    title: 'Timeline',
    subtitle: 'Activity across your career OS',
    primary: null,
    secondary: null,
  },
}

/** Tiny sparkline for dashboard health scores */
function MiniSparkline({ points, color, id, width = 88, height = 28 }) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = Math.max(1, max - min)
  const pad = 2
  const coords = points.map((v, i) => {
    const x = pad + (i / Math.max(1, points.length - 1)) * (width - pad * 2)
    const y = height - pad - ((v - min) / span) * (height - pad * 2)
    return [x, y]
  })
  const line = coords.map(([x, y]) => `${x},${y}`).join(' ')
  const area = [
    `${coords[0][0]},${height}`,
    ...coords.map(([x, y]) => `${x},${y}`),
    `${coords[coords.length - 1][0]},${height}`,
  ].join(' ')
  const last = coords[coords.length - 1]
  const gid = `sg-${id || 'x'}`
  return (
    <svg className="dash-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${gid})`} points={area} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />}
    </svg>
  )
}

function OsShell({ activeId, children, isWire, hideSide, viewport }) {
  const meta = META[activeId]
  if (isWire) {
    return (
      <div style={{ padding: 16 }}>
        <div className="dl-wire-box" style={{ marginBottom: 10 }}>OS SHELL · nav · topbar · title · search</div>
        <div className="dl-wire-box" style={{ marginBottom: 10 }}>CONTENT · optional side rail</div>
        {children}
      </div>
    )
  }
  return (
    <div className="dl-viewport" data-vp={viewport || 'desktop'}>
      <div className="os">
        {!hideSide && (
          <aside className="os-side">
            <div className="os-logo"><span className="os-logo-mark" />GlowMinds</div>
            {NAV.map((block) => (
              <div key={block.group || 'top'}>
                {block.group && <div className="os-nav-label">{block.group}</div>}
                {block.items.map((item) => {
                  const on =
                    activeId === item.id
                    || (item.id === 'linkedin-hub' && ['linkedin-audit', 'linkedin-rewrite'].includes(activeId))
                    || (item.id === 'cover-letter' && ['grammar', 'paraphrase'].includes(activeId))
                    || (item.id === 'job-explorer' && activeId === 'job-details')
                    || (item.id === 'ats-report' && activeId === 'ats-report')
                  return (
                    <div key={item.id} className={`os-nav-item${on ? ' is-on' : ''}`}>{item.label}</div>
                  )
                })}
              </div>
            ))}
            <div className="os-side-foot">
              <div className="os-nav-item">Settings</div>
            </div>
          </aside>
        )}
        <div className="os-main">
          <header className="os-top">
            <div className="os-top-title">
              <div className="os-title">{meta?.title || 'Dashboard'}</div>
              {meta?.subtitle ? <div className="os-sub">{meta.subtitle}</div> : null}
            </div>
            <div className="os-search"><span>Search jobs, apps, skills…</span><kbd>⌘K</kbd></div>
            <button type="button" className="os-icon-btn" aria-label="Notifications">N<span className="dot" /></button>
            <span className="os-avatar" aria-label="Account">RN</span>
          </header>
          <div className="os-canvas">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/** In-canvas actions only — title/subtitle live in os-top. */
function HeaderFromMeta({ id, isWire }) {
  const m = META[id]
  if (!m) return null
  if (!m.primary && !m.secondary) return null
  if (isWire) {
    return (
      <div className="dl-wire-box" style={{ marginBottom: 12 }}>
        ACTIONS{m.primary ? ` · ${m.primary}` : ''}{m.secondary ? ` · ${m.secondary}` : ''}
      </div>
    )
  }
  return (
    <PageHeader
      title={null}
      subtitle={null}
      primaryLabel={m.primary}
      primaryAi={m.primaryAi}
      secondaryLabel={m.secondary}
    />
  )
}

function Empty({ label, cta }) {
  return (
    <div className="dl-card dl-empty">
      <h3>{label}</h3>
      <p className="dl-muted">One clear next step — never a blank page.</p>
      <button type="button" className="dl-btn dl-btn-primary">{cta}</button>
    </div>
  )
}

function LoadingBlocks() {
  return (
    <div className="dl-grid" style={{ gap: 12 }}>
      <div className="dl-card"><div className="dl-skeleton" style={{ width: '45%', height: 18, marginBottom: 10 }} /><div className="dl-skeleton" style={{ width: '70%' }} /></div>
      <div className="dl-grid dl-grid-5">
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="dl-card"><div className="dl-skeleton" style={{ height: 48, borderRadius: 24, width: 48, margin: '0 auto 8px' }} /><div className="dl-skeleton" /></div>)}
      </div>
      <div className="dl-grid dl-grid-7-5">
        <div className="dl-card" style={{ minHeight: 160 }}><div className="dl-skeleton" style={{ width: '40%', marginBottom: 12 }} /><div className="dl-skeleton" /><div className="dl-skeleton" style={{ width: '60%', marginTop: 8 }} /></div>
        <div className="dl-card" style={{ minHeight: 160 }}><div className="dl-skeleton" style={{ width: '35%', marginBottom: 12 }} /><div className="dl-skeleton" /></div>
      </div>
    </div>
  )
}

function DashboardBody({ isWire }) {
  if (isWire) {
    return (
      <div className="dl-grid" style={{ gap: 8 }}>
        {['FOCUS', 'SCORES', 'WORK · plan + interviews | jobs + learning', 'INSIGHTS · line + donut'].map((b) => (
          <div key={b} className="dl-wire-box">{b}</div>
        ))}
      </div>
    )
  }
  return (
    <div className="dash">
      {/* 1. Focus — single primary CTA */}
      <div className="dash-focus">
        <div className="dash-focus-text">
          <div className="dash-focus-meta">
            <span className="dl-muted">Today’s focus</span>
            <span className="dl-badge-warn dl-badge">Due Thu</span>
          </div>
          <p>Raise ATS to 85+ before Thursday’s Stripe interview</p>
        </div>
        <div className="dash-focus-actions">
          <button type="button" className="dl-btn">Dismiss</button>
          <button type="button" className="dl-btn dl-btn-primary">Open ATS</button>
        </div>
      </div>

      {/* 2. Health scores — sparklines */}
      <div className="dash-scores">
        {[
          { label: 'Career', value: 74, delta: '+4', color: 'var(--dl-primary)', trend: [62, 64, 68, 70, 71, 74] },
          { label: 'Resume', value: 81, delta: '+6', color: 'var(--dl-ai)', trend: [70, 72, 75, 76, 78, 81] },
          { label: 'LinkedIn', value: 68, delta: '+2', color: 'var(--dl-success)', trend: [58, 60, 63, 64, 66, 68] },
          { label: 'Interview', value: 72, delta: '—', color: 'var(--dl-warning)', trend: [65, 68, 70, 69, 71, 72] },
          { label: 'Profile', value: 79, delta: '+3', color: 'var(--dl-profile)', trend: [68, 70, 72, 74, 76, 79] },
        ].map((s) => (
          <div key={s.label} className="dash-score" style={{ '--score-accent': s.color }}>
            <div className="dash-score-top">
              <span className="dash-score-label">{s.label}</span>
              <span className={`dash-score-delta${s.delta === '—' ? ' is-flat' : ''}`}>{s.delta}</span>
            </div>
            <div className="dash-score-value">{s.value}</div>
            <MiniSparkline id={s.label.toLowerCase()} points={s.trend} color={s.color} />
          </div>
        ))}
      </div>

      {/* 3. Work columns */}
      <div className="dash-work">
        <div className="dash-col">
          <Panel
            title="Action plan"
            action={(
              <div className="dash-plan-meta">
                <span className="dl-muted">3 / 5</span>
                <div className="dl-bar dash-plan-bar"><i style={{ width: '60%' }} /></div>
              </div>
            )}
          >
            <ul className="dl-list">
              <li><span className="dl-check on" /><span style={{ flex: 1 }}>Sync LinkedIn headline</span><span className="dl-badge-ok dl-badge">Done</span></li>
              <li><span className="dl-check" /><span style={{ flex: 1 }}>Fix ATS keywords · Product FE</span><span className="dl-badge">12m</span></li>
              <li><span className="dl-check" /><span style={{ flex: 1 }}>Apply to 2 roles ≥85%</span><span className="dl-badge">Jobs</span></li>
              <li><span className="dl-check" /><span style={{ flex: 1 }}>Interview warm-up</span><span className="dl-badge">Prep</span></li>
              <li><span className="dl-check" /><span style={{ flex: 1 }}>Continue System Design W3</span><span className="dl-badge">Learn</span></li>
            </ul>
          </Panel>

          <Panel title="Upcoming interviews" action={<button type="button" className="dl-btn-ghost dl-btn">CRM</button>}>
            <ul className="dl-list">
              <li className="dash-interview">
                <CoMark name="Stripe" tone={2} />
                <div>
                  <strong>Frontend · Stripe</strong>
                  <MetaRow items={['Thu 4:00 PM', 'Round 2']} />
                </div>
                <div className="dash-interview-actions">
                  <span className="dl-badge-warn dl-badge">2d</span>
                  <button type="button" className="dl-btn">Prep</button>
                </div>
              </li>
              <li className="dash-interview">
                <CoMark name="Notion" tone={3} />
                <div>
                  <strong>Product Eng · Notion</strong>
                  <MetaRow items={['Mon 11:00 AM', 'Behavioral']} />
                </div>
                <div className="dash-interview-actions">
                  <span className="dl-muted" style={{ fontSize: 11 }}>5d</span>
                  <button type="button" className="dl-btn">Prep</button>
                </div>
              </li>
            </ul>
          </Panel>

          <Panel title="Goals & activity">
            <div className="ws-goals" style={{ marginBottom: 12 }}>
              <div className="ws-goal">
                <div>
                  <strong>Land Staff FE by Q3</strong>
                  <div className="dl-bar" style={{ marginTop: 6 }}><i style={{ width: '62%' }} /></div>
                </div>
                <span className="dl-badge">On track</span>
              </div>
              <div className="ws-goal">
                <div>
                  <strong>ATS ≥ 85</strong>
                  <div className="dl-bar" style={{ marginTop: 6 }}><i style={{ width: '81%' }} /></div>
                </div>
                <span className="dl-muted">81</span>
              </div>
            </div>
            <div className="dash-activity">
              {[
                ['Today', 'ATS score 81'],
                ['Yesterday', 'Applied · Vercel'],
                ['Mon', 'Mock interview 76%'],
              ].map(([when, text]) => (
                <div key={when} className="dl-timeline-item">
                  <span className="dot" />
                  <div><strong>{text}</strong><div className="dl-muted">{when}</div></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="dash-col">
          <Panel title="Suggested" ai action={<span className="dl-badge-ai dl-badge">AI</span>}>
            <p style={{ margin: '0 0 8px', lineHeight: 1.5, fontWeight: 550 }}>
              Lead your summary with design-systems ownership for Staff FE roles.
            </p>
            <p className="dl-muted" style={{ margin: '0 0 12px', fontSize: 12, lineHeight: 1.45 }}>
              Roles like Vercel / Linear weight portfolio ownership higher than generic FE keywords.
            </p>
            <div className="dash-suggest-actions">
              <button type="button" className="dl-btn dl-btn-ai">Apply to resume</button>
              <button type="button" className="dl-btn-ghost dl-btn">Why this?</button>
            </div>
          </Panel>

          <Panel title="Job matches" action={<button type="button" className="dl-btn-ghost dl-btn">See all</button>}>
            {[
              ['Staff FE', 'Vercel', 92, 0],
              ['Senior FE', 'Linear', 88, 1],
              ['FE Platform', 'Stripe', 85, 2],
            ].map(([r, c, m, tone]) => (
              <div key={r} className="dash-job">
                <CoMark name={c} tone={tone} />
                <div>
                  <strong>{r}</strong>
                  <MetaRow items={[c, 'Remote']} />
                  <div className="dl-bar dash-job-bar"><i style={{ width: `${m}%` }} /></div>
                </div>
                <span className="dl-badge">{m}%</span>
              </div>
            ))}
          </Panel>

          <Panel title="Learning" action={<button type="button" className="dl-btn">Continue</button>}>
            <strong>System Design</strong>
            <div className="dl-bar" style={{ marginTop: 8 }}><i style={{ width: '45%' }} /></div>
            <p className="dl-muted" style={{ margin: '8px 0 0' }}>Week 3 of 6 · next: Caching & CDN</p>
          </Panel>

          <Panel title="Streak & rewards" action={<span className="dl-badge">Level 6</span>}>
            <div className="dash-streak">
              <div className="dash-streak-main">
                <div className="dash-streak-count">4</div>
                <div>
                  <strong>Day streak</strong>
                  <p className="dl-muted" style={{ margin: '2px 0 0' }}>Best · 11 days · don’t break it</p>
                </div>
              </div>
              <div className="dash-streak-week" aria-label="This week’s activity">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={`${d}-${i}`} className={`dash-streak-day${i < 4 ? ' is-done' : ''}${i === 3 ? ' is-today' : ''}`}>
                    <span className="dash-streak-dot" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="dash-xp">
              <div className="dash-xp-row">
                <span>XP this week</span>
                <span className="dl-muted" style={{ fontFamily: 'var(--dl-mono)' }}>420 / 500</span>
              </div>
              <div className="dl-bar" style={{ height: 8 }}><i style={{ width: '84%' }} /></div>
              <p className="dl-muted" style={{ margin: '6px 0 0' }}>80 XP to Level 7 · +15 for today’s ATS fix</p>
            </div>
            <div className="dash-badges">
              <div className="dash-badge-card">
                <strong>First interview</strong>
                <span className="dl-muted">Unlocked</span>
              </div>
              <div className="dash-badge-card">
                <strong>ATS +12</strong>
                <span className="dl-muted">This month</span>
              </div>
              <div className="dash-badge-card is-locked">
                <strong>5 offers</strong>
                <span className="dl-muted">Locked</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* 4. Insights */}
      <section className="dash-insights">
        <div className="dash-insights-hd">
          <h2>Insights</h2>
          <button type="button" className="dl-btn-ghost dl-btn">Open Analytics</button>
        </div>
        <div className="dash-insights-grid">
          <SkillDemandChart />
          <DonutChart title="Pipeline" data={FUNNEL_DONUT} centerValue="8" centerLabel="in play" />
        </div>
      </section>
    </div>
  )
}

function bodyFor(id, isWire) {
  if (id === 'dashboard') return <DashboardBody isWire={isWire} />
  return workspaceBody(id, isWire) ?? <Empty label="Screen stub" cta="Index" />
}

export default function DesignScreenView({ mode }) {
  const { screenId } = useParams()
  const { state = 'default', viewport = 'desktop' } = useOutletContext() || {}
  const screen = getScreen(screenId)
  const isWire = mode === 'wire'
  const hideSide = false

  if (!screen) {
    return <div style={{ padding: 24 }}><Empty label={`Unknown: ${screenId}`} cta="Index" /></div>
  }

  let inner
  if (state === 'loading') inner = <LoadingBlocks />
  else if (state === 'empty') {
    inner = (
      <Empty
        label={({ applications: 'No applications yet', vault: 'Vault is empty', notifications: 'You’re all caught up' })[screenId] || 'Nothing here yet'}
        cta={({ applications: 'Browse jobs', vault: 'Upload', notifications: 'Open Dashboard' })[screenId] || 'Get started'}
      />
    )
  } else {
    inner = (
      <>
        <HeaderFromMeta id={screenId} isWire={isWire} />
        {bodyFor(screenId, isWire)}
      </>
    )
  }

  return (
    <OsShell activeId={screenId} isWire={isWire} hideSide={hideSide} viewport={viewport}>
      {inner}
    </OsShell>
  )
}
