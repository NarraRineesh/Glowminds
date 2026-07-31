import { PageHeader, SplitRail, Panel, Stepper } from './patterns'
import { AppsLineChart, DonutChart, ScoreTrendChart } from './mocks/Charts'
import { DenseTable, StatStrip } from './mocks/uiAtoms'

export default function DesignSystemGallery() {
  return (
    <div className="os-canvas" style={{ maxWidth: 1100 }}>
      <div className="dl-muted" style={{ fontSize: 12 }}>Design system</div>
      <h2 style={{ margin: '4px 0 8px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>
        Primitives · charts · tables
      </h2>

      <section style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 13, marginBottom: 10 }}>Charts</h3>
        <div className="dl-grid dl-grid-2">
          <AppsLineChart />
          <DonutChart title="Pipeline" centerValue="10" centerLabel="active" />
        </div>
        <div style={{ marginTop: 12 }}>
          <ScoreTrendChart />
        </div>
      </section>

      <section className="dl-card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Stat strip + table</h3>
        <StatStrip stats={[['Apps', '12', '+3'], ['Interviews', '4', '+1'], ['Response', '33%', '+5%'], ['Offers', '0', '—']]} />
        <DenseTable
          columns={['Company', 'Stage', 'Match']}
          rows={[['Vercel', 'Applied', '92%'], ['Stripe', 'Interview', '85%'], ['Linear', 'Applied', '88%']]}
        />
      </section>

      <section className="dl-card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Quiet page header</h3>
        <PageHeader title="Analytics" subtitle="Last 30 days" primaryLabel="Export" />
      </section>

      <section className="dl-card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Stepper</h3>
        <Stepper steps={['Import', 'Audit', 'Rewrite']} active={1} />
      </section>

      <section className="dl-card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Split rail</h3>
        <SplitRail
          main={<Panel title="Main"><p className="dl-muted">Content</p></Panel>}
          rail={<Panel title="Insight" ai><p className="dl-muted">Optional</p></Panel>}
        />
      </section>
    </div>
  )
}
