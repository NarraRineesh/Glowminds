/**
 * Full-density hi-fi bodies — same bar as Career Command Center.
 * Each workspace: QuickActions + SplitRail + realistic panels (not stubs).
 */
import { SplitRail, Panel, QuickActions, HelpHint, Stepper } from '../patterns'
import {
  AppCard,
  CoMark,
  DenseTable,
  Field,
  FilterBar,
  JobCard,
  MetaRow,
  StatStrip,
  Toolbar,
} from './uiAtoms'
import {
  ActivityAreaChart,
  AppsLineChart,
  DonutChart,
  FUNNEL_DONUT,
  SalaryBandChart,
  ScoreTrendChart,
  SkillDemandChart,
} from './Charts'

function ScoreRing({ value, size = 56, stroke = 4 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <svg className="dl-ring-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--dl-elevated)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--dl-primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="var(--dl-fg)" fontSize={size * 0.28} fontFamily="var(--dl-mono)" fontWeight="600">
        {value}
      </text>
    </svg>
  )
}

function AiRail({ title, body, cta, extras }) {
  return (
    <Panel title={title || 'AI suggestion'} ai action={<span className="dl-badge-ai dl-badge">AI</span>}>
      <p className="dl-muted" style={{ marginTop: 0, lineHeight: 1.5 }}>{body}</p>
      {extras}
      {cta && <button type="button" className="dl-btn dl-btn-ai" style={{ marginTop: 8 }}>{cta}</button>}
    </Panel>
  )
}

function Wire({ lines }) {
  return (
    <div className="dl-grid" style={{ gap: 8 }}>
      {lines.map((l) => (
        <div key={l} className="dl-wire-box" style={{ minHeight: 48 }}>{l}</div>
      ))}
    </div>
  )
}

