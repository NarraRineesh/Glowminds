import AppIcon from '@/components/icons/AppIcon'
import LandingReveal from '@/features/public/components/LandingReveal'
import { LandingSection, LandingSectionTitle } from '@/features/public/components/landingPageUi'
import {
  COMPARISON_HEADER_CLASS,
  COMPARISON_ROW_CLASS,
  ComparisonTableShell,
} from '@/features/public/components/publicPageUi'
import { Card, CardContent, cn } from '@/components/ui'

export default function LandingWhyGlowminds({ whyGlowminds }) {
  if (!whyGlowminds) return null

  return (
    <LandingSection muted>
      <LandingReveal>
        <LandingSectionTitle
          title={whyGlowminds.title}
          subtitle={whyGlowminds.subtitle}
        />
      </LandingReveal>
      <LandingReveal>
        <Card className="mx-auto max-w-3xl overflow-hidden">
          <CardContent className="p-0">
            <ComparisonTableShell>
              <div className={COMPARISON_HEADER_CLASS}>
                <span>Feature</span>
                <span className="text-center">Traditional</span>
                <span className="text-center text-primary">Glowminds</span>
              </div>
              {whyGlowminds.rows.map((row, index) => (
                <div
                  key={row.feature}
                  className={cn(
                    COMPARISON_ROW_CLASS,
                    index < whyGlowminds.rows.length - 1 && 'border-b border-border',
                  )}
                >
                  <span className="min-w-0 font-medium text-foreground">{row.feature}</span>
                  <span className="flex justify-center">
                    <AppIcon name="x" className="size-4 text-muted-foreground/50" />
                  </span>
                  <span className="flex justify-center">
                    <AppIcon name="check" className="size-4 text-emerald-500" />
                  </span>
                </div>
              ))}
            </ComparisonTableShell>
          </CardContent>
        </Card>
        {whyGlowminds.closing ? (
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground md:text-base">
            {whyGlowminds.closing}
          </p>
        ) : null}
      </LandingReveal>
    </LandingSection>
  )
}
