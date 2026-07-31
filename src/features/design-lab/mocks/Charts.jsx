import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const GRID = 'color-mix(in srgb, var(--dl-muted) 22%, transparent)'
const AXIS = 'var(--dl-muted)'
const PRIMARY = 'var(--dl-primary)'
const AI = 'var(--dl-ai)'
const SUCCESS = 'var(--dl-success)'
const WARNING = 'var(--dl-warning)'

const tooltipStyle = {
  background: 'var(--dl-card)',
  border: '1px solid var(--dl-border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--dl-fg)',
}

export const APPS_OVER_TIME = [
  { d: 'Mar 1', apps: 1, interviews: 0, responses: 0 },
  { d: 'Mar 5', apps: 2, interviews: 0, responses: 1 },
  { d: 'Mar 9', apps: 1, interviews: 1, responses: 0 },
  { d: 'Mar 13', apps: 3, interviews: 0, responses: 1 },
  { d: 'Mar 17', apps: 2, interviews: 1, responses: 1 },
  { d: 'Mar 21', apps: 2, interviews: 1, responses: 0 },
  { d: 'Mar 25', apps: 1, interviews: 1, responses: 1 },
  { d: 'Mar 29', apps: 2, interviews: 0, responses: 1 },
]

export const WEEKLY_ACTIVITY = [
  { d: 'Mon', apps: 1, learn: 0.5, mocks: 0 },
  { d: 'Tue', apps: 2, learn: 1.0, mocks: 1 },
  { d: 'Wed', apps: 0, learn: 0.8, mocks: 0 },
  { d: 'Thu', apps: 2, learn: 1.2, mocks: 0 },
  { d: 'Fri', apps: 1, learn: 0.6, mocks: 1 },
  { d: 'Sat', apps: 0, learn: 1.5, mocks: 0 },
  { d: 'Sun', apps: 1, learn: 0.9, mocks: 0 },
]

export const CATEGORY_DONUT = [
  { name: 'Frontend', value: 60, color: 'var(--dl-primary)' },
  { name: 'Full-stack', value: 25, color: 'var(--dl-ai)' },
  { name: 'Other', value: 15, color: 'var(--dl-warning)' },
]

export const FUNNEL_DONUT = [
  { name: 'Applied', value: 5, color: 'var(--dl-primary)' },
  { name: 'Interview', value: 2, color: 'var(--dl-ai)' },
  { name: 'Offer', value: 0, color: 'var(--dl-success)' },
  { name: 'Rejected', value: 1, color: 'var(--dl-danger)' },
]

export const SCORE_TREND = [
  { d: 'W1', career: 62, resume: 70, linkedin: 58, profile: 68 },
  { d: 'W2', career: 66, resume: 74, linkedin: 61, profile: 71 },
  { d: 'W3', career: 70, resume: 78, linkedin: 64, profile: 75 },
  { d: 'W4', career: 74, resume: 81, linkedin: 68, profile: 79 },
]

export const SALARY_BAND = [
  { level: 'Mid', p25: 18, p50: 24, p75: 30 },
  { level: 'Senior', p25: 28, p50: 34, p75: 42 },
  { level: 'Staff', p25: 40, p50: 48, p75: 60 },
]

export const SKILL_DEMAND = [
  { skill: 'TypeScript', demand: 92, you: 88 },
  { skill: 'Design systems', demand: 84, you: 90 },
  { skill: 'GraphQL', demand: 78, you: 35 },
  { skill: 'Web Perf', demand: 74, you: 70 },
  { skill: 'System design', demand: 80, you: 55 },
]

function ChartFrame({ title, action, height = 220, children, legend }) {
  return (
    <div className="ui-chart">
      {(title || action) && (
        <div className="ui-chart-hd">
          {title ? <h3>{title}</h3> : <span />}
          {action}
        </div>
      )}
      <div className="ui-chart-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      {legend && <div className="ui-chart-legend">{legend}</div>}
    </div>
  )
}

