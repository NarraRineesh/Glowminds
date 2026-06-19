import AppIcon from '@/components/icons/AppIcon'
import LandingReveal, { LandingRevealItem, LandingRevealStagger } from '@/features/public/components/LandingReveal'
import { LandingSection, LandingSectionTitle, toolIconClass } from '@/features/public/components/landingPageUi'
import { Card, CardContent, CardDescription, CardTitle, cn } from '@/components/ui'

export default function LandingOutcomeGroups({ outcomeGroups }) {
  if (!outcomeGroups?.length) return null

  return (
    <LandingSection>
      <LandingReveal>
        <LandingSectionTitle
          eyebrow="Outcomes"
          title="Everything you need to"
          highlight="get hired"
          subtitle="Not a list of tools — a complete path from resume to offer letter."
        />
      </LandingReveal>
      <div className="space-y-10 md:space-y-12">
        {outcomeGroups.map((group, groupIndex) => (
          <LandingReveal key={group.title} delay={groupIndex * 0.05}>
            <h3 className="mb-4 text-lg font-bold text-foreground md:text-xl">{group.title}</h3>
            <LandingRevealStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <LandingRevealItem key={item.title}>
                  <Card className="h-full border-border/80">
                    <CardContent className="space-y-3 pt-6">
                      <div className={cn('flex size-10 items-center justify-center rounded-lg', toolIconClass(item.icon))}>
                        <AppIcon name={item.icon} className="size-5" />
                      </div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription>{item.desc}</CardDescription>
                    </CardContent>
                  </Card>
                </LandingRevealItem>
              ))}
            </LandingRevealStagger>
          </LandingReveal>
        ))}
      </div>
    </LandingSection>
  )
}