export function workspaceBody(id, isWire) {
  if (id === 'ats-report') {
    if (isWire) return <Wire lines={['SCORECARD', 'KEYWORD TABLE', 'AI FIXES']} />
    return (
      <>
        <Toolbar
          left={(
            <>
              <span className="dl-chip">Product FE.pdf</span>
              <span className="dl-badge">vs Vercel Staff FE</span>
            </>
          )}
          right={(
            <>
              <button type="button" className="dl-btn">Switch resume</button>
              <button type="button" className="dl-btn dl-btn-ai">Re-run · 1 cr</button>
              <button type="button" className="dl-btn dl-btn-primary">Edit resume</button>
            </>
          )}
        />
        <StatStrip stats={[
          ['Overall', '81', '+6 vs last'],
          ['Keywords', '72', 'Main drag'],
          ['Content', '84', 'Solid'],
          ['Interview-ready', '85+', '4 pts away'],
        ]} />
        <SplitRail
          main={(
            <>
              <Panel title="Scorecard" action={<span className="dl-badge-ok dl-badge">Strong</span>}>
                <div className="ats-hero">
                  <div className="ats-score-block">
                    <ScoreRing value={81} size={108} stroke={7} />
                    <div>
                      <strong style={{ fontSize: 15 }}>4 points from interview-ready</strong>
                      <p className="dl-muted" style={{ margin: '6px 0 0', lineHeight: 1.5 }}>
                        Keywords are the main drag. Content and formatting look solid for Staff FE roles.
                      </p>
                    </div>
                  </div>
                  <div className="ats-cats">
                    {[['Content', 84], ['Skills', 78], ['Experience', 80], ['Formatting', 88], ['Keywords', 72]].map(([l, v]) => (
                      <div key={l} className="ats-cat">
                        <div className="ats-cat-hd"><span>{l}</span><span className="dl-mono">{v}</span></div>
                        <div className="dl-bar"><i style={{ width: `${v}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
              <Panel title="Keyword coverage" action={<span className="dl-muted">JD · Vercel</span>}>
                <DenseTable
                  columns={['Keyword', 'In JD', 'In resume', 'Status']}
                  rows={[
                    ['Design systems', 'Yes', 'Yes', 'Matched'],
                    ['TypeScript', 'Yes', 'Yes', 'Matched'],
                    ['Web Vitals', 'Yes', 'Yes', 'Matched'],
                    ['GraphQL', 'Yes', 'No', 'Missing'],
                    ['Performance budgets', 'Yes', 'No', 'Missing'],
                    ['Mentorship', 'Yes', 'Weak', 'Thin'],
                  ]}
                />
              </Panel>
            </>
          )}
          rail={(
            <>
              <Panel title="Fix now" ai action={<span className="dl-badge-ai dl-badge">6</span>}>
                <ul className="dl-list ats-fixes">
                  {[
                    ['High', 'Add GraphQL to skills + one experience bullet'],
                    ['High', 'Mirror “Staff” language from JD summary'],
                    ['Med', 'Quantify Stripe adoption (teams / NPS)'],
                    ['Med', 'Tighten summary to 3 ATS-safe lines'],
                  ].map(([sev, t]) => (
                    <li key={t}>
                      <span className={`dl-badge${sev === 'High' ? '-warn' : ''} dl-badge`}>{sev}</span>
                      <span style={{ flex: 1 }}>{t}</span>
                      <button type="button" className="dl-btn dl-btn-ai">Apply</button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="dl-btn dl-btn-primary" style={{ width: '100%', marginTop: 10 }}>Apply all to resume</button>
              </Panel>
              <Panel title="Run history">
                <ul className="dl-list">
                  <li>Today · 81 <span className="dl-badge-ok dl-badge">+6</span></li>
                  <li>Mon · 75 <span className="dl-muted">Product FE</span></li>
                  <li>Last week · 71 <span className="dl-muted">vs Linear JD</span></li>
                </ul>
              </Panel>
            </>
          )}
        />
      </>
    )
  }

  if (id === 'linkedin-hub') {
    if (isWire) return <Wire lines={['STEPPER', 'EXTENSION SETUP', 'PASTE / IMPORT', 'CONTINUE']} />
    return (
      <>
        <Stepper steps={['Import', 'Audit', 'Rewrite']} active={0} />
        <HelpHint>
          Install Chrome Assist → open your LinkedIn profile → copy JSON → paste here. Audit and AI rewrites unlock after import.
        </HelpHint>
        <SplitRail
          main={(
            <Panel title="1 · Get data with LinkedIn Assist" action={<span className="dl-badge">Required</span>}>
              <ol className="li-setup-steps">
                <li>
                  <strong>Add the extension</strong>
                  <p className="dl-muted">Load <code>extensions/linkedin-assist</code> unpacked in Chrome (Developer mode).</p>
                </li>
                <li>
                  <strong>Open your LinkedIn profile</strong>
                  <p className="dl-muted">Click Assist → Copy profile JSON to clipboard.</p>
                </li>
                <li>
                  <strong>Import here</strong>
                  <p className="dl-muted">Paste from clipboard, or fill fields manually / from GlowMinds profile.</p>
                </li>
              </ol>
              <div className="li-import-box" style={{ marginTop: 14 }}>
                <div>
                  <strong>Paste Assist JSON</strong>
                  <p className="dl-muted" style={{ margin: '4px 0 0' }}>Clipboard must contain GlowMinds LinkedIn Assist data.</p>
                </div>
                <button type="button" className="dl-btn dl-btn-primary">Import from clipboard</button>
              </div>
              <div style={{ marginTop: 16 }}>
                <Field label="Headline" value="" hint="Empty until you import or paste" />
                <Field label="About" value="" hint="Paste from LinkedIn or import via Assist" />
                <Field label="Experience" value="" hint="Bullets / roles from Assist" />
              </div>
            </Panel>
          )}
          rail={(
            <>
              <Panel title="Why Assist?">
                <ul className="dl-list">
                  <li>No password sharing with GlowMinds</li>
                  <li>You control what gets copied</li>
                  <li>Re-import anytime after LinkedIn edits</li>
                </ul>
              </Panel>
              <Panel title="Next step">
                <p className="dl-muted" style={{ margin: '0 0 10px' }}>
                  After fields are filled, continue to Audit — AI scores headline, About, experience, and skills.
                </p>
                <button type="button" className="dl-btn" disabled style={{ width: '100%', opacity: 0.55 }}>
                  Continue to Audit
                </button>
                <p className="dl-muted" style={{ margin: '8px 0 0', fontSize: 11 }}>Enabled once import has content</p>
              </Panel>
              <AiRail
                title="Tip"
                body="You can also paste headline / About / experience by hand if you prefer not to use the extension yet."
                cta="Fill from GlowMinds profile"
              />
            </>
          )}
        />
      </>
    )
  }

  if (id === 'linkedin-audit') {
    if (isWire) return <Wire lines={['STEPPER', 'RUN AI AUDIT', 'FINDINGS LIST', 'CONTINUE']} />
    return (
      <>
        <Stepper steps={['Import', 'Audit', 'Rewrite']} active={1} />
        <Toolbar
          left={<span className="dl-badge-warn dl-badge">AI audit · 4 high-priority findings</span>}
          right={(
            <>
              <button type="button" className="dl-btn">Back to import</button>
              <button type="button" className="dl-btn dl-btn-ai">Re-run audit · 2 cr</button>
            </>
          )}
        />
        <SplitRail
          main={(
            <Panel title="Audit findings" action={<span className="dl-muted">Scored just now</span>}>
              <ul className="dl-list li-findings">
                {[
                  ['High', 'Headline', 'Missing “Staff”, Web Perf, and design-systems ownership signal'],
                  ['High', 'About', 'Leads with company name instead of outcomes'],
                  ['Med', 'Experience', 'Stripe bullets lack adoption / LCP metrics'],
                  ['Low', 'Skills', 'GraphQL absent vs target Staff FE JDs'],
                ].map(([sev, area, text]) => (
                  <li key={text}>
                    <span className={`dl-badge${sev === 'High' ? '-warn' : sev === 'Med' ? '' : '-ok'} dl-badge`}>{sev}</span>
                    <div style={{ flex: 1 }}>
                      <strong>{area}</strong>
                      <div className="dl-muted">{text}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <button type="button" className="dl-btn dl-btn-primary" style={{ width: '100%', marginTop: 14 }}>
                Continue to Rewrites
              </button>
            </Panel>
          )}
          rail={(
            <>
              <Panel title="LinkedIn health">
                <div className="ats-score-block" style={{ marginBottom: 12 }}>
                  <ScoreRing value={68} size={72} stroke={5} />
                  <div>
                    <strong>Needs work</strong>
                    <p className="dl-muted" style={{ margin: '4px 0 0' }}>Headline keywords drag the score.</p>
                  </div>
                </div>
                {[['Headline', 52], ['About', 74], ['Experience', 80], ['Keywords', 58]].map(([l, v]) => (
                  <div key={l} style={{ marginBottom: 10 }}>
                    <div className="ats-cat-hd"><span>{l}</span><span className="dl-mono">{v}</span></div>
                    <div className="dl-bar"><i style={{ width: `${v}%` }} /></div>
                  </div>
                ))}
              </Panel>
              <Panel title="Keyword targets">
                <div className="ui-tags">
                  {['Staff', 'Design Systems', 'Web Vitals', 'TypeScript', 'Mentorship'].map((k) => (
                    <span key={k} className="ui-tag">{k}</span>
                  ))}
                </div>
              </Panel>
              <AiRail title="Next" body="Findings are ready — open Rewrites to apply AI fills for headline and About first." cta="Open rewrites" />
            </>
          )}
        />
      </>
    )
  }

  if (id === 'linkedin-rewrite') {
    if (isWire) return <Wire lines={['STEPPER', 'REWRITE CARDS', 'APPLY / COPY']} />
    return (
      <>
        <Stepper steps={['Import', 'Audit', 'Rewrite']} active={2} />
        <Toolbar
          left={<span className="dl-badge-ok dl-badge">4 AI rewrites ready</span>}
          right={(
            <>
              <button type="button" className="dl-btn">Back to audit</button>
              <button type="button" className="dl-btn dl-btn-primary">Copy all</button>
            </>
          )}
        />
        <SplitRail
          main={(
            <Panel title="AI fills & rewrites" action={<span className="dl-muted">Paste back into LinkedIn</span>}>
              {[
                ['Headline', 'Staff Frontend @ GlowMinds · Design Systems', 'Staff Frontend Engineer | Design Systems & Web Perf — systems used by 8 product teams'],
                ['About', 'I work on frontend stuff at GlowMinds…', 'Staff frontend engineer shipping design systems and Web Perf. Led token platform used by 8 teams; cut LCP 28% on core flows.'],
                ['Experience · Stripe', 'Worked on design system components…', 'Owned design-system adoption for 3 product squads; documented Web Vitals budgets; mentored 2 mid engineers.'],
              ].map(([section, before, after]) => (
                <div key={section} className="li-rewrite-card" style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--dl-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>{section}</strong>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="dl-btn dl-btn-ai">Use & copy</button>
                      <button type="button" className="dl-btn">Next variant</button>
                    </div>
                  </div>
                  <p className="li-rewrite-before dl-muted">{before}</p>
                  <p className="li-rewrite-after">{after}</p>
                </div>
              ))}
            </Panel>
          )}
          rail={(
            <>
              <AiRail
                title="Apply order"
                body="Copy headline first (highest leverage), then About, then one experience role. Mark findings done as you paste into LinkedIn."
                cta="Copy headline"
              />
              <Panel title="Imported fields">
                <ul className="dl-list">
                  <li>Headline <span className="dl-check on" style={{ marginLeft: 'auto' }} /></li>
                  <li>About <span className="dl-check on" style={{ marginLeft: 'auto' }} /></li>
                  <li>Experience <span className="dl-check on" style={{ marginLeft: 'auto' }} /></li>
                </ul>
              </Panel>
            </>
          )}
        />
      </>
    )
  }

  if (id === 'job-explorer') {
    if (isWire) return <Wire lines={['SEARCH · TABS · FILTERS', 'JOB GRID', 'MATCH RAIL']} />
    return (
      <>
        <Toolbar
          left={(
            <>
              <div className="os-search" style={{ maxWidth: 320, margin: 0 }}>Search roles, companies… <kbd>/</kbd></div>
              <FilterBar filters={['All', 'Remote', '≥85% match', 'Saved', 'Viewed']} active={2} />
            </>
          )}
          right={(
            <>
              <button type="button" className="dl-btn">Sort: Match</button>
              <button type="button" className="dl-btn">Filters</button>
            </>
          )}
        />
        <StatStrip stats={[
          ['Recommended', '24', 'Based on profile'],
          ['Avg match', '84%', '+3 vs last week'],
          ['Saved', '6', '2 new'],
          ['Applied (30d)', '12', '33% response'],
        ]} />
        <div className="dl-tabs">
          <button type="button" className="is-on">Recommended</button>
          <button type="button">Browse</button>
          <button type="button">Saved</button>
          <button type="button">Viewed</button>
        </div>
        <SplitRail
          main={(
            <Panel title="Roles" action={<span className="dl-muted">Showing 1–6 of 24</span>}>
              <div className="dl-grid" style={{ gap: 10 }}>
                <JobCard company="Vercel" role="Staff Frontend Engineer" loc="Remote" match={92} salary="₹45–60L" posted="2d ago" tags={['Design systems', 'React', 'TypeScript']} tone={0} />
                <JobCard company="Linear" role="Senior Frontend" loc="Remote" match={88} salary="₹40–55L" posted="3d ago" tags={['Product craft', 'TS']} tone={1} />
                <JobCard company="Stripe" role="Frontend Platform" loc="Hybrid" match={85} salary="₹42–58L" posted="5d ago" tags={['Web Perf', 'DX']} tone={2} />
                <JobCard company="Notion" role="UI Engineer" loc="Remote" match={84} salary="₹38–52L" posted="1w ago" tags={['Editor', 'React']} tone={3} />
                <JobCard company="Arc" role="Product Engineer" loc="SF / Remote" match={81} salary="—" posted="1w ago" tags={['Browser', 'Systems']} tone={4} />
                <JobCard company="Figma" role="Design Systems Lead" loc="Remote" match={79} salary="₹48–65L" posted="2w ago" tags={['Tokens', 'Docs']} tone={5} />
              </div>
            </Panel>
          )}
          rail={(
            <>
              <Panel title="Match peek · Vercel">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <CoMark name="Vercel" />
                  <div>
                    <strong>Staff Frontend</strong>
                    <MetaRow items={['92% match', 'Remote']} />
                  </div>
                </div>
                <ul className="dl-list">
                  <li>Design systems ownership ✓</li>
                  <li>Web Vitals metrics ✓</li>
                  <li>GraphQL — gap on resume</li>
                </ul>
                <button type="button" className="dl-btn dl-btn-primary" style={{ width: '100%', marginTop: 10 }}>Open role</button>
              </Panel>
              <Panel title="Active filters">
                <div className="ui-tags">
                  <span className="ui-tag">Remote</span>
                  <span className="ui-tag">Match ≥85%</span>
                  <span className="ui-tag">Frontend</span>
                </div>
                <button type="button" className="dl-btn" style={{ marginTop: 10, width: '100%' }}>Clear all</button>
              </Panel>
              <Panel title="Saved searches">
                <ul className="dl-list">
                  <li>Staff FE remote <span className="dl-muted">12</span></li>
                  <li>Design systems lead <span className="dl-muted">4</span></li>
                </ul>
              </Panel>
            </>
          )}
        />
      </>
    )
  }

  if (id === 'job-details') {
    if (isWire) return <Wire lines={['HERO', 'JD SECTIONS', 'APPLY KIT']} />
    return (
      <>
        <Toolbar
          left={(
            <>
              <button type="button" className="dl-btn">← Jobs</button>
              <CoMark name="Vercel" />
              <div>
                <strong style={{ fontSize: 14 }}>Staff Frontend Engineer</strong>
                <MetaRow items={['Vercel', 'Remote', 'Full-time', 'Posted 2d ago']} />
              </div>
            </>
          )}
          right={(
            <>
              <button type="button" className="dl-btn">Save</button>
              <button type="button" className="dl-btn">Share</button>
              <button type="button" className="dl-btn dl-btn-primary">Apply & track</button>
            </>
          )}
        />
        <div className="jd-hero">
          <div>
            <div className="jd-hero-tags">
              <span className="dl-badge-ok dl-badge">92% match</span>
              <span className="ui-tag">₹45–60L</span>
              <span className="ui-tag">Design systems</span>
              <span className="ui-tag">TypeScript</span>
              <span className="dl-badge-warn dl-badge">1 skill gap</span>
            </div>
            <p className="dl-muted" style={{ margin: '8px 0 0', maxWidth: 560, lineHeight: 1.5 }}>
              Own design systems and performance for the customer dashboard. High craft bar, measurable Web Vitals ownership.
            </p>
          </div>
          <div className="jd-match-ring">
            <ScoreRing value={92} size={72} stroke={5} />
            <span className="dl-muted">Fit score</span>
          </div>
        </div>
        <SplitRail
          ratio="8-4"
          main={(
            <>
              <Panel title="About the role">
                <p style={{ margin: 0, lineHeight: 1.65 }}>
                  You’ll partner with Product on high-craft UI, ship accessible components, and raise Web Vitals across
                  the surface area. Expect design-system ownership, mentoring, and cross-team influence.
                </p>
              </Panel>
              <Panel title="Requirements">
                <ul className="jd-req">
                  <li className="is-hit"><span className="dl-check on" /> 5+ years React / TypeScript</li>
                  <li className="is-hit"><span className="dl-check on" /> Design systems at scale</li>
                  <li className="is-hit"><span className="dl-check on" /> Web Vitals ownership</li>
                  <li className="is-miss"><span className="dl-check" /> GraphQL in production</li>
                  <li className="is-hit"><span className="dl-check on" /> Mentoring / influence</li>
                </ul>
              </Panel>
              <Panel title="Why you match" action={<button type="button" className="dl-btn-ghost dl-btn">Full analysis</button>}>
                <ul className="dl-list">
                  <li>Design systems ownership on resume <span className="dl-badge-ok dl-badge">Strong</span></li>
                  <li>LCP −38% metric aligns with JD <span className="dl-badge-ok dl-badge">Strong</span></li>
                  <li>GraphQL mentioned in JD <span className="dl-badge-warn dl-badge">Gap</span></li>
                </ul>
              </Panel>
              <Panel title="Company">
                <MetaRow items={['Series D', '1,200 employees', 'Remote-first', 'Frontend platform team']} />
                <p className="dl-muted" style={{ margin: '10px 0 0', lineHeight: 1.5 }}>
                  Vercel builds the frontend cloud. This role sits with Dashboard Platform.
                </p>
              </Panel>
            </>
          )}
          rail={(
            <>
              <Panel title="Apply kit" ai>
                <p className="dl-muted" style={{ marginTop: 0 }}>~2 credits for fit + cover letter</p>
                <button type="button" className="dl-btn dl-btn-primary" style={{ width: '100%', marginBottom: 6 }}>Apply & track</button>
                <button type="button" className="dl-btn dl-btn-ai" style={{ width: '100%', marginBottom: 6 }}>Cover letter</button>
                <button type="button" className="dl-btn" style={{ width: '100%', marginBottom: 6 }}>Tailor resume</button>
                <button type="button" className="dl-btn" style={{ width: '100%' }}>Save for later</button>
              </Panel>
              <Panel title="Resume for this role">
                <ul className="dl-list">
                  <li>Product FE · ATS 81 <span className="dl-badge-ok dl-badge">Best</span></li>
                  <li>Staff FE · ATS 74</li>
                </ul>
              </Panel>
              <Panel title="Similar roles">
                <div className="dl-grid" style={{ gap: 8 }}>
                  <JobCard company="Linear" role="Senior Frontend" loc="Remote" match={88} posted="3d" tags={['TS']} tone={1} />
                  <JobCard company="Stripe" role="FE Platform" loc="Hybrid" match={85} posted="5d" tags={['Perf']} tone={2} />
                </div>
              </Panel>
            </>
          )}
        />
      </>
    )
  }

  if (id === 'applications') {
    if (isWire) return <Wire lines={['FUNNEL SUMMARY', 'BOARD 5 COLS', 'NEXT STEPS']} />
    return (
      <>
        <Toolbar
          left={(
            <>
              <button type="button" className="dl-btn">Board</button>
              <button type="button" className="dl-chip">List</button>
              <FilterBar filters={['All', 'This week', 'Interviews', 'Needs follow-up']} />
            </>
          )}
          right={<button type="button" className="dl-btn dl-btn-primary">Add application</button>}
        />
        <StatStrip stats={[
          ['Saved', '2', ''],
          ['Applied', '5', '2 awaiting'],
          ['Interview', '2', 'Thu · Mon'],
          ['Offer', '0', ''],
        ]} />
        <div className="dl-kanban">
          {[
            ['Saved', [['Arc', 'UI Eng', '81%', 'Review JD', 4]]],
            ['Applied', [
              ['Vercel', 'Staff FE', '92%', 'Follow up Fri', 0],
              ['Linear', 'Senior FE', '88%', 'Wait 5d', 1],
              ['Notion', 'Product Eng', '84%', 'CL sent', 3],
            ]],
            ['Interview', [
              ['Stripe', 'Frontend', '85%', 'Prep Thu 4pm', 2],
              ['Figma', 'DS Lead', '79%', 'Behavioral', 5],
            ]],
            ['Offer', []],
            ['Rejected', [['Acme', 'FE', '70%', 'Archive', 1]]],
          ].map(([col, cards]) => (
            <div key={col} className="dl-kanban-col">
              <h4>{col} <span>{cards.length}</span></h4>
              {cards.map(([co, role, m, next, tone]) => (
                <AppCard key={co + role} company={co} role={role} match={m} next={next} tone={tone} />
              ))}
              {!cards.length && <p className="dl-muted" style={{ fontSize: 11, padding: 8 }}>Empty</p>}
            </div>
          ))}
        </div>
        <HelpHint>Each card shows company mark, match, and next step — CRM density, not empty columns.</HelpHint>
      </>
    )
  }

  if (id === 'skills') {
    if (isWire) return <Wire lines={['TABS', 'GAP LIST', 'DEMAND · AI']} />
    return (
      <>
        <QuickActions items={[{ label: 'Analyze gap', ai: true }, { label: 'Edit my skills' }, { label: 'Open Learning' }]} />
        <div className="dl-tabs">
          <button type="button">My Skills</button>
          <button type="button" className="is-on">Skill Gap</button>
          <button type="button">Market Demand</button>
        </div>
        <SplitRail
          main={(
            <Panel title="Gap for Staff Frontend" action={<span className="dl-muted">Last run · Today</span>}>
              <div className="os-search" style={{ maxWidth: 'none', marginBottom: 12 }}>Target role: Staff Frontend Engineer</div>
              <DenseTable
                columns={['Skill', 'Importance', 'Signal', 'Action']}
                rows={[
                  ['GraphQL', 'High', '12 open roles', 'Learn'],
                  ['System design storytelling', 'High', 'Interview', 'Practice'],
                  ['WebPerf budgets', 'Med', 'JD keyword', 'Review'],
                  ['Mentoring narratives', 'Med', 'Staff bar', 'Draft'],
                ]}
              />
              <div style={{ marginTop: 16 }}>
                <SkillDemandChart />
              </div>
              <div style={{ marginTop: 14 }}>
                <h2 style={{ fontSize: 13, margin: '0 0 8px' }}>You already have</h2>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['React', 'TypeScript', 'Design Systems', 'Accessibility', 'Vite'].map((s) => (
                    <span key={s} className="dl-chip">{s}</span>
                  ))}
                </div>
              </div>
            </Panel>
          )}
          rail={(
            <>
              <AiRail title="Close the gap" body="A 3-week GraphQL + storytelling path maps to 12 open roles in your target set." cta="Generate learning path · 2 cr" />
              <Panel title="Market demand">
                <ul className="dl-list">
                  <li>TypeScript <span className="dl-badge-ok dl-badge">Hot</span></li>
                  <li>Design systems <span className="dl-badge-ok dl-badge">Hot</span></li>
                  <li>GraphQL <span className="dl-badge-warn dl-badge">Rising</span></li>
                </ul>
              </Panel>
            </>
          )}
        />
      </>
    )
  }

  if (id === 'learning') {
    if (isWire) return <Wire lines={['STREAK', 'CONTINUE PATH', 'GENERATE · RECS']} />
    return (
      <>
        <QuickActions items={[{ label: 'Continue path' }, { label: 'Generate path', ai: true }, { label: 'View history' }]} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span className="dl-chip">Streak 4 days</span>
          <span className="dl-chip">6.5h this month</span>
          <span className="dl-chip">1 active path</span>
        </div>
        <SplitRail
          main={(
            <>
              <Panel title="Continue · System Design">
                <div className="dl-bar" style={{ height: 8 }}><i style={{ width: '45%' }} /></div>
                <p className="dl-muted" style={{ margin: '10px 0' }}>Week 3 of 6 · next lesson: Caching patterns</p>
                <ul className="dl-list">
                  <li><span className="dl-check on" /> Week 1 · Foundations</li>
                  <li><span className="dl-check on" /> Week 2 · Load balancing</li>
                  <li><span className="dl-check" /><span style={{ flex: 1 }}>Week 3 · Caching</span><span className="dl-badge">Now</span></li>
                  <li><span className="dl-check" /> Week 4 · Data stores</li>
                </ul>
                <button type="button" className="dl-btn dl-btn-primary" style={{ marginTop: 10 }}>Resume week 3</button>
              </Panel>
              <Panel title="Recommendations">
                <ul className="dl-list">
                  <li>GraphQL for Staff FE <span className="dl-badge">From gap</span></li>
                  <li>Behavioral story bank <span className="dl-badge">Interview</span></li>
                </ul>
              </Panel>
            </>
          )}
          rail={(
            <>
              <Panel title="Generate path" ai>
                <p className="dl-muted">From skill gap · ~2 credits</p>
                <button type="button" className="dl-btn dl-btn-ai">Create with AI</button>
              </Panel>
              <Panel title="Weekly plan">
                <ul className="dl-list">
                  <li>Mon · 45m caching</li>
                  <li>Wed · 30m GraphQL intro</li>
                  <li>Fri · Mock interview</li>
                </ul>
              </Panel>
            </>
          )}
        />
      </>
    )
  }

  if (id === 'interview') {
    if (isWire) return <Wire lines={['SETUP SIDEBAR', 'EMPTY STATE', 'HISTORY']} />
    return (
      <SplitRail
        main={(
          <>
            <Panel title="Practice your next interview">
              <p className="dl-muted" style={{ marginBottom: 12 }}>
                Set a role and question style in the sidebar, then start a mock. Graded when you submit.
              </p>
              <div className="dl-grid dl-grid-3">
                {[
                  ['Mixed', 'All question types', '10 Q'],
                  ['Technical', 'Coding & concepts', '10 Q'],
                  ['Behavioral', 'STAR scenarios', '10 Q'],
                ].map(([t, d, q]) => (
                  <div key={t} className="dl-card" style={{ textAlign: 'left' }}>
                    <strong>{t}</strong>
                    <div className="dl-muted" style={{ marginTop: 4 }}>{d}</div>
                    <div className="dl-muted" style={{ marginTop: 8, fontSize: 11 }}>{q}</div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Recent sessions">
              <ul className="dl-list">
                <li>Frontend MCQ · 76% <span className="dl-muted">Mon</span></li>
                <li>Behavioral · 82% <span className="dl-muted">Last week</span></li>
              </ul>
            </Panel>
          </>
        )}
        rail={(
          <>
            <Panel title="Target role">
              <div className="os-search" style={{ maxWidth: 'none' }}>Staff Frontend Engineer</div>
            </Panel>
            <Panel title="Session preferences">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span className="dl-chip">Type: Mixed</span>
                <span className="dl-chip">10 questions</span>
              </div>
              <button type="button" className="dl-btn dl-btn-ai" style={{ width: '100%' }}>Start mock · 10 credits</button>
            </Panel>
            <Panel title="Last score">
              <ScoreRing value={76} size={72} stroke={5} />
              <p className="dl-muted" style={{ marginTop: 8 }}>Frontend MCQ · weak: hooks edge cases</p>
              <button type="button" className="dl-btn" style={{ marginTop: 8, width: '100%' }}>Reuse this setup</button>
            </Panel>
          </>
        )}
      />
    )
  }

  if (id === 'ai-coach') {
    if (isWire) return <Wire lines={['CONTEXT', 'THREAD', 'SEEDS · COST']} />
    return (
      <SplitRail
        ratio="8-4"
        main={(
          <Panel title="GLOWMINDS AI">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="dl-badge-ai dl-badge">Context · Vercel Staff FE</span>
              <span className="dl-muted">1 credit / message</span>
              <button type="button" className="dl-btn" style={{ marginLeft: 'auto' }}>New chat</button>
            </div>
            <ul className="dl-list" style={{ minHeight: 280 }}>
              <li style={{ background: 'var(--dl-primary-soft)', alignSelf: 'flex-end' }}>
                How should I position design-systems ownership for Staff FE?
              </li>
              <li style={{ background: 'var(--dl-ai-soft)', border: '1px solid color-mix(in srgb, var(--dl-ai) 25%, transparent)' }}>
                Lead with cross-team adoption and measurable outcomes (LCP −38%, 8 teams on the system).
                Open with a 2-line ownership statement, then 3 proof points…
              </li>
            </ul>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <div className="os-search" style={{ flex: 1, maxWidth: 'none' }}>Ask GLOWMINDS AI anything about your career…</div>
              <button type="button" className="dl-btn dl-btn-ai">Send · 1 cr</button>
            </div>
          </Panel>
        )}
        rail={(
          <>
            <Panel title="Quick seeds">
              <QuickActions items={[{ label: 'Improve resume', ai: true }, { label: 'Negotiate offer' }, { label: 'Interview plan', ai: true }, { label: 'LinkedIn rewrite', ai: true }]} />
            </Panel>
            <Panel title="Chats">
              <ul className="dl-list">
                <li>Vercel Staff positioning</li>
                <li>Salary negotiation</li>
                <li>Career switch advice</li>
              </ul>
            </Panel>
          </>
        )}
      />
    )
  }

  if (id === 'analytics') {
    if (isWire) return <Wire lines={['LINE CHART', 'DONUT', 'TABLES']} />
    return (
      <>
        <Toolbar
          left={<FilterBar filters={['7d', '30d', '90d', 'Custom']} active={1} />}
          right={(
            <>
              <button type="button" className="dl-btn">Export CSV</button>
              <button type="button" className="dl-btn">Share</button>
            </>
          )}
        />
        <StatStrip stats={[
          ['Applications', '12', '+3'],
          ['Interviews', '4', '+1'],
          ['Response rate', '33%', '+5%'],
          ['Offers', '0', '—'],
        ]} />
        <div className="dl-grid dl-grid-2" style={{ marginBottom: 12 }}>
          <AppsLineChart />
          <DonutChart title="Pipeline mix" data={FUNNEL_DONUT} centerValue="10" centerLabel="active" />
        </div>
        <div className="dl-grid dl-grid-2" style={{ marginBottom: 12 }}>
          <DonutChart title="By category" centerValue="60%" centerLabel="Frontend" />
          <ScoreTrendChart />
        </div>
        <SplitRail
          main={(
            <Panel title="Top companies" action={<span className="dl-muted">Sort · apps</span>}>
              <DenseTable
                columns={['Company', 'Apps', 'Stage', 'Match avg', 'Last update']}
                rows={[
                  [<span key="a" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><CoMark name="Vercel" /><span>Vercel</span></span>, '2', 'Applied', '90%', '2d ago'],
                  [<span key="b" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><CoMark name="Stripe" tone={2} /><span>Stripe</span></span>, '1', 'Interview', '85%', 'Today'],
                  [<span key="c" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><CoMark name="Linear" tone={1} /><span>Linear</span></span>, '1', 'Applied', '88%', '3d ago'],
                  [<span key="d" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><CoMark name="Notion" tone={3} /><span>Notion</span></span>, '1', 'Interview', '84%', '5d ago'],
                  [<span key="e" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><CoMark name="Figma" tone={5} /><span>Figma</span></span>, '1', 'Rejected', '79%', '1w ago'],
                ]}
              />
            </Panel>
          )}
          rail={(
            <Panel title="Conversion table">
              <DenseTable
                columns={['Step', 'Count', 'Conv.']}
                rows={[
                  ['Saved → Applied', '5 / 8', '63%'],
                  ['Applied → Screen', '3 / 5', '60%'],
                  ['Screen → Interview', '2 / 3', '67%'],
                  ['Interview → Offer', '0 / 2', '0%'],
                ]}
              />
            </Panel>
          )}
        />
      </>
    )
  }

  if (id === 'vault') {
    if (isWire) return <Wire lines={['FOLDERS', 'UPLOAD', 'FILE LIST']} />
    return (
      <SplitRail
        main={(
          <Panel title="Resumes" action={<span className="dl-muted">2 files</span>}>
            <ul className="dl-list">
              {[
                ['Product_FE.pdf', '240 KB · Today'],
                ['Staff_FE.pdf', '220 KB · 2d ago'],
              ].map(([n, meta]) => (
                <li key={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block' }}>{n}</strong>
                    <span className="dl-muted">{meta}</span>
                  </div>
                  <button type="button" className="dl-btn">Download</button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        rail={(
          <>
            <Panel title="Upload">
              <button type="button" className="dl-btn dl-btn-primary" style={{ width: '100%' }}>Upload file</button>
              <p className="dl-muted" style={{ margin: '8px 0 0', fontSize: 11 }}>Saves under your account · max 5 MB</p>
            </Panel>
            <Panel title="Folders">
              <ul className="dl-list">
                <li>All files <span className="dl-muted" style={{ marginLeft: 'auto' }}>6</span></li>
                <li><strong>Resumes</strong> <span className="dl-muted" style={{ marginLeft: 'auto' }}>2</span></li>
                <li>Certificates <span className="dl-muted" style={{ marginLeft: 'auto' }}>1</span></li>
                <li>Offer letters <span className="dl-muted" style={{ marginLeft: 'auto' }}>1</span></li>
              </ul>
            </Panel>
            <Panel title="Storage">
              <div className="dl-bar" style={{ height: 8 }}><i style={{ width: '24%' }} /></div>
              <p className="dl-muted" style={{ margin: '8px 0 0' }}>120 MB of 500 MB</p>
            </Panel>
          </>
        )}
      />
    )
  }

  if (id === 'salary') {
    if (isWire) return <Wire lines={['FILTERS', 'RANGE TABLE', 'NEGOTIATE AI']} />
    return (
      <>
        <QuickActions items={[{ label: 'Update expected CTC' }, { label: 'Negotiate script', ai: true }, { label: 'Save combo' }]} />
        <SplitRail
          main={(
            <>
              <Panel title="Senior Frontend · Hyderabad">
                <p style={{ fontFamily: 'var(--dl-mono)', fontSize: 26, fontWeight: 600, margin: '0 0 8px' }}>₹28L – ₹42L</p>
                <p className="dl-muted" style={{ margin: '0 0 14px' }}>Your expected CTC (₹36L) sits near the 60th percentile for this band.</p>
                <SalaryBandChart />
              </Panel>
              <Panel title="Band table">
                <DenseTable
                  columns={['Level', 'P25', 'P50', 'P75', 'Your CTC']}
                  rows={[
                    ['Mid', '₹18L', '₹24L', '₹30L', '—'],
                    ['Senior', '₹28L', '₹34L', '₹42L', '₹36L'],
                    ['Staff', '₹40L', '₹48L', '₹60L', '—'],
                  ]}
                />
              </Panel>
            </>
          )}
          rail={(
            <>
              <Panel title="Filters">
                <ul className="dl-list">
                  <li>Role · Frontend</li>
                  <li>Level · Senior</li>
                  <li>City · Hyderabad</li>
                </ul>
              </Panel>
              <AiRail title="Negotiate" body="Script tailored to Stripe band + your design-systems leverage. Includes anchors and walk-away." cta="Generate script · 1 cr" />
            </>
          )}
        />
      </>
    )
  }


  if (['cover-letter', 'grammar', 'paraphrase'].includes(id)) {
    if (isWire) return <Wire lines={['INPUT', 'RESULT', 'VARIANTS']} />
    if (id === 'paraphrase') {
      return (
        <SplitRail
          main={(
            <>
              <Panel title="Original text">
                <div className="rw-pane">
                  I worked on a side project for 3 months that helps students discover internships, and it now has 1200 weekly users.
                </div>
                <p className="dl-muted" style={{ margin: '8px 0 0' }}>48 words</p>
              </Panel>
              <Panel title="Variants" ai>
                <ul className="dl-list">
                  <li><strong>A · Confident</strong><span className="dl-muted" style={{ flex: 1 }}>Staff signal + metrics</span><button type="button" className="dl-btn">Use</button></li>
                  <li><strong>B · Concise</strong><span className="dl-muted" style={{ flex: 1 }}>2 lines · ATS-safe</span><button type="button" className="dl-btn">Use</button></li>
                  <li><strong>C · Warm</strong><span className="dl-muted" style={{ flex: 1 }}>Mentorship emphasis</span><button type="button" className="dl-btn">Use</button></li>
                </ul>
              </Panel>
            </>
          )}
          rail={(
            <>
              <Panel title="What to rewrite">
                <ul className="dl-list">
                  <li><strong>About</strong> <span className="dl-check on" style={{ marginLeft: 'auto' }} /></li>
                  <li>Headline</li>
                  <li>Bullet</li>
                  <li>Cover letter</li>
                </ul>
              </Panel>
              <Panel title="Preferences">
                <div className="os-search" style={{ maxWidth: 'none', marginBottom: 10 }}>Tone · Confident</div>
                <button type="button" className="dl-btn dl-btn-ai" style={{ width: '100%' }}>Generate variants · 1 cr</button>
                <button type="button" className="dl-btn" style={{ width: '100%', marginTop: 8 }}>Load sample text</button>
              </Panel>
            </>
          )}
        />
      )
    }
    const titles = {
      'cover-letter': ['Cover letter for Vercel', 'Generate tailored letter', 'Templates · Cold email'],
      grammar: ['Grammar check', 'Paste writing to polish', 'Sample text'],
    }
    const [panelTitle, placeholder, side] = titles[id]
    return (
      <>
        <QuickActions items={[{ label: 'Generate · 1 cr', ai: true }, { label: side }, { label: 'Copy result' }]} />
        <SplitRail
          main={(
            <Panel title={panelTitle}>
              {id === 'cover-letter' && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span className="dl-chip">Template: Product</span>
                  <span className="dl-chip">Job: Vercel Staff FE</span>
                </div>
              )}
              <div className="dl-card" style={{ minHeight: 160, background: 'var(--dl-elevated)' }}>
                <p className="dl-muted" style={{ margin: 0 }}>{placeholder}…</p>
              </div>
            </Panel>
          )}
          rail={(
            <>
              <AiRail title="Results" body="Variant A ready — confident tone, ATS-safe length, mirrors JD keywords." cta="Copy" />
              <Panel title="Variants">
                <ul className="dl-list">
                  <li>Variant A <button type="button" className="dl-btn">Use</button></li>
                  <li>Variant B <button type="button" className="dl-btn">Use</button></li>
                  <li>Variant C <button type="button" className="dl-btn">Use</button></li>
                </ul>
              </Panel>
            </>
          )}
        />
      </>
    )
  }

  if (id === 'settings') {
    if (isWire) return <Wire lines={['NAV', 'ACCOUNT', 'GAMIFICATION', 'PRIVACY · BILLING']} />
    return (
      <div className="set-layout">
        <aside className="set-nav">
          {['Account', 'Gamification', 'Billing', 'Usage', 'Appearance', 'Notifications', 'Privacy', 'Integrations'].map((s, i) => (
            <button key={s} type="button" className={i === 1 ? 'is-on' : ''}>{s}</button>
          ))}
        </aside>
        <div className="set-main">
          <Panel title="Level & streak" action={<span className="dl-badge">Level 6</span>}>
            <div className="dash-streak">
              <div className="dash-streak-main">
                <div className="dash-streak-count">4</div>
                <div>
                  <strong>Day streak</strong>
                  <p className="dl-muted" style={{ margin: '2px 0 0' }}>Best · 11 days · current Level 6</p>
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
              <p className="dl-muted" style={{ margin: '6px 0 0' }}>80 XP to Level 7</p>
            </div>
          </Panel>

          <Panel title="Badges" action={<span className="dl-muted">2 unlocked</span>}>
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
              <div className="dash-badge-card is-locked">
                <strong>30-day streak</strong>
                <span className="dl-muted">Locked</span>
              </div>
              <div className="dash-badge-card is-locked">
                <strong>Staff offer</strong>
                <span className="dl-muted">Locked</span>
              </div>
              <div className="dash-badge-card is-locked">
                <strong>Public profile 1k</strong>
                <span className="dl-muted">Locked</span>
              </div>
            </div>
          </Panel>

          <Panel title="Gamification preferences">
            <ul className="dl-list">
              <li>Show streak on dashboard <span className="dl-check on" style={{ marginLeft: 'auto' }} /></li>
              <li>Celebrate level-ups <span className="dl-check on" style={{ marginLeft: 'auto' }} /></li>
              <li>XP reminders when streak at risk <span className="dl-check on" style={{ marginLeft: 'auto' }} /></li>
            </ul>
          </Panel>

          <Panel title="How XP works">
            <ul className="dl-list">
              <li>Daily check-in / learning <span className="dl-muted">+10–25</span></li>
              <li>ATS improvement ≥5 pts <span className="dl-muted">+15</span></li>
              <li>Apply to matched role <span className="dl-muted">+20</span></li>
              <li>Complete mock interview <span className="dl-muted">+30</span></li>
            </ul>
          </Panel>

          <Panel title="Account">
            <div className="set-row">
              <div>
                <strong>Rineesh Narra</strong>
                <div className="dl-muted">rineesh@glowminds.app</div>
              </div>
              <button type="button" className="dl-btn">Edit profile</button>
            </div>
          </Panel>
        </div>
      </div>
    )
  }

  if (id === 'notifications') {
    if (isWire) return <Wire lines={['FILTERS', 'PRIORITY', 'INBOX']} />
    return (
      <>
        <Toolbar
          left={<FilterBar filters={['All', 'Unread', 'Jobs', 'Interviews', 'Learning', 'System']} active={1} />}
          right={<button type="button" className="dl-btn">Mark all read</button>}
        />
        <SplitRail
          main={(
            <>
              <Panel title="Needs action" action={<span className="dl-badge-warn dl-badge">2</span>}>
                <ul className="dl-list n-list">
                  <li className="is-unread">
                    <span className="n-dot warn" />
                    <div style={{ flex: 1 }}>
                      <strong>Interview tomorrow · Stripe</strong>
                      <div className="dl-muted">Thu 4:00 PM · Round 2 · Prep pack ready</div>
                    </div>
                    <button type="button" className="dl-btn dl-btn-primary">Prep</button>
                  </li>
                  <li className="is-unread">
                    <span className="n-dot warn" />
                    <div style={{ flex: 1 }}>
                      <strong>Learning streak at risk</strong>
                      <div className="dl-muted">Continue System Design · Caching & CDN</div>
                    </div>
                    <button type="button" className="dl-btn">Continue</button>
                  </li>
                </ul>
              </Panel>
              <Panel title="Inbox" action={<span className="dl-badge">3 unread</span>}>
                <ul className="dl-list n-list">
                  {[
                    ['ATS improved to 81', 'Product FE · View report', 'Today', true],
                    ['New match · Linear Senior FE', '88% · View job', 'Yday', true],
                    ['Application update · Notion', 'Moved to Interview', 'Mon', false],
                    ['Weekly digest', '5 apps · 2 interviews', 'Sun', false],
                  ].map(([t, s, when, unread]) => (
                    <li key={t} className={unread ? 'is-unread' : ''}>
                      <span className={`n-dot${unread ? ' on' : ''}`} />
                      <div style={{ flex: 1 }}>
                        <strong>{t}</strong>
                        <div className="dl-muted">{s}</div>
                      </div>
                      <span className="dl-muted">{when}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}
          rail={(
            <>
              <AiRail title="Prioritize" body="Prep Stripe first — highest leverage action in the next 24 hours." cta="Start interview prep" />
              <Panel title="Preferences">
                <ul className="dl-list">
                  <li>Interview reminders <span className="dl-check on" style={{ marginLeft: 'auto' }} /></li>
                  <li>Job matches ≥85% <span className="dl-check on" style={{ marginLeft: 'auto' }} /></li>
                  <li>Weekly digest <span className="dl-check on" style={{ marginLeft: 'auto' }} /></li>
                  <li>Marketing <span className="dl-check" style={{ marginLeft: 'auto' }} /></li>
                </ul>
              </Panel>
            </>
          )}
        />
      </>
    )
  }

  if (id === 'career-timeline') {
    if (isWire) return <Wire lines={['FILTERS', 'MILESTONES', 'ACTIVITY']} />
    return (
      <>
        <Toolbar
          left={<FilterBar filters={['All', 'Apps', 'ATS', 'Learning', 'Interviews', 'LinkedIn']} active={0} />}
          right={(
            <>
              <button type="button" className="dl-chip">7d</button>
              <button type="button" className="dl-btn">30d</button>
              <button type="button" className="dl-chip">All</button>
            </>
          )}
        />
        <StatStrip stats={[
          ['Events', '18', 'Last 30 days'],
          ['ATS lifts', '+10', 'Two runs'],
          ['Apps', '5', '1 interview'],
          ['Learning', '3.5h', 'Streak 4'],
        ]} />
        <SplitRail
          main={(
            <Panel title="Chronology">
              <div className="tl">
                {[
                  ['Today', [
                    ['ATS', 'ATS score 81 · Product FE', 'ATS Report', 'ok'],
                    ['App', 'Saved · Stripe FE Platform', 'Jobs', ''],
                  ]],
                  ['Yesterday', [
                    ['App', 'Applied · Vercel Staff FE', 'Applications', 'ok'],
                  ]],
                  ['Mon', [
                    ['Interview', 'Mock interview 76%', 'Interview', ''],
                    ['Learn', 'System Design W3 started', 'Learning', ''],
                  ]],
                  ['Sun', [
                    ['LinkedIn', 'Profile synced via Assist', 'LinkedIn Hub', ''],
                  ]],
                ].map(([day, items]) => (
                  <div key={day} className="tl-day">
                    <div className="tl-day-label">{day}</div>
                    {items.map(([type, text, jump, tone]) => (
                      <div key={text} className="tl-item">
                        <span className={`tl-dot ${tone}`} />
                        <div style={{ flex: 1 }}>
                          <span className="dl-badge">{type}</span>
                          <strong style={{ marginLeft: 8 }}>{text}</strong>
                        </div>
                        <button type="button" className="dl-btn">{jump}</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Panel>
          )}
          rail={(
            <>
              <AiRail title="Pattern" body="Score improvements cluster after LinkedIn sync + ATS loops. Keep that cadence before Thursday’s interview." cta="Open Dashboard" />
              <Panel title="Milestones">
                <ul className="dl-list">
                  <li>First interview unlocked</li>
                  <li>ATS crossed 80</li>
                  <li>4-day learning streak</li>
                </ul>
              </Panel>
            </>
          )}
        />
      </>
    )
  }

  return null
}