export function AppsLineChart({ data = APPS_OVER_TIME }) {
  return (
    <ChartFrame
      title="Applications over time"
      action={<span className="dl-muted">30 days</span>}
      height={240}
      legend={(
        <>
          <span className="ui-leg"><i style={{ background: PRIMARY }} /> Applications</span>
          <span className="ui-leg"><i style={{ background: AI }} /> Interviews</span>
          <span className="ui-leg"><i style={{ background: SUCCESS }} /> Responses</span>
        </>
      )}
    >
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="d" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="apps" stroke={PRIMARY} strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="interviews" stroke={AI} strokeWidth={2} dot={{ r: 2.5 }} />
        <Line type="monotone" dataKey="responses" stroke={SUCCESS} strokeWidth={2} dot={{ r: 2.5 }} />
      </LineChart>
    </ChartFrame>
  )
}

export function ActivityAreaChart({ data = WEEKLY_ACTIVITY }) {
  return (
    <ChartFrame
      title="Weekly activity"
      action={<span className="dl-muted">This week</span>}
      height={200}
      legend={(
        <>
          <span className="ui-leg"><i style={{ background: PRIMARY }} /> Apps</span>
          <span className="ui-leg"><i style={{ background: AI }} /> Learning (h)</span>
        </>
      )}
    >
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="dlAppsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="d" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="apps" stroke={PRIMARY} fill="url(#dlAppsFill)" strokeWidth={2} />
        <Line type="monotone" dataKey="learn" stroke={AI} strokeWidth={2} dot={false} />
      </ComposedChart>
    </ChartFrame>
  )
}

export function ScoreTrendChart({ data = SCORE_TREND }) {
  return (
    <ChartFrame
      title="Score trends"
      action={<span className="dl-muted">4 weeks</span>}
      height={200}
      legend={(
        <>
          <span className="ui-leg"><i style={{ background: PRIMARY }} /> Career</span>
          <span className="ui-leg"><i style={{ background: AI }} /> Resume</span>
          <span className="ui-leg"><i style={{ background: SUCCESS }} /> LinkedIn</span>
          <span className="ui-leg"><i style={{ background: 'var(--dl-profile, #a78bfa)' }} /> Profile</span>
        </>
      )}
    >
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="d" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[50, 100]} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="career" stroke={PRIMARY} strokeWidth={2.2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="resume" stroke={AI} strokeWidth={2} dot={{ r: 2.5 }} />
        <Line type="monotone" dataKey="linkedin" stroke={SUCCESS} strokeWidth={2} dot={{ r: 2.5 }} />
        <Line type="monotone" dataKey="profile" stroke="var(--dl-profile, #a78bfa)" strokeWidth={2} dot={{ r: 2.5 }} />
      </LineChart>
    </ChartFrame>
  )
}

export function DonutChart({
  data = CATEGORY_DONUT,
  title = 'By category',
  centerLabel,
  centerValue,
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1
  return (
    <div className="ui-chart">
      {title && (
        <div className="ui-chart-hd">
          <h3>{title}</h3>
        </div>
      )}
      <div className="ui-chart-body ui-donut-wrap" style={{ height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={78}
              paddingAngle={3}
              stroke="var(--dl-card)"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerValue) && (
          <div className="ui-donut-center">
            {centerValue && <strong>{centerValue}</strong>}
            {centerLabel && <span>{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="ui-chart-legend">
        {data.map((d) => (
          <span key={d.name} className="ui-leg">
            <i style={{ background: d.color }} />
            {d.name} · {Math.round((d.value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  )
}

export function SkillDemandChart({ data = SKILL_DEMAND }) {
  return (
    <ChartFrame
      title="Skills · demand vs you"
      height={220}
      legend={(
        <>
          <span className="ui-leg"><i style={{ background: PRIMARY }} /> Market demand</span>
          <span className="ui-leg"><i style={{ background: AI }} /> Your coverage</span>
        </>
      )}
    >
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="skill" tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={48} />
        <YAxis domain={[0, 100]} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="demand" stroke={PRIMARY} strokeWidth={2.2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="you" stroke={AI} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ChartFrame>
  )
}

export function SalaryBandChart({ data = SALARY_BAND }) {
  return (
    <ChartFrame title="Comp bands (₹L)" height={210} action={<span className="dl-muted">Hyderabad</span>}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="level" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="p25" stroke={GRID} strokeWidth={1.5} strokeDasharray="4 4" name="P25" />
        <Line type="monotone" dataKey="p50" stroke={PRIMARY} strokeWidth={2.4} name="P50" />
        <Line type="monotone" dataKey="p75" stroke={AI} strokeWidth={1.8} name="P75" />
      </LineChart>
    </ChartFrame>
  )
}

export { ChartFrame }
