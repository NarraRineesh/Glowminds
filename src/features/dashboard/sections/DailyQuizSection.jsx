import SectionHeader from '@/components/dashboard/SectionHeader'
import DailyQuizCard from '@/features/dashboard/components/DailyQuizCard'
import { ToolPage, ToolSidebarLayout } from '@/features/dashboard/components/toolSectionLayout'
import { AppIcon, DashboardCard } from '@/components/ui'

const STREAK_TIPS = [
  { ico: 'fire', label: '7-day streak', value: 'Unlocks "Week Warrior" badge' },
  { ico: 'target', label: '30-day streak', value: 'Unlocks "Quiz Master" + 500 XP' },
  { ico: 'brain', label: 'Mix of topics', value: 'Resume · Interview · Negotiation · Tech' },
]

export default function DailyQuizSection() {
  const sidebar = (
    <>
      <DashboardCard titleIcon="trophy" title="Why play?" contentClassName="space-y-3">
        {STREAK_TIPS.map((t) => (
          <div
            key={t.label}
            className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5"
          >
            <AppIcon name={t.ico} className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.value}</p>
            </div>
          </div>
        ))}
      </DashboardCard>

      <DashboardCard titleIcon="lightbulb" title="Pro tip">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Take the quiz first thing each morning — it primes you with one actionable career
          insight before you start applying.
        </p>
      </DashboardCard>
    </>
  )

  return (
    <ToolPage>
      <SectionHeader
        badge="Daily · 1 question"
        badgeClassName="border-purple-500/20 bg-purple-500/10 text-purple-500"
        title="Sharpen your career edge daily"
        accent="career edge"
        subtitle="One quick question every day across resume, interview, negotiation and tech topics. Build a streak — earn XP and unlock badges."
      />

      <ToolSidebarLayout sidebar={sidebar} sidebarRight>
        <DashboardCard
          titleIcon="brain"
          title="Today's question"
          action={<span className="text-xs text-muted-foreground">Updated daily at 12:00 AM</span>}
        >
          <DailyQuizCard />
        </DashboardCard>
      </ToolSidebarLayout>
    </ToolPage>
  )
}
